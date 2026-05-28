import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { clans } from '../clans';
import { disciplines } from '../disciplines';
import { EDITION_LIST } from '../editions';
import {
  getClanSect,
  getClanSummaryRecord,
  getClanLoreRecord,
  getClanWeaknessRecord,
  getLocalizedClanSummary,
  getLocalizedClanLore,
  getLocalizedClanWeakness,
  getClanDisciplinesForEdition,
} from '../../utils/content';
import type { ClanEntry, EditionId, LangCode } from '../../types';

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
 * Spanish body-text coverage (Batch G2 + Batch J).
 *
 * Batch G2 added Spanish translations for the seven most-viewed
 * clans across summary, weakness, and lore. Batch J extended that
 * coverage to the remaining nine clans (Toreador, Tremere, Assamite,
 * Followers of Set, Giovanni, Ravnos, Salubri, Caitiff, Thin-Blood).
 *
 * The test pins **every clan** now — going forward, every clan body
 * field must carry a non-empty Spanish string distinct from the
 * English one. If a new clan is added without a Spanish translation,
 * this test fails loudly rather than silently shipping the loud
 * "EN" fallback chip on yet another clan card.
 */
describe('Spanish clan body translation coverage', () => {
  const FIELDS: Array<'summary' | 'weakness' | 'lore'> = [
    'summary',
    'weakness',
    'lore',
  ];

  for (const clan of clans) {
    for (const field of FIELDS) {
      it(`${clan.id}.${field} has non-empty Spanish text`, () => {
        const value = clan[field].es;
        expect(
          (value || '').trim().length,
          `${clan.id}.${field}.es should not be empty`,
        ).toBeGreaterThan(0);
      });

      it(`${clan.id}.${field} Spanish text is distinct from English`, () => {
        // Catches accidental copy-paste regressions where someone
        // duplicates the EN into ES instead of translating.
        expect(clan[field].es).not.toBe(clan[field].en);
      });
    }
  }
});

/**
 * Edition-aware clan body resolution (Batch T).
 *
 * The clan detail page previously rendered the flat `summary`, `lore`,
 * and `weakness` records as-is — and several of those records baked
 * "in earlier editions X, in V5 Y" prose into a single paragraph, so
 * the user saw mixed-era text under what was supposed to be an
 * edition-specific page. Batch T introduces three optional override
 * maps (`summaryByEdition`, `loreByEdition`, `weaknessByEdition`) and
 * three resolvers (`getClanSummaryRecord`, `getClanLoreRecord`,
 * `getClanWeaknessRecord`) so each edition shows its own clean text.
 *
 * These tests pin:
 *   - Affected clans (Tremere, Assamite, Followers of Set, Giovanni,
 *     Ravnos) have *different* visible text between V20 and V5 in
 *     both EN and ES.
 *   - Anti-leak: V20 weakness / lore does NOT contain V5-specific
 *     keywords (Banu Haqim, Hecata, The Ministry, El Ministerio,
 *     Anarch alliance, Week of Nightmares, Camarilla joining …),
 *     and V5 weakness / lore does NOT contain classic-era keywords
 *     (Assamite / Asamita, Giovanni — except where it's still a
 *     legitimate ancestor mention, etc.).
 *   - Clans we deliberately left flat (e.g. Brujah, Lasombra, Caitiff,
 *     Thin-Blood) still resolve correctly through the helper.
 *
 * Catches the next regression class: someone re-flattens a clan's
 * lore/weakness into "X in earlier editions, Y in V5" prose, or adds a
 * V5 rebrand back into a V20-edition string.
 */
