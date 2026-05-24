import { describe, it, expect } from 'vitest';
import { UI_STRINGS } from '../ui';
import type { LangCode } from '../../types';

/**
 * Roleplay / Glossary surface i18n keys.
 *
 * Batch B introduced a small set of UI labels (edition badges and the
 * "Related:" label that used to be hardcoded Spanish in glossary.tsx).
 * These tests defend the keys across every supported locale so a
 * future translation pass cannot silently let the Spanish label leak
 * back into English mode.
 */
const LANG_CODES: LangCode[] = ['es', 'en', 'pt', 'fr', 'de', 'it'];

const REQUIRED_KEYS = [
  'roleplay_edition_v5',
  'roleplay_edition_classic',
  'glossary_related',
  'glossary_edition_v5',
  'glossary_edition_classic',
  'glossary_edition_v5_tooltip',
  'glossary_edition_classic_tooltip',
] as const;

describe('Roleplay + Glossary label i18n parity', () => {
  for (const lang of LANG_CODES) {
    const strings = UI_STRINGS[lang];

    it(`[${lang}] defines every Batch B label key`, () => {
      expect(strings, `UI_STRINGS missing entry for ${lang}`).toBeDefined();
      for (const key of REQUIRED_KEYS) {
        const value = strings[key];
        expect(
          typeof value,
          `${lang}.${key} should be a string, got ${typeof value}`,
        ).toBe('string');
        expect(
          (value || '').trim().length,
          `${lang}.${key} must be non-empty`,
        ).toBeGreaterThan(0);
      }
    });

    it(`[${lang}] does not let the Spanish 'Relacionado:' label leak into a non-ES locale`, () => {
      const label = strings.glossary_related;
      if (lang === 'es') {
        // Spanish should obviously contain the word.
        expect(label.toLowerCase()).toContain('relacion');
      } else {
        // Everyone else should NOT use the Spanish label — that was the
        // original Batch B bug. We do not check for the exact translation
        // (translators need room), just that it's not the Spanish word.
        expect(label.toLowerCase()).not.toBe('relacionado:');
        expect(label.toLowerCase()).not.toBe('relacionado');
      }
    });
  }
});
