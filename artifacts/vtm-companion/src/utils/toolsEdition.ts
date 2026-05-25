import { EDITION_LIST } from '@/data/editions';
import type { EditionId } from '@/types';

/**
 * Edition-derived helpers used by the Tools page.
 *
 * Lives in `utils/` rather than inline in `pages/tools.tsx` so the
 * decisions can be unit-tested directly without rendering the page
 * (and so they can be reused if a future batch adds more edition-
 * sensitive widgets — e.g. an initiative tracker that also wants
 * the same short label / legacy-edition hint logic).
 */

/**
 * Short language-neutral label for the small chip rendered in each
 * Tools card header (e.g. `V5`, `V20`, `REVISED`, `2ND`, `1ST`).
 * Falls back to the raw `EditionId` if the edition is somehow missing
 * from `EDITION_LIST` — defensive against future renames so the chip
 * still renders *something* instead of being blank.
 */
export function getToolsEditionShortName(edition: EditionId): string {
  return EDITION_LIST.find(e => e.id === edition)?.shortName ?? edition;
}

/**
 * Whether the Combat Summary should render an extra "pending detailed
 * review" hint below the shared classic copy.
 *
 * Returns `true` only for 1st and 2nd Edition. The shared classic copy
 * the Tools page renders (pool vs. difficulty, ones cancelling
 * successes, Stamina/Fortitude soak) is broadly correct for V20 and
 * Revised, but abstracts away genuinely different rules in 1st/2nd:
 *   - Bashing damage track (Bashing/Lethal/Aggravated, not just
 *     Superficial/Aggravated) — not modeled in the current copy.
 *   - Botch escalation by number of 1s — handled at a summary level
 *     by `combat_classic_ones` but the per-edition severity nuances
 *     are not.
 *
 * The hint is therefore a user-visible internal-TODO marker so 1st/2nd
 * users know the abstraction is in effect. When a future batch expands
 * `combat_classic_*` into proper per-edition variants, remove this
 * helper and the matching `combat_classic_legacy_review_note` strings.
 *
 * Explicitly returns `false` for V5 — V5 has its own dedicated copy
 * block in `tools.tsx` and never falls through to the classic copy.
 */
export function shouldShowClassicLegacyReviewHint(edition: EditionId): boolean {
  return edition === '1ST' || edition === '2ND';
}
