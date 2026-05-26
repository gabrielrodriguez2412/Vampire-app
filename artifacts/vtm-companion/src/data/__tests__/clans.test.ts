import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { clans } from '../clans';
import { disciplines } from '../disciplines';
import { EDITION_LIST } from '../editions';
import { getClanSect } from '../../utils/content';
import type { ClanEntry, EditionId } from '../../types';

function clanById(id: string): ClanEntry {
  const c = clans.find(x => x.id === id);
  if (!c) throw new Error(`fixture: missing clan ${id} in data/clans.ts`);
  return c;
}

const editionIds = new Set(EDITION_LIST.map(e => e.id));
const disciplineIds = new Set(disciplines.map(d => d.id));

// Resolve the public asset directory once. The test file lives in
// `src/data/__tests__/`, the assets in `public/images/`.
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../../../public');

describe('clans data', () => {
  it('has unique ids', () => {
    const ids = clans.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every clan has at least one edition and all are known', () => {
    for (const c of clans) {
      expect(c.editionAvailability.length, `${c.id} should declare editions`).toBeGreaterThan(0);
      for (const ed of c.editionAvailability) {
        expect(editionIds.has(ed), `${c.id} references unknown edition ${ed}`).toBe(true);
      }
    }
  });

  it('every clan has a non-empty english name', () => {
    for (const c of clans) {
      expect((c.name.en || '').trim().length, `${c.id} missing English name`).toBeGreaterThan(0);
    }
  });

  it('every clan has a non-empty english summary', () => {
    for (const c of clans) {
      expect((c.summary.en || '').trim().length, `${c.id} missing English summary`).toBeGreaterThan(0);
    }
  });

  it('every discipline referenced by a clan exists in the disciplines table', () => {
    for (const c of clans) {
      for (const dId of c.disciplines) {
        expect(disciplineIds.has(dId), `Clan ${c.id} references unknown discipline ${dId}`).toBe(true);
      }
    }
  });
});

describe('clan banner images', () => {
  it('every clan declares a bannerImage', () => {
    for (const c of clans) {
      expect((c.bannerImage || '').trim().length, `${c.id} missing bannerImage`).toBeGreaterThan(0);
    }
  });

  it('every bannerImage is an absolute path under /', () => {
    for (const c of clans) {
      expect(
        c.bannerImage.startsWith('/'),
        `${c.id}.bannerImage should be an absolute path, got ${c.bannerImage}`
      ).toBe(true);
    }
  });

  // Drift guard: any PNG path declared on a clan must point to a real file
  // under `public/`. Catches typos and renames before they hit the browser.
  // The shared `/images/opengraph.jpg` placeholder is also checked.
  it('every bannerImage path resolves to a real file on disk', () => {
    const seen = new Set<string>();
    for (const c of clans) seen.add(c.bannerImage);
    for (const path of seen) {
      const fsPath = resolve(publicDir, '.' + path);
      expect(existsSync(fsPath), `missing asset ${path} (looked at ${fsPath})`).toBe(true);
    }
  });
});

/**
 * Sect-by-edition correctness (Batch G).
 *
 * These cases pin the specific edition × clan sect assignments that
 * the audit corrected so a future content edit cannot silently
 * regress them. The assertions are deliberately narrow — only the
 * clans whose label *actually changes* between editions are tested,
 * so adding a new clan or tweaking a label for an untested clan
 * does not require updating this block.
 */
describe('clan sect assignment by edition', () => {
  const EN = 'en' as const;

  it('Lasombra is Sabbat in 1st/2nd/Revised/V20 and Camarilla in V5', () => {
    const lasombra = clanById('lasombra');
    const classicEditions: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20'];
    for (const ed of classicEditions) {
      // Catches the previous bug where the default label included
      // "Camarilla" alongside Sabbat in editions where Lasombra were
      // Sabbat-only.
      expect(getClanSect(lasombra, ed, EN), `Lasombra sect in ${ed}`)
        .toBe('Sabbat');
    }
    expect(getClanSect(lasombra, 'V5', EN)).toBe('Camarilla');
  });

  it('Assamite is Independent in classic editions and Camarilla in V5', () => {
    const assamite = clanById('assamite');
    const classicEditions: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20'];
    for (const ed of classicEditions) {
      expect(getClanSect(assamite, ed, EN), `Assamite sect in ${ed}`)
        .toBe('Independent');
    }
    expect(getClanSect(assamite, 'V5', EN)).toBe('Camarilla');
  });

  it('Gangrel is Camarilla in 1st/2nd, Independent/Anarch from Revised onward', () => {
    const gangrel = clanById('gangrel');
    expect(getClanSect(gangrel, '1ST', EN)).toBe('Camarilla');
    expect(getClanSect(gangrel, '2ND', EN)).toBe('Camarilla');
    const modernEditions: EditionId[] = ['REVISED', 'V20', 'V5'];
    for (const ed of modernEditions) {
      expect(getClanSect(gangrel, ed, EN), `Gangrel sect in ${ed}`)
        .toBe('Independent / Anarch');
    }
  });

  it('Ventrue stays Camarilla across every edition', () => {
    // Sanity case — Ventrue affiliation does NOT change. Catches a
    // regression where a per-edition override is accidentally added.
    const ventrue = clanById('ventrue');
    for (const ed of EDITION_LIST.map(e => e.id)) {
      expect(getClanSect(ventrue, ed, EN), `Ventrue sect in ${ed}`)
        .toBe('Camarilla');
    }
  });

  it('Brujah retains the Camarilla-first label in classic and Anarch-first in V5', () => {
    // Pins the intentional left/right ordering on the mixed label so a
    // future translator doesn't reorder it without thinking about
    // which sect is the dominant affiliation per edition.
    const brujah = clanById('brujah');
    expect(getClanSect(brujah, 'V20', EN)).toBe('Camarilla / Anarch');
    expect(getClanSect(brujah, 'V5', EN)).toBe('Anarch / Camarilla');
  });
});

/**
 * Spanish body-text coverage (Batch G2).
 *
 * Batch G2 added Spanish translations for the most-viewed clans across
 * summary, weakness, and lore. These cases pin that coverage so a
 * future content edit cannot silently revert a clan back to the
 * English-only state and trigger the "EN" fallback chip in Spanish
 * mode again. Intentionally narrow scope — only the prioritized
 * clans are checked; the rest may still rely on the EN fallback and
 * surface the chip, which is the documented intentional state.
 */
describe('Spanish clan body translation coverage', () => {
  const PRIORITIZED_CLAN_IDS = [
    'brujah',
    'gangrel',
    'malkavian',
    'nosferatu',
    'ventrue',
    'tzimisce',
    'lasombra',
  ] as const;

  const FIELDS: Array<'summary' | 'weakness' | 'lore'> = [
    'summary',
    'weakness',
    'lore',
  ];

  for (const id of PRIORITIZED_CLAN_IDS) {
    for (const field of FIELDS) {
      it(`${id}.${field} has non-empty Spanish text`, () => {
        const clan = clanById(id);
        const value = clan[field].es;
        expect(
          (value || '').trim().length,
          `${id}.${field}.es should not be empty after Batch G2`,
        ).toBeGreaterThan(0);
      });

      it(`${id}.${field} Spanish text is distinct from English`, () => {
        // Catches accidental copy-paste regressions where someone
        // duplicates the EN into ES instead of translating.
        const clan = clanById(id);
        expect(clan[field].es).not.toBe(clan[field].en);
      });
    }
  }
});
