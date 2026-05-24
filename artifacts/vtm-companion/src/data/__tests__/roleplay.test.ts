import { describe, it, expect } from 'vitest';
import { roleplay } from '../roleplay';
import { isEditionInScope } from '../../utils/content';
import type { EditionId, LangCode } from '../../types';

/**
 * Roleplay localization is the headline bug Batch B fixes — the old
 * page rendered hardcoded Spanish in every locale, including English.
 * These tests pin the contract that prevents the regression:
 *
 *   - every tip has both a Spanish AND an English title
 *   - every tip has at least one Spanish AND at least one English bullet
 *   - bullet counts match across the two filled locales (no half-
 *     translated tips that look ragged in one language)
 *   - non-EN/ES locales may be empty (they fall back to EN at render
 *     time via `getLocalizedArray`); the test asserts they exist on
 *     the shape so future contributors can fill them
 *   - the edition tag is one of the documented values
 *
 * The tests intentionally don't check the *content* of any string —
 * translators need room to phrase things naturally.
 */
const REQUIRED_LANGS: LangCode[] = ['es', 'en'];
const ALL_LANGS: LangCode[] = ['es', 'en', 'pt', 'fr', 'de', 'it'];

describe('Roleplay data localization', () => {
  it('has at least one tip', () => {
    expect(roleplay.length).toBeGreaterThan(0);
  });

  it('uses unique stable ids', () => {
    const ids = roleplay.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const lang of REQUIRED_LANGS) {
    it(`[${lang}] every tip has a non-empty title`, () => {
      for (const tip of roleplay) {
        const title = tip.title[lang];
        expect(typeof title, `${tip.id}.title.${lang} should be a string`).toBe('string');
        expect(
          (title || '').trim().length,
          `${tip.id}.title.${lang} must be non-empty`,
        ).toBeGreaterThan(0);
      }
    });

    it(`[${lang}] every tip has at least one bullet`, () => {
      for (const tip of roleplay) {
        const bullets = tip.content[lang];
        expect(Array.isArray(bullets), `${tip.id}.content.${lang} should be an array`).toBe(true);
        expect(bullets.length, `${tip.id}.content.${lang} must have at least one bullet`).toBeGreaterThan(0);
        for (let i = 0; i < bullets.length; i++) {
          expect(
            (bullets[i] || '').trim().length,
            `${tip.id}.content.${lang}[${i}] must be non-empty`,
          ).toBeGreaterThan(0);
        }
      }
    });
  }

  it('keeps the EN and ES bullet counts in sync', () => {
    // If a translator adds a bullet to one locale, they should add it to
    // the other so the page does not look ragged when the user switches.
    for (const tip of roleplay) {
      expect(
        tip.content.en.length,
        `${tip.id} EN and ES bullet counts must match`,
      ).toBe(tip.content.es.length);
    }
  });

  it('declares every supported locale on every field', () => {
    for (const tip of roleplay) {
      for (const lang of ALL_LANGS) {
        expect(tip.title, `${tip.id}.title is missing ${lang}`).toHaveProperty(lang);
        expect(tip.content, `${tip.id}.content is missing ${lang}`).toHaveProperty(lang);
      }
    }
  });

  it('uses a documented edition tag', () => {
    for (const tip of roleplay) {
      expect(
        [null, 'v5', 'classic'].includes(tip.edition as unknown as string | null),
        `${tip.id}.edition must be null, 'v5', or 'classic' (got ${String(tip.edition)})`,
      ).toBe(true);
    }
  });

  // The QA bug we are fixing was that V5-only cards leaked into V20.
  // These tests pin the post-fix distribution so the page can never
  // again render a card that contradicts the selected edition.
  describe('edition distribution', () => {
    it('has at least one universal, one v5, and one classic tip', () => {
      expect(roleplay.some(t => t.edition === null)).toBe(true);
      expect(roleplay.some(t => t.edition === 'v5')).toBe(true);
      expect(roleplay.some(t => t.edition === 'classic')).toBe(true);
    });

    const CLASSIC_EDITIONS: EditionId[] = ['V20', 'REVISED', '2ND', '1ST'];

    it('on V5, hides every classic-only tip', () => {
      const visible = roleplay.filter(t => isEditionInScope(t.edition, 'V5'));
      for (const tip of visible) {
        expect(tip.edition, `${tip.id} should not appear in V5`).not.toBe('classic');
      }
      // And every v5 tip must be visible.
      const v5Tips = roleplay.filter(t => t.edition === 'v5');
      for (const tip of v5Tips) {
        expect(visible.includes(tip), `${tip.id} (v5) should appear in V5`).toBe(true);
      }
    });

    it.each(CLASSIC_EDITIONS)('on %s, hides every v5-only tip', edition => {
      const visible = roleplay.filter(t => isEditionInScope(t.edition, edition));
      for (const tip of visible) {
        expect(tip.edition, `${tip.id} should not appear in ${edition}`).not.toBe('v5');
      }
      // And every classic tip must be visible.
      const classicTips = roleplay.filter(t => t.edition === 'classic');
      for (const tip of classicTips) {
        expect(visible.includes(tip), `${tip.id} (classic) should appear in ${edition}`).toBe(true);
      }
    });
  });
});
