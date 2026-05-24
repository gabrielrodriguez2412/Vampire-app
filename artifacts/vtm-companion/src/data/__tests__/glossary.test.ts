import { describe, it, expect } from 'vitest';
import { glossary } from '../glossary';
import { isEditionInScope } from '../../utils/content';
import type { EditionId, LangCode } from '../../types';

/**
 * Glossary content contract.
 *
 * The Glossary page indexes into search and renders multilingual term /
 * definition records via `getText`. These tests defend the invariants
 * the page assumes:
 *
 *   - every entry has a stable, unique id
 *   - every entry has a Spanish term and an English term (the two
 *     locales the project fills today; pt/fr/de/it fall back to EN
 *     at render time, by design — see the `data/glossary.ts` header
 *     comment)
 *   - every entry has a non-empty Spanish definition and a non-empty
 *     English definition (the page shows "[no translation]" for empty
 *     definitions, which is fine for pt/fr/de/it but would be the
 *     localization bug we just fixed for es/en)
 *   - the optional `edition` tag, when present, is one of the
 *     documented values
 *   - every entry declares all six locale keys on both term and
 *     definition, so a future translator can fill them without
 *     touching the type
 *   - every id referenced in a `related` array points at a real
 *     entry in the same file
 */
const REQUIRED_LANGS: LangCode[] = ['es', 'en'];
const ALL_LANGS: LangCode[] = ['es', 'en', 'pt', 'fr', 'de', 'it'];

describe('Glossary data', () => {
  it('has at least one entry', () => {
    expect(glossary.length).toBeGreaterThan(0);
  });

  it('uses unique stable ids', () => {
    const ids = glossary.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const lang of REQUIRED_LANGS) {
    it(`[${lang}] every entry has a non-empty term and definition`, () => {
      for (const entry of glossary) {
        const term = entry.term[lang];
        const def = entry.definition[lang];
        expect((term || '').trim().length, `${entry.id}.term.${lang} must be non-empty`).toBeGreaterThan(0);
        expect((def || '').trim().length, `${entry.id}.definition.${lang} must be non-empty`).toBeGreaterThan(0);
      }
    });
  }

  it('declares every supported locale on term and definition', () => {
    for (const entry of glossary) {
      for (const lang of ALL_LANGS) {
        expect(entry.term, `${entry.id}.term is missing ${lang}`).toHaveProperty(lang);
        expect(entry.definition, `${entry.id}.definition is missing ${lang}`).toHaveProperty(lang);
      }
    }
  });

  it('uses a documented edition tag when present', () => {
    for (const entry of glossary) {
      const ed = entry.edition;
      expect(
        ed === undefined || ed === null || ed === 'v5' || ed === 'classic',
        `${entry.id}.edition must be null/undefined/'v5'/'classic' (got ${String(ed)})`,
      ).toBe(true);
    }
  });

  it('resolves every `related` id against the same file', () => {
    const ids = new Set(glossary.map(g => g.id));
    for (const entry of glossary) {
      for (const rel of entry.related) {
        expect(
          ids.has(rel),
          `${entry.id} references unknown related id "${rel}"`,
        ).toBe(true);
      }
    }
  });

  // Distribution check matching the user-visible filter behavior. The
  // original Batch B QA finding was V5-only cards (Hunger, Touchstone,
  // Predator Type, etc.) appearing while V20 was selected.
  describe('edition distribution', () => {
    it('has at least one universal, one v5, and one classic entry', () => {
      expect(glossary.some(g => g.edition === null || g.edition === undefined)).toBe(true);
      expect(glossary.some(g => g.edition === 'v5')).toBe(true);
      expect(glossary.some(g => g.edition === 'classic')).toBe(true);
    });

    const CLASSIC_EDITIONS: EditionId[] = ['V20', 'REVISED', '2ND', '1ST'];

    it('on V5, hides every classic-only entry', () => {
      const visible = glossary.filter(g => isEditionInScope(g.edition, 'V5'));
      for (const entry of visible) {
        expect(entry.edition, `${entry.id} should not appear in V5`).not.toBe('classic');
      }
      const v5 = glossary.filter(g => g.edition === 'v5');
      for (const entry of v5) {
        expect(visible.includes(entry), `${entry.id} (v5) should appear in V5`).toBe(true);
      }
    });

    it.each(CLASSIC_EDITIONS)('on %s, hides every v5-only entry', edition => {
      const visible = glossary.filter(g => isEditionInScope(g.edition, edition));
      for (const entry of visible) {
        expect(entry.edition, `${entry.id} should not appear in ${edition}`).not.toBe('v5');
      }
      const classic = glossary.filter(g => g.edition === 'classic');
      for (const entry of classic) {
        expect(visible.includes(entry), `${entry.id} (classic) should appear in ${edition}`).toBe(true);
      }
    });
  });
});
