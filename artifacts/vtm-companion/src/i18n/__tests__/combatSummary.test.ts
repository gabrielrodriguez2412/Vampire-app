import { describe, it, expect } from 'vitest';
import { UI_STRINGS } from '../ui';
import type { LangCode } from '../../types';

/**
 * Tools → Combat Summary became edition-aware in the mobile-QA batch:
 * the page now renders different copy for V5 vs. the classic editions
 * (1st / 2nd / Revised / V20). These tests pin that contract so a
 * future translation pass cannot silently regress a locale to the old
 * single-block copy — the page would still render *something* via the
 * fallback chain in tools.tsx, but the V5 / Classic distinction would
 * collapse and the user-visible bug we just fixed would come back.
 *
 * Scope is intentionally narrow:
 *   - Every supported language must have all V5 keys + all classic
 *     keys + both labels.
 *   - The strings must be non-empty.
 *   - The pool / ones / damage classic strings must mention concepts
 *     that distinguish the classic resolver from the V5 one. We don't
 *     assert exact wording (translators need room) — just that the
 *     classic copy is not a verbatim copy of the V5 melee/superficial
 *     blocks the page used to share.
 */
const LANG_CODES: LangCode[] = ['es', 'en', 'pt', 'fr', 'de', 'it'];

const V5_KEYS = [
  'combat_v5_melee',
  'combat_v5_ranged',
  'combat_v5_superficial',
  'combat_v5_aggravated',
  'combat_v5_hunger_note',
] as const;

const CLASSIC_KEYS = [
  'combat_classic_pool',
  'combat_classic_ones',
  'combat_classic_damage',
  'combat_classic_note',
  // Batch F added a "pending detailed review" hint that the Tools
  // page renders only when 1st / 2nd Edition is the active classic
  // edition. Every locale must define it so the UI does not silently
  // fall back to no warning for those abstracted editions.
  'combat_classic_legacy_review_note',
] as const;

const LABEL_KEYS = [
  'combat_summary_v5_label',
  'combat_summary_classic_label',
] as const;

describe('Tools combat summary i18n parity', () => {
  for (const lang of LANG_CODES) {
    const strings = UI_STRINGS[lang];

    it(`[${lang}] defines all edition-specific combat keys`, () => {
      expect(strings, `UI_STRINGS missing entry for ${lang}`).toBeDefined();
      for (const key of [...V5_KEYS, ...CLASSIC_KEYS, ...LABEL_KEYS]) {
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

    it(`[${lang}] classic combat copy is distinct from V5 melee/superficial`, () => {
      // The original bug was that every edition rendered V5-flavored
      // melee / superficial / aggravated lines. If a translator
      // accidentally copies the V5 strings into the classic keys we
      // want a test failure rather than a silent regression on the
      // user-visible Tools page.
      expect(strings.combat_classic_pool).not.toBe(strings.combat_v5_melee);
      expect(strings.combat_classic_pool).not.toBe(strings.combat_v5_superficial);
      expect(strings.combat_classic_ones).not.toBe(strings.combat_v5_melee);
      expect(strings.combat_classic_damage).not.toBe(strings.combat_v5_superficial);
      expect(strings.combat_classic_damage).not.toBe(strings.combat_v5_aggravated);
    });

    it(`[${lang}] legacy-review hint is distinct from the general classic note`, () => {
      // The legacy-review hint is meant to flag the 1st/2nd-only
      // abstraction. It must not be a copy of `combat_classic_note`
      // (the shared "details vary by edition" footnote rendered for
      // every classic edition) — otherwise the user would see the
      // same italic line twice when 1st/2nd is active and the
      // pending-review signal would be invisible.
      expect(strings.combat_classic_legacy_review_note).not.toBe(strings.combat_classic_note);
      // And it must not collapse to a V5 string either — defensive
      // against copy/paste mistakes during future translation work.
      expect(strings.combat_classic_legacy_review_note).not.toBe(strings.combat_v5_hunger_note);
    });
  }
});
