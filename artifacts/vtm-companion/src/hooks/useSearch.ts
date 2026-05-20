import { useMemo } from 'react';
import { clans } from '@/data/clans';
import { disciplines } from '@/data/disciplines';
import { rules } from '@/data/rules';
import { glossary } from '@/data/glossary';
import { useAppContext } from '@/context/AppContext';
import { UI_STRINGS } from '@/i18n/ui';
import {
  rankSearchEntries,
  buildSearchEntries,
  SearchResult,
  SearchResultType,
  DEFAULT_SEARCH_LIMIT,
  MIN_QUERY_LENGTH,
} from '@/utils/search';
import { getCharacters } from '@/services/characterStorage';
import { getChronicles } from '@/services/chronicleStorage';
import { getAllChronicleSessions } from '@/services/chronicleSessionStorage';
import { getAllChronicleLocations } from '@/services/chronicleLocationStorage';
import { getAllChronicleRelationships } from '@/services/chronicleRelationshipStorage';

export type { SearchResult, SearchResultType } from '@/utils/search';

/**
 * The full set of result types — exported so the Search page can render
 * filter pills without hard-coding the list. Order here is also the order
 * the pills render in.
 */
export const SEARCH_RESULT_TYPES: readonly SearchResultType[] = [
  'character', 'journal', 'chronicle', 'session', 'location', 'relationship',
  'clan', 'disciplina', 'regla', 'glosario',
];

/**
 * Read a localStorage-backed list with a defensive try/catch fallback.
 * Used so a corrupted bucket never breaks search for every other type.
 */
function safeRead<T>(read: () => T[]): T[] {
  try { return read(); } catch { return []; }
}

/**
 * Global search hook. Returns the top `limit` results for `query`, ranked
 * by `rankSearchEntries` (title-exact → title-prefix → title-includes →
 * body/description-includes).
 *
 * User records (characters, journal notes, chronicles, sessions, locations,
 * relationships) are read **synchronously inside the memo** on every query
 * change instead of cached via `useEffect`. This guarantees the index is
 * fresh even when the consumer (e.g. the `SearchDialog` rendered inside
 * the persistent `Layout`) stays mounted across mutations elsewhere in
 * the app — a stale cache there previously hid journal entries added
 * mid-session from search results. localStorage reads are sub-millisecond
 * at typical data sizes, so the cost is negligible.
 */
export function useSearch(query: string, limit: number = DEFAULT_SEARCH_LIMIT): SearchResult[] {
  const { activeLanguage: lang, activeEdition: edition } = useAppContext();
  const strings = UI_STRINGS[lang] || UI_STRINGS['en'];

  return useMemo(() => {
    if (!query || query.length < MIN_QUERY_LENGTH) return [];
    const entries = buildSearchEntries({
      edition,
      lang,
      strings,
      clans,
      disciplines,
      rules,
      glossary,
      characters: safeRead(getCharacters),
      chronicles: safeRead(getChronicles),
      sessions: safeRead(getAllChronicleSessions),
      locations: safeRead(getAllChronicleLocations),
      relationships: safeRead(getAllChronicleRelationships),
    });
    return rankSearchEntries(entries, query, limit);
    // strings is stable per language; including `lang` covers it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, edition, lang, limit]);
}
