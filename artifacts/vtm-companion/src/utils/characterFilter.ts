import { Character, EditionId, LangCode } from "../types";
import { getClanDisplayNameById } from "./content";
import { EDITION_LIST } from "../data/editions";

export type CharacterSortKey = 'updated' | 'name' | 'clan' | 'edition' | 'type';
export type CharacterTypeFilter = 'all' | 'player' | 'npc';
export type CharacterEditionFilter = 'all' | EditionId;
export type CharacterClanFilter = 'all' | string;

export interface CharacterListOptions {
  sortBy: CharacterSortKey;
  filterType?: CharacterTypeFilter;
  filterEdition?: CharacterEditionFilter;
  filterClan?: CharacterClanFilter;
  /** Active language used for locale-aware string comparisons. */
  language: LangCode;
}

/**
 * Filter and sort a character list for display. Pure: never mutates the input
 * array or its members. Returns a new array.
 *
 * Sort options:
 *   - 'updated': by `updatedAt` desc (newest first); entries with missing/invalid
 *                timestamps sort last so a corrupted record never floats up.
 *   - 'name':    alphabetical (A–Z) using `localeCompare(language)`.
 *   - 'clan':    edition-aware clan display name (locale-aware) — each character
 *                is compared by what the UI shows it as.
 *   - 'edition': chronological by `EDITION_LIST` index (1ST → 2ND → REVISED → V20 → V5);
 *                unknown editions sort last.
 *   - 'type':    Player Character before NPC; ties broken by name.
 *
 * Filter options: `'all'` means "no filter on this dimension".
 */
export function sortAndFilterCharacters(
  characters: Character[],
  options: CharacterListOptions
): Character[] {
  const {
    sortBy,
    filterType = 'all',
    filterEdition = 'all',
    filterClan = 'all',
    language,
  } = options;

  // Filter first
  const filtered = characters.filter(c => {
    if (filterType !== 'all') {
      const t = c.characterType === 'npc' ? 'npc' : 'player';
      if (t !== filterType) return false;
    }
    if (filterEdition !== 'all' && c.edition !== filterEdition) return false;
    if (filterClan !== 'all' && c.clan !== filterClan) return false;
    return true;
  });

  // Edition order map (chronological) for stable edition-sort
  const editionOrder = new Map<string, number>(
    EDITION_LIST.map((e, i) => [e.id, i])
  );

  // Sort on a copy so the caller's array isn't mutated
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'updated': {
        // Newer first; missing/invalid `updatedAt` sorts last
        const ta = typeof a.updatedAt === 'string' ? Date.parse(a.updatedAt) : NaN;
        const tb = typeof b.updatedAt === 'string' ? Date.parse(b.updatedAt) : NaN;
        const safeA = Number.isFinite(ta) ? ta : -Infinity;
        const safeB = Number.isFinite(tb) ? tb : -Infinity;
        return safeB - safeA;
      }
      case 'name': {
        return (a.name || '').localeCompare(b.name || '', language);
      }
      case 'clan': {
        const ca = getClanDisplayNameById(a.clan, a.edition as EditionId, language);
        const cb = getClanDisplayNameById(b.clan, b.edition as EditionId, language);
        return ca.localeCompare(cb, language);
      }
      case 'edition': {
        const oa = editionOrder.has(a.edition) ? editionOrder.get(a.edition)! : Number.MAX_SAFE_INTEGER;
        const ob = editionOrder.has(b.edition) ? editionOrder.get(b.edition)! : Number.MAX_SAFE_INTEGER;
        return oa - ob;
      }
      case 'type': {
        // Player ('player' / unset) before NPC; ties broken by name
        const ta = a.characterType === 'npc' ? 1 : 0;
        const tb = b.characterType === 'npc' ? 1 : 0;
        if (ta !== tb) return ta - tb;
        return (a.name || '').localeCompare(b.name || '', language);
      }
      default:
        return 0;
    }
  });

  return sorted;
}
