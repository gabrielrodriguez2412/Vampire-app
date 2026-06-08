/**
 * Batch AL — recent roll history helpers for the dice simulator.
 *
 * The dice simulator surfaces a small in-memory list of recent rolls so
 * players can re-read what just happened (especially handy when chasing
 * messy criticals or comparing back-to-back rouse checks). History is
 * deliberately session-only: no localStorage, no backend, and no coupling
 * to character sheets.
 *
 * Each entry is a tiny shape that already contains everything the list
 * needs to render — no late lookups against a separate roll store.
 */

/** Hard cap on history length. The list is local UI state, not a log. */
export const ROLL_HISTORY_MAX = 10;

/** Discriminator for the entry shapes. New roll kinds (e.g. remorse) can
 *  extend this list without breaking existing consumers. */
export type RollHistoryKind = 'v5' | 'classic' | 'rouse';

/**
 * One recorded roll. The `summary` field is the localized one-line
 * description the UI shows ("Pool 5 / Hunger 1 — 3 successes",
 * "Difficulty 6 — botch", "Rouse — success"). It is captured at record
 * time so re-rendering does not need to re-localize old entries.
 */
export interface RollHistoryEntry {
  /** Stable id so React keys / test selectors are unique even when two
   *  rolls happen in the same millisecond. */
  id: string;
  kind: RollHistoryKind;
  /** Localized one-line description, captured at record time. */
  summary: string;
  /** Optional reason the user typed in the Reason input. */
  reason?: string;
  /** Epoch millis, captured at record time. */
  timestamp: number;
}

/**
 * Append an entry to the head of the history, dropping any tail beyond
 * `ROLL_HISTORY_MAX`. Returns a new array so consumers can drop it
 * straight into a React state setter.
 *
 * The newest entry always sits at index 0 — list components can render
 * straight without re-sorting.
 */
export function recordRoll(
  current: readonly RollHistoryEntry[],
  entry: RollHistoryEntry,
): RollHistoryEntry[] {
  const next = [entry, ...current];
  if (next.length > ROLL_HISTORY_MAX) {
    next.length = ROLL_HISTORY_MAX;
  }
  return next;
}

/** Convenience: clear the whole history. Returns an empty array literal. */
export function clearHistory(): RollHistoryEntry[] {
  return [];
}
