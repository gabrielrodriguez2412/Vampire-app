/**
 * Batch BK-1 — pure resolver for a ghoul's regnant / domitor.
 *
 * The ghoul's `regnantCharacterId` field is a soft, read-time link:
 * setting it never touches the manual `clan` fallback that ghouls have
 * used since Batch BB / BD to record "Regnant clan" when the regnant
 * isn't a tracked character record. This helper takes the ghoul's own
 * record plus the full character list and returns whichever regnant
 * identity is most authoritative at read time.
 *
 * Precedence:
 *   1. `regnantCharacterId` resolves to a `kind: 'vampire'` character
 *      in the list → linked. Return the vampire's clan + display name.
 *   2. Otherwise (id absent, dangling, or points at a non-vampire) →
 *      fall back to the ghoul's manual `character.clan`.
 *   3. If neither is set → regnant-less. Return empty strings and
 *      `linkedRegnant: null`.
 *
 * Non-ghoul characters always return the regnant-less shape — the
 * concept doesn't apply to them.
 *
 * Purely functional: no localStorage access, no side effects. Consumers
 * (sheet identity row, card, print) pass the character list in.
 */
import type { Character } from '@/types';

export interface RegnantResolution {
  /** Effective regnant clan id, or `''` when unresolved / not applicable. */
  clanId: string;
  /**
   * The linked vampire character record if the id resolved. `null` when
   * unlinked (no id, dangling id, or id pointed at a non-vampire).
   */
  linkedRegnant: Character | null;
  /**
   * Display name for the linked regnant. `''` when unlinked — callers
   * that render a "Regnant: <name>" row should treat empty as "no name
   * row" and let the clan-based fallback drive the visible label.
   */
  displayName: string;
}

const EMPTY: RegnantResolution = { clanId: '', linkedRegnant: null, displayName: '' };

export function resolveRegnantClan(
  character: Character,
  allCharacters: Character[],
): RegnantResolution {
  // The regnant concept only applies to ghouls. Vampires and humans
  // return the empty resolution so the UI layers can compose a single
  // predicate ("linkedRegnant !== null" or "clanId !== ''") without
  // caring about the source character's kind.
  if ((character.kind ?? 'vampire') !== 'ghoul') return EMPTY;

  const linkId = character.regnantCharacterId;
  if (typeof linkId === 'string' && linkId.length > 0) {
    const regnant = allCharacters.find(c => c && c.id === linkId);
    if (regnant && (regnant.kind ?? 'vampire') === 'vampire') {
      return {
        clanId: typeof regnant.clan === 'string' ? regnant.clan : '',
        linkedRegnant: regnant,
        displayName: typeof regnant.name === 'string' ? regnant.name : '',
      };
    }
  }

  // Fallback: manual regnant-clan entry (the pre-BK-1 shape).
  const manualClan = typeof character.clan === 'string' ? character.clan : '';
  return { clanId: manualClan, linkedRegnant: null, displayName: '' };
}
