/**
 * Batch BJ — pure predicates for the inline dormant-data prompts shipped
 * in the Morality / Vitae / Powers opt-in cards.
 *
 * Each `hasDormantX` returns `true` only when:
 *   1. The character's kind / edition is *eligible to opt in* to the
 *      matching tracker — see the table in the BI-3 audit §5. V5 Ghouls
 *      with dormant classic data, Humans with vampire-only dormant data,
 *      and vampires never qualify; the prompt is structurally unreachable
 *      for them.
 *   2. The matching `track*` flag is NOT already on (data is already
 *      "visible" — there's nothing dormant about it).
 *   3. The matching `dismissedDormant*Prompt` flag is NOT already on (the
 *      user has previously dismissed this character's prompt; respect
 *      that decision).
 *   4. The data field carries *non-trivial* content. A `humanity: 0`,
 *      `bloodPool: { current: 0, max: 0 }`, or empty `disciplines: {}` is
 *      not worth prompting about — it would surface a "you have stored
 *      data" banner against essentially-empty seed values.
 *
 * The helpers are intentionally pure (no React, no DOM) so they can be
 * unit-tested without rendering, and so the UI layer in DynamicSheet
 * just composes a named predicate per banner.
 *
 * The helpers do NOT inspect the Edit / View Mode of the sheet. That is
 * a presentation concern — the UI layer combines the predicate with
 * `!readonly` so View Mode stays clean. Keeping the mode out of the
 * predicate also makes the helpers reusable for any future
 * dormant-data-aware feature (e.g., character-list badges) without
 * coupling them to the sheet's edit state.
 */
import type { Character, ClassicCharacter } from '@/types';

/**
 * Dormant `humanity` exists for Human / Ghoul (any edition). Storage
 * normalization preserves any number on disk, so a pre-Batch-BA mortal
 * with `humanity: 7` qualifies. A brand-new mortal (no `humanity` key)
 * does not.
 */
export function hasDormantHumanity(character: Character): boolean {
  const kind = character.kind ?? 'vampire';
  if (kind !== 'human' && kind !== 'ghoul') return false;
  if (character.trackMorality === true) return false;
  if (character.dismissedDormantMoralityPrompt === true) return false;
  const value = (character as { humanity?: unknown }).humanity;
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Dormant `bloodPool` exists for classic-edition Ghouls only. V5 Ghouls
 * and Humans never qualify, even if they somehow carry the field on
 * disk — they have no Vitae card to opt into. A {current:0, max:0} pair
 * is treated as "nothing useful to surface" and suppresses the prompt.
 */
export function hasDormantVitae(character: Character): boolean {
  const kind = character.kind ?? 'vampire';
  if (kind !== 'ghoul') return false;
  if (character.edition === 'V5') return false;
  if (character.trackVitae === true) return false;
  if (character.dismissedDormantVitaePrompt === true) return false;
  const pool = (character as ClassicCharacter).bloodPool;
  if (typeof pool !== 'object' || pool === null) return false;
  const current = typeof pool.current === 'number' && Number.isFinite(pool.current) ? pool.current : 0;
  const max = typeof pool.max === 'number' && Number.isFinite(pool.max) ? pool.max : 0;
  return current > 0 || max > 0;
}

/**
 * Dormant `disciplines` exist for classic-edition Ghouls only. An empty
 * map is the `createEmptyCharacter` seed and does NOT qualify — every
 * brand-new mortal carries an empty disciplines object, and we must not
 * spam them with a "you have stored Powers data" banner. Only a
 * non-empty discipline map (e.g. from a pre-AX ghoul created as a
 * vampire) triggers the prompt.
 */
export function hasDormantPowers(character: Character): boolean {
  const kind = character.kind ?? 'vampire';
  if (kind !== 'ghoul') return false;
  if (character.edition === 'V5') return false;
  if (character.trackGhoulPowers === true) return false;
  if (character.dismissedDormantPowersPrompt === true) return false;
  const map = (character as { disciplines?: unknown }).disciplines;
  if (typeof map !== 'object' || map === null) return false;
  return Object.keys(map as Record<string, unknown>).length > 0;
}
