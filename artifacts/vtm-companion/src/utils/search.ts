/**
 * Pure search helpers.
 *
 * The global search hook in `hooks/useSearch.ts` collects entries from many
 * sources (clans, disciplines, rules, glossary, characters, character
 * journals, chronicles, sessions, locations, relationships) and then asks
 * this module to rank and limit them. Keeping the ranking logic pure makes
 * it unit-testable without touching React, storage, or app context.
 */

/**
 * Discriminator for a search result. Strings are stable across UI surfaces
 * (the global dialog, the search page, the filter pills) and survive in
 * the existing `SearchResult.type` field used by callers.
 *
 * Legacy values (`'clan' | 'disciplina' | 'regla' | 'glosario'`) are kept
 * intact for compatibility with the dialog's icon switch. New values cover
 * user-created records.
 */
export type SearchResultType =
  | 'clan'
  | 'disciplina'
  | 'regla'
  | 'glosario'
  | 'character'
  | 'journal'
  | 'chronicle'
  | 'session'
  | 'location'
  | 'relationship';

/**
 * One indexed item before ranking. `title` is the headline used both for
 * matching and rendering. `description` is the secondary line shown in the
 * result row; it also participates in matching at the lowest tier. `body`
 * is an optional larger searchable blob (e.g. journal note body, session
 * summary) that is matched but never rendered, so long content doesn't
 * leak into the dialog. `subtitle` is an optional short context line for
 * the result row (e.g. parent character name for a journal note).
 *
 * `url` is the final destination route. `deepLink.sessionKeys` lets the
 * caller seed sessionStorage right before navigation — this is how we
 * pre-open the correct character / chronicle / tab on the destination
 * page without changing existing route shapes.
 */
export interface SearchEntry {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  body?: string;
  subtitle?: string;
  url: string;
  deepLink?: { sessionKeys: Record<string, string> };
}

/** A ranked entry ready for rendering. Identical shape to `SearchEntry` —
 *  the ranker only sorts and slices, it does not transform records. */
export type SearchResult = SearchEntry;

/** Default per-search result limit. Keeps the dialog/page readable on
 *  every viewport and bounds the cost of the in-memory match loop. */
export const DEFAULT_SEARCH_LIMIT = 30;

/** Minimum query length before any matching runs. Shorter strings would
 *  match nearly everything and aren't useful as a quick navigator. */
export const MIN_QUERY_LENGTH = 2;

/**
 * Ranking tiers, lowest number wins. Lower scores sort to the top.
 * Within the same tier, the input order of `entries` is preserved (stable
 * sort), so callers can influence within-tier order by indexing canonical
 * content (clans / disciplines / rules) before user content.
 */
const RANK_EXACT = 0;
const RANK_STARTS_WITH = 1;
const RANK_TITLE_INCLUDES = 2;
const RANK_BODY_INCLUDES = 3;
const RANK_NO_MATCH = Number.POSITIVE_INFINITY;

/**
 * Score a single entry against a lowercased query.
 *
 * Returns one of the `RANK_*` constants. Caller filters out
 * `RANK_NO_MATCH` results before sorting.
 *
 * Title matching takes precedence: an exact title match always beats a
 * description hit, even for very long descriptions, so users searching by
 * name reliably get the canonical record first.
 */
export function scoreEntry(entry: SearchEntry, lowerQuery: string): number {
  if (!lowerQuery) return RANK_NO_MATCH;
  const lowerTitle = entry.title.toLowerCase();

  if (lowerTitle === lowerQuery) return RANK_EXACT;
  if (lowerTitle.startsWith(lowerQuery)) return RANK_STARTS_WITH;
  if (lowerTitle.includes(lowerQuery)) return RANK_TITLE_INCLUDES;

  const lowerDesc = entry.description.toLowerCase();
  if (lowerDesc.includes(lowerQuery)) return RANK_BODY_INCLUDES;

  if (entry.subtitle) {
    const lowerSub = entry.subtitle.toLowerCase();
    if (lowerSub.includes(lowerQuery)) return RANK_BODY_INCLUDES;
  }

  if (entry.body) {
    const lowerBody = entry.body.toLowerCase();
    if (lowerBody.includes(lowerQuery)) return RANK_BODY_INCLUDES;
  }

  return RANK_NO_MATCH;
}

