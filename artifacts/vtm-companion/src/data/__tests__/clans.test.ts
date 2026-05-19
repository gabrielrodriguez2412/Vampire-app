import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { clans } from '../clans';
import { disciplines } from '../disciplines';
import { EDITION_LIST } from '../editions';

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