describe('edition-aware clan body resolution (Batch T)', () => {
  const find = (id: string): ClanEntry => {
    const c = clans.find(x => x.id === id);
    if (!c) throw new Error(`fixture: missing clan ${id}`);
    return c;
  };

  /**
   * For each clan with an override, the visible V20 paragraph must be
   * a different string from the visible V5 paragraph. Caught the
   * Tremere / Assamite "in earlier editions, in V5" double-baked
   * paragraph.
   */
  it('weakness differs between V20 and V5 for clans with overrides', () => {
    const clansWithWeaknessOverride = ['tremere', 'assamite'];
    for (const id of clansWithWeaknessOverride) {
      const c = find(id);
      for (const lang of ['en', 'es'] as LangCode[]) {
        const v20 = getLocalizedClanWeakness(c, 'V20', lang).text;
        const v5  = getLocalizedClanWeakness(c, 'V5',  lang).text;
        expect(v20, `${id} V20 ${lang} weakness should resolve`).toBeTruthy();
        expect(v5,  `${id} V5  ${lang} weakness should resolve`).toBeTruthy();
        expect(v20, `${id} weakness in V20 ${lang} must differ from V5`).not.toBe(v5);
      }
    }
  });

  it('lore differs between V20 and V5 for clans with overrides', () => {
    const clansWithLoreOverride = [
      'tremere',
      'assamite',
      'followers_of_set',
      'giovanni',
      'ravnos',
    ];
    for (const id of clansWithLoreOverride) {
      const c = find(id);
      for (const lang of ['en', 'es'] as LangCode[]) {
        const v20 = getLocalizedClanLore(c, 'V20', lang).text;
        const v5  = getLocalizedClanLore(c, 'V5',  lang).text;
        expect(v20, `${id} V20 ${lang} lore should resolve`).toBeTruthy();
        expect(v5,  `${id} V5  ${lang} lore should resolve`).toBeTruthy();
        expect(v20, `${id} lore in V20 ${lang} must differ from V5`).not.toBe(v5);
      }
    }
  });

  /**
   * Anti-leak guard. The user-facing copy on a V20 page must not
   * contain V5-only naming or framing, and vice versa. The test runs
   * against every clan + every (edition × lang) combination so a
   * future copy edit that drops a V5 keyword into a classic paragraph
   * fails loudly.
   *
   * Keywords are conservative on purpose: they match phrases that are
   * unambiguously edition-specific (a rebrand name or a V5-only
   * event). Things like "Camarilla" or "Anarch" can legitimately
   * appear in any edition and are NOT flagged.
   */
  it('V20 lore + weakness do not leak V5-specific naming for any clan', () => {
    const V5_ONLY_TERMS = [
      // V5 clan rebrands. These are also the V5 alternateNames; they
      // must never appear in a V20 paragraph.
      'Banu Haqim',
      'Hecata',
      'The Ministry',
      'El Ministerio',
      // V5-only events / terms.
      'Week of Nightmares',
      'Semana de Pesadillas',
      // Batch T follow-up: the Beckoning and the Lasombra mass
      // defection to the Camarilla are V5-era plot beats that must
      // not appear in any classic Lasombra paragraph.
      'Beckoning',
      'Llamado',
      // Batch T follow-up: V5 thin-blood vocabulary that must not
      // leak into classic editions where the framing is "high-
      // generation heralds of Gehenna" instead.
      'Duskborn',
      'Nacidos del Crepúsculo',
      'Thin-Blood Alchemy',
      'Alquimia de Sangre Débil',
      // V20 caps generation at 15th; "16th generation" / "16 gen"
      // wording is V5-specific.
      '16th generation',
      'generación 16',
      'generaciones 14, 15 y 16',
    ];
    const classicEditions: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20'];
    for (const clan of clans) {
      for (const ed of classicEditions) {
        for (const lang of ['en', 'es'] as LangCode[]) {
          const lore = getLocalizedClanLore(clan, ed, lang).text ?? '';
          const weakness = getLocalizedClanWeakness(clan, ed, lang).text ?? '';
          const summary = getLocalizedClanSummary(clan, ed, lang).text ?? '';
          for (const term of V5_ONLY_TERMS) {
            expect(
              lore.includes(term),
              `${clan.id} ${ed} ${lang} lore leaks V5 term "${term}"`,
            ).toBe(false);
            expect(
              weakness.includes(term),
              `${clan.id} ${ed} ${lang} weakness leaks V5 term "${term}"`,
            ).toBe(false);
            expect(
              summary.includes(term),
              `${clan.id} ${ed} ${lang} summary leaks V5 term "${term}"`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('V5 lore + weakness do not leak classic-era naming for the renamed clans', () => {
    // V5 rebrands the clan name — V5 paragraphs for these clans must
    // not refer back to the old name (which is what the V20 entries
    // use). Other clans whose name didn't change (Brujah, Lasombra…)
    // can use their name freely in V5 paragraphs.
    const renamedClans: Array<{ id: string; classicTerms: string[] }> = [
      { id: 'assamite',         classicTerms: ['Assamite', 'Assamita', 'Asamita'] },
      { id: 'giovanni',         classicTerms: ['Giovanni'] },
      { id: 'followers_of_set', classicTerms: ['Followers of Set', 'Seguidores de Set'] },
    ];
    for (const { id, classicTerms } of renamedClans) {
      const c = find(id);
      for (const lang of ['en', 'es'] as LangCode[]) {
        const lore = getLocalizedClanLore(c, 'V5', lang).text ?? '';
        const weakness = getLocalizedClanWeakness(c, 'V5', lang).text ?? '';
        for (const term of classicTerms) {
          expect(
            lore.includes(term),
            `${id} V5 ${lang} lore leaks classic-era term "${term}"`,
          ).toBe(false);
          expect(
            weakness.includes(term),
            `${id} V5 ${lang} weakness leaks classic-era term "${term}"`,
          ).toBe(false);
        }
      }
    }
  });

  /**
   * Clans without overrides must still resolve. This catches a
   * future helper bug that accidentally requires the override map.
   */
  it('clans without overrides fall back to the flat field for both editions', () => {
    // Lasombra and thin_blood got per-edition splits in the Batch T
    // follow-up; they're no longer flat-only. The clans below have
    // no overrides on any of the three fields and must still resolve
    // correctly via fallback.
    const flatOnlyClans = ['brujah', 'gangrel', 'malkavian', 'caitiff'];
    for (const id of flatOnlyClans) {
      const c = find(id);
      // Both helpers should return the same string as the flat field
      // when no override is defined.
      expect(getClanSummaryRecord(c, 'V20')).toBe(c.summary);
      expect(getClanSummaryRecord(c, 'V5')).toBe(c.summary);
      expect(getClanLoreRecord(c, 'V20')).toBe(c.lore);
      expect(getClanLoreRecord(c, 'V5')).toBe(c.lore);
      expect(getClanWeaknessRecord(c, 'V20')).toBe(c.weakness);
      expect(getClanWeaknessRecord(c, 'V5')).toBe(c.weakness);
    }
  });

  /**
   * Specific manual-QA cases the user listed. Pinned as direct
   * value assertions so the test failure message tells you exactly
   * which clan × edition × language regressed.
   */
  it('Assamite weakness is curse-only in V20 and addiction-only in V5 (EN+ES)', () => {
    const assamite = find('assamite');
    // V20 EN: must contain "Curse" but not "addiction" / "Addiction"
    const v20En = getLocalizedClanWeakness(assamite, 'V20', 'en').text ?? '';
    expect(v20En.toLowerCase()).toContain('curse');
    expect(v20En.toLowerCase()).not.toContain('addiction');
    // V5 EN: must contain "Addiction" but not "curse"
    const v5En = getLocalizedClanWeakness(assamite, 'V5', 'en').text ?? '';
    expect(v5En.toLowerCase()).toContain('addiction');
    expect(v5En.toLowerCase()).not.toContain('curse');
    // V20 ES: maldición no adicción
    const v20Es = getLocalizedClanWeakness(assamite, 'V20', 'es').text ?? '';
    expect(v20Es.toLowerCase()).toContain('maldición');
    expect(v20Es.toLowerCase()).not.toContain('adicción');
    // V5 ES: adicción no maldición
    const v5Es = getLocalizedClanWeakness(assamite, 'V5', 'es').text ?? '';
    expect(v5Es.toLowerCase()).toContain('adicción');
    expect(v5Es.toLowerCase()).not.toContain('maldición');
  });

  it('Tremere weakness is elder-bond in V20 and thin-blood in V5 (EN+ES)', () => {
    const tremere = find('tremere');
    const v20En = getLocalizedClanWeakness(tremere, 'V20', 'en').text ?? '';
    const v5En  = getLocalizedClanWeakness(tremere, 'V5',  'en').text ?? '';
    expect(v20En.toLowerCase()).toContain('elder');
    expect(v5En.toLowerCase()).toContain('thin');
    // Neither paragraph should mention the other edition's flavour.
    expect(v20En.toLowerCase()).not.toContain('thin');
    expect(v5En.toLowerCase()).not.toContain('elder');
  });

  it('Giovanni lore is family-merchant in V20 and Hecata-fusion in V5', () => {
    const giovanni = find('giovanni');
    const v20En = getLocalizedClanLore(giovanni, 'V20', 'en').text ?? '';
    const v5En  = getLocalizedClanLore(giovanni, 'V5',  'en').text ?? '';
    expect(v20En).toContain('Giovanni');
    expect(v20En).not.toContain('Hecata');
    expect(v5En).toContain('Hecata');
    expect(v5En).not.toContain('Giovanni'); // V5 paragraph drops the old name entirely
  });

  /**
   * Batch T follow-up: Lasombra V20 must not include V5-era plot
   * beats (the Beckoning, the Camarilla defection, Oblivion, the
   * V5-only modern-recording-devices weakness), and disciplines must
   * stay on the classic Obtenebration list — not the V5 Oblivion.
   */
  it('Lasombra V20 lore is classic Sabbat-leader framing without V5 plot beats', () => {
    const lasombra = find('lasombra');
    for (const lang of ['en', 'es'] as LangCode[]) {
      const lore = getLocalizedClanLore(lasombra, 'V20', lang).text ?? '';
      expect(lore).toBeTruthy();
      // V5 plot vocabulary — must not appear.
      expect(lore).not.toMatch(/\bBeckoning\b/i);
      expect(lore).not.toMatch(/\bLlamado\b/i);
      expect(lore).not.toMatch(/\bOblivion\b/i);
      expect(lore).not.toMatch(/\bOlvido\b/i);
      // V5 "joined the Camarilla / defection" framing.
      expect(lore.toLowerCase()).not.toContain('joined the camarilla');
      expect(lore.toLowerCase()).not.toContain('unirse a la camarilla');
      expect(lore.toLowerCase()).not.toContain('desertó a la camarilla');
      expect(lore.toLowerCase()).not.toContain('defected to the camarilla');
      // V20 framing positive checks (case-insensitive so we don't
      // get bitten by punctuation/capitalisation noise).
      expect(lore.toLowerCase()).toContain('sabbat');
    }
  });

  it('Lasombra V20 weakness is classic reflection-only, no modern-tech glitch wording', () => {
    const lasombra = find('lasombra');
    for (const lang of ['en', 'es'] as LangCode[]) {
      const weakness = getLocalizedClanWeakness(lasombra, 'V20', lang).text ?? '';
      expect(weakness).toBeTruthy();
      // V5 modern-tech / recording-device leakage — must not appear.
      expect(weakness.toLowerCase()).not.toContain('recording device');
      expect(weakness.toLowerCase()).not.toContain('dispositivo');
      expect(weakness.toLowerCase()).not.toContain('glitch');
      expect(weakness.toLowerCase()).not.toContain('falla');
      expect(weakness.toLowerCase()).not.toContain('distorted');
      expect(weakness.toLowerCase()).not.toContain('distorsionada');
      // Classic reflection wording positive check.
      expect(weakness.toLowerCase()).toMatch(/reflection|reflejo/);
    }
  });

  it('Lasombra V20 disciplines include Obtenebration and not Oblivion', () => {
    const lasombra = find('lasombra');
    const v20 = getClanDisciplinesForEdition(lasombra, 'V20');
    expect(v20).toContain('obtenebration');
    expect(v20).not.toContain('oblivion');
    const v5 = getClanDisciplinesForEdition(lasombra, 'V5');
    expect(v5).toContain('oblivion');
    expect(v5).not.toContain('obtenebration');
  });

  it('Lasombra V5 content remains V5-appropriate after the V20 cleanup', () => {
    // Sanity check: the V20 cleanup must not have overwritten the
    // V5 paragraphs. V5 Lasombra still get the Camarilla-defection
    // framing in their lore and the distortion weakness.
    const lasombra = find('lasombra');
    const v5LoreEn = getLocalizedClanLore(lasombra, 'V5', 'en').text ?? '';
    const v5WeaknessEn = getLocalizedClanWeakness(lasombra, 'V5', 'en').text ?? '';
    expect(v5LoreEn.toLowerCase()).toContain('camarilla');
    expect(v5WeaknessEn.toLowerCase()).toMatch(/distorted|recording/);
  });

  /**
   * Batch T follow-up: Thin-Blood V20 must not include V5-only
   * Duskborn / Alchemy / 16th-generation framing.
   */
  it('Thin-Blood V20 lore avoids V5 Duskborn + Alchemy + 16th-gen framing', () => {
    const tb = find('thin_blood');
    for (const lang of ['en', 'es'] as LangCode[]) {
      const lore = getLocalizedClanLore(tb, 'V20', lang).text ?? '';
      const weakness = getLocalizedClanWeakness(tb, 'V20', lang).text ?? '';
      const summary = getLocalizedClanSummary(tb, 'V20', lang).text ?? '';
      for (const term of ['Duskborn', 'Nacidos del Crepúsculo', 'Thin-Blood Alchemy', 'Alquimia de Sangre Débil', '16th generation', 'generación 16', 'generaciones 14, 15 y 16']) {
        expect(lore, `V20 ${lang} lore must not contain "${term}"`).not.toContain(term);
        expect(weakness, `V20 ${lang} weakness must not contain "${term}"`).not.toContain(term);
        expect(summary, `V20 ${lang} summary must not contain "${term}"`).not.toContain(term);
      }
      // Positive V20 framing: Gehenna / Final Nights vocabulary.
      expect(lore.toLowerCase()).toMatch(/gehenna|final nights|noches finales/);
    }
  });

  it('Thin-Blood V5 still contains the Duskborn / Alchemy framing intentionally', () => {
    const tb = find('thin_blood');
    const v5LoreEn = getLocalizedClanLore(tb, 'V5', 'en').text ?? '';
    const v5WeaknessEn = getLocalizedClanWeakness(tb, 'V5', 'en').text ?? '';
    expect(v5LoreEn).toContain('Duskborn');
    expect(v5LoreEn).toContain('Thin-Blood Alchemy');
    expect(v5WeaknessEn).toContain('Duskborn');
  });
});