/**
 * Rank an array of search entries against `query` and return the top
 * `limit` results.
 *
 * - Case-insensitive throughout.
 * - Returns `[]` for empty / sub-minimum queries.
 * - Stable within tier: the input order is preserved among entries with
 *   the same score, so callers can prepend high-signal sources to bias
 *   the ranking without touching this function.
 */
export function rankSearchEntries(
  entries: SearchEntry[],
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT
): SearchResult[] {
  if (!query || query.length < MIN_QUERY_LENGTH) return [];
  const lower = query.toLowerCase();

  // Index-pair sort to make the tie-breaker explicitly stable across all
  // engines; relying on `Array.prototype.sort` stability is OK on modern
  // engines but the explicit index keeps the intent visible in code.
  const scored = entries
    .map((entry, idx) => ({ entry, score: scoreEntry(entry, lower), idx }))
    .filter(x => x.score !== RANK_NO_MATCH)
    .sort((a, b) => (a.score - b.score) || (a.idx - b.idx));

  return scored.slice(0, limit).map(x => x.entry);
}

/** Convenience for callers that already have an array of strings — joins
 *  non-empty trimmed parts with a single space, producing a single body
 *  blob suitable for the lowest match tier. */
export function joinSearchableText(...parts: Array<string | undefined | null>): string {
  return parts
    .filter((p): p is string => typeof p === 'string')
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .join(' ');
}

/** Hard cap on user-content snippets shown in result rows. Long journal
 *  bodies / session summaries are still searchable via the entry's `body`
 *  field but never spill into the dialog. */
export const SEARCH_SNIPPET_MAX = 140;

/** Trim + ellipsize a free-text blob for use as a result-row description.
 *  Long content still participates in matching via the entry's `body`. */
export function searchSnippet(text: string | undefined | null): string {
  if (!text) return '';
  const t = text.trim();
  if (t.length <= SEARCH_SNIPPET_MAX) return t;
  return t.slice(0, SEARCH_SNIPPET_MAX).trimEnd() + '…';
}

// --- buildSearchEntries -----------------------------------------------------

import type {
  Character, CharacterNoteCategory, Chronicle, ChronicleSession,
  ChronicleLocation, ChronicleRelationship, EditionId, LangCode, ClanEntry,
  DisciplineEntry, RuleEntry, GlossaryEntry,
} from '../types';
import { getText, filterByEdition, getClanDisplayName, getClanDisplayNameById } from './content';

/**
 * Localized labels for the journal categories. Mirrors the labels used
 * inside `DynamicSheet.tsx` — kept local to this module so the search
 * index can include category text in matching without forcing the hook
 * to depend on a React component. The English fallback is used when the
 * `strings` lookup table is missing a key. The raw category id is also
 * included in match body separately, so a user typing "backstory"
 * matches whether or not the active language defines a label.
 */
function getJournalCategoryLabel(
  category: CharacterNoteCategory,
  strings: Record<string, string>
): string {
  switch (category) {
    case 'general':   return strings.journal_category_general   || 'General';
    case 'backstory': return strings.journal_category_backstory || 'Backstory';
    case 'goals':     return strings.journal_category_goals     || 'Goals';
    case 'secrets':   return strings.journal_category_secrets   || 'Secrets';
    case 'contacts':  return strings.journal_category_contacts  || 'Contacts';
    case 'session':   return strings.journal_category_session   || 'Session';
    case 'other':     return strings.journal_category_other     || 'Other';
    default:          return category;
  }
}

/**
 * Inputs for `buildSearchEntries`. Each list is optional — missing/empty
 * lists simply contribute zero entries, so consumers can pass partial
 * data (useful in tests). `strings` is the active language's UI_STRINGS
 * record; only used to localize journal-category labels for matching.
 */
