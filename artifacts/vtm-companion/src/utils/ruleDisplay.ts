import { EditionId, LangCode, RuleEntry } from '../types';
import { getTextArray } from './content';

const CLASSIC_IDS: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20'];

/**
 * Compact label for the edition badge shown on a rule card. Pure: no React,
 * no i18n lookups — callers supply the localized labels so it stays cheap
 * to test.
 *
 * Rules of thumb:
 *  - Empty editions array → '' (caller can hide the badge).
 *  - Single edition       → that id verbatim (e.g. "V5", "V20", "REVISED").
 *  - V5 + ALL four classic → `labelAll`.
 *  - ALL four classic only → `labelClassic`.
 *  - Any other mix         → the edition ids joined by ", " (preserves
 *                            specificity so V20+REVISED never gets silently
 *                            collapsed to "Classic").
 */
export function ruleEditionLabel(
  editions: EditionId[],
  labels: { labelAll: string; labelClassic: string },
): string {
  if (!editions || editions.length === 0) return '';
  if (editions.length === 1) return editions[0];

  const hasV5 = editions.includes('V5');
  const coversAllClassic = CLASSIC_IDS.every(e => editions.includes(e));
  const onlyClassic = !hasV5 && coversAllClassic && editions.length === CLASSIC_IDS.length;
  const allFive = hasV5 && coversAllClassic && editions.length === CLASSIC_IDS.length + 1;

  if (allFive) return labels.labelAll;
  if (onlyClassic) return labels.labelClassic;
  // Any other mix — be explicit so the user can tell which specific editions
  // the rule actually applies to.
  return editions.join(', ');
}

/**
 * True when any quickNote (in any provided language) starts with a
 * "needs review" / "necesita revisión" marker — case-insensitive. Surfaces a
 * small badge on rule cards that carry uncertain mechanics.
 */
export function ruleHasNeedsReviewMarker(rule: RuleEntry, langs: LangCode[]): boolean {
  const markers = ['needs review', 'necesita revisión', 'precisa revisão', 'à vérifier', 'prüfen', 'da rivedere'];
  for (const lang of langs) {
    const notes = getTextArray(rule.quickNotes, lang) ?? [];
    for (const note of notes) {
      const lowered = note.toLowerCase();
      if (markers.some(m => lowered.startsWith(m))) return true;
    }
  }
  return false;
}

/**
 * Return the authoritative category list for a rule. When `categories` is
 * present and non-empty, it is the list; otherwise we fall back to a single
 * entry built from the legacy `category` field. Empty strings are dropped so
 * the UI never renders a blank chip.
 */
export function getRuleCategories(rule: Pick<RuleEntry, 'category' | 'categories'>): string[] {
  const raw = Array.isArray(rule.categories) && rule.categories.length > 0
    ? rule.categories
    : [rule.category];
  return raw.filter(c => typeof c === 'string' && c.trim().length > 0);
}

/** True when the rule belongs to the given category (multi-category aware). */
export function ruleHasCategory(rule: Pick<RuleEntry, 'category' | 'categories'>, category: string): boolean {
  if (!category) return false;
  return getRuleCategories(rule).includes(category);
}