export interface BuildSearchEntriesInput {
  edition: EditionId;
  lang: LangCode;
  strings: Record<string, string>;
  clans?: ClanEntry[];
  disciplines?: DisciplineEntry[];
  rules?: RuleEntry[];
  glossary?: GlossaryEntry[];
  characters?: Character[];
  chronicles?: Chronicle[];
  sessions?: ChronicleSession[];
  locations?: ChronicleLocation[];
  relationships?: ChronicleRelationship[];
}

/**
 * Build the full set of indexed entries from canonical content and user
 * records. Pure: depends only on its arguments. Order matters — within
 * the same ranking tier the input order is the tie-breaker, so canonical
 * content (clans → disciplines → rules → glossary) is emitted before
 * user content. A search for `"brujah"` thus surfaces the canonical clan
 * before any user character whose name happens to include the word.
 */
export function buildSearchEntries(input: BuildSearchEntriesInput): SearchEntry[] {
  const {
    edition, lang, strings,
    clans = [], disciplines = [], rules = [], glossary = [],
    characters = [], chronicles = [], sessions = [], locations = [], relationships = [],
  } = input;
  const entries: SearchEntry[] = [];

  // --- Canonical content ---

  for (const clan of clans.filter(c => c.editionAvailability.includes(edition))) {
    const title = getClanDisplayName(clan, edition, lang);
    const description = getText(clan.sect, lang) || '';
    const body = joinSearchableText(getText(clan.summary, lang), getText(clan.lore, lang));
    entries.push({
      id: `clan:${clan.id}`,
      type: 'clan',
      title,
      description,
      body,
      url: `/compendium/clanes/${clan.id}`,
    });
  }

  for (const disc of filterByEdition(disciplines, edition)) {
    const title = disc.name;
    const description = getText(disc.type, lang) || '';
    const body = getText(disc.description, lang) || '';
    entries.push({
      id: `disc:${disc.id}`,
      type: 'disciplina',
      title,
      description,
      body,
      url: `/compendium/disciplinas/${disc.id}`,
    });
  }

  for (const rule of filterByEdition(rules, edition)) {
    const title = getText(rule.title, lang) || '';
    const description = getText(rule.shortExplanation, lang) || '';
    const body = joinSearchableText(
      getText(rule.fullExplanation, lang),
      ...(Array.isArray(rule.tags) ? rule.tags : []),
    );
    entries.push({
      id: `rule:${rule.id}`,
      type: 'regla',
      title,
      description,
      body,
      url: `/compendium/reglas/${rule.id}`,
    });
  }

  for (const term of glossary) {
    const t = getText(term.term, lang) || '';
    const d = getText(term.definition, lang) || '';
    entries.push({
      id: `glos:${term.id}`,
      type: 'glosario',
      title: t,
      description: searchSnippet(d),
      body: d,
      // The Glossary page is a single in-page filter; deep-linking to a
      // specific term is not currently supported, so we just open the page.
      url: `/compendium/glosario`,
    });
  }

  // --- User records ---

  for (const ch of characters) {
    const title = ch.name?.trim() || '';
    if (!title) continue;
    const clanName = getClanDisplayNameById(ch.clan, ch.edition as EditionId, lang);
    const description = joinSearchableText(clanName, ch.edition);
    const body = joinSearchableText(ch.concept, ch.chronicle, ch.playerName);
    entries.push({
      id: `char:${ch.id}`,
      type: 'character',
      title,
      description,
      body,
      url: '/personaje',
      deepLink: { sessionKeys: { 'vtm-open-character-id': ch.id } },
    });
  }

  // Character journal notes — search title, body, AND category text. The
  // rendered description is capped via `searchSnippet` so the dialog
  // never paints a wall of journal text; the full body and category
  // labels still participate in matching via the entry's `body` field.
  for (const ch of characters) {
    const notes = Array.isArray(ch.characterNotes) ? ch.characterNotes : [];
    for (const note of notes) {
      if (!note || typeof note !== 'object') continue;
      const noteTitle = typeof note.title === 'string' ? note.title.trim() : '';
      const noteBody = typeof note.body === 'string' ? note.body.trim() : '';
      if (!noteTitle && !noteBody) continue;
      const displayTitle = noteTitle || searchSnippet(noteBody) || '(untitled)';
      const categoryLabel = note.category ? getJournalCategoryLabel(note.category, strings) : '';
      entries.push({
        id: `note:${ch.id}:${note.id}`,
        type: 'journal',
        title: displayTitle,
        description: searchSnippet(noteBody),
        // Include both the raw category id and its localized label so the
        // user can search by either ("secrets" / "secretos" / "Secretos").
        body: joinSearchableText(noteBody, note.category, categoryLabel),
        subtitle: ch.name?.trim() || '',
        url: '/personaje',
        deepLink: { sessionKeys: { 'vtm-open-character-id': ch.id } },
      });
    }
  }

  for (const chr of chronicles) {
    const title = chr.name?.trim() || '';
    if (!title) continue;
    const description = joinSearchableText(chr.setting, chr.edition);
    const body = chr.description || '';
    entries.push({
      id: `chr:${chr.id}`,
      type: 'chronicle',
      title,
      description,
      body,
      url: '/cronica',
      deepLink: {
        sessionKeys: {
          'vtm-open-chronicle-id': chr.id,
          'vtm-open-chronicle-tab': 'overview',
        },
      },
    });
  }

  const chronicleById = new Map(chronicles.map(c => [c.id, c]));
  for (const s of sessions) {
    const title = s.title?.trim() || '';
    if (!title) continue;
    const parent = chronicleById.get(s.chronicleId);
    const description = joinSearchableText(parent?.name, s.sessionDate);
    const d = s.details;
    const body = joinSearchableText(
      s.summary,
      d?.rewards,
      d?.nextHooks,
      ...(Array.isArray(d?.keyEvents) ? d!.keyEvents : []),
      ...(Array.isArray(d?.unresolvedQuestions) ? d!.unresolvedQuestions : []),
    );
    entries.push({
      id: `sess:${s.id}`,
      type: 'session',
      title,
      description,
      body,
      subtitle: parent?.name || '',
      url: '/cronica',
      deepLink: {
        sessionKeys: {
          'vtm-open-chronicle-id': s.chronicleId,
          'vtm-open-chronicle-tab': 'sessions',
        },
      },
    });
  }

  for (const loc of locations) {
    const title = loc.name?.trim() || '';
    if (!title) continue;
    const parent = chronicleById.get(loc.chronicleId);
    const description = joinSearchableText(parent?.name, loc.district);
    const body = joinSearchableText(loc.description, loc.notes);
    entries.push({
      id: `loc:${loc.id}`,
      type: 'location',
      title,
      description,
      body,
      subtitle: parent?.name || '',
      url: '/cronica',
      deepLink: {
        sessionKeys: {
          'vtm-open-chronicle-id': loc.chronicleId,
          'vtm-open-chronicle-tab': 'locations',
        },
      },
    });
  }

  const characterById = new Map(characters.map(c => [c.id, c]));
  for (const rel of relationships) {
    const source = characterById.get(rel.sourceCharacterId);
    const target = characterById.get(rel.targetCharacterId);
    if (!source && !target) continue;
    const sourceName = source?.name?.trim() || '?';
    const targetName = target?.name?.trim() || '?';
    const title = `${sourceName} → ${targetName}`;
    const parent = chronicleById.get(rel.chronicleId);
    const description = joinSearchableText(parent?.name, rel.relationshipType, rel.status);
    const body = rel.description || '';
    entries.push({
      id: `rel:${rel.id}`,
      type: 'relationship',
      title,
      description,
      body,
      subtitle: parent?.name || '',
      url: '/cronica',
      deepLink: {
        sessionKeys: {
          'vtm-open-chronicle-id': rel.chronicleId,
          'vtm-open-chronicle-tab': 'relationships',
        },
      },
    });
  }

  return entries;
}
