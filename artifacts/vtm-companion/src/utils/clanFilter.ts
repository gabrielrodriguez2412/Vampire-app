import { ClanEntry, EditionId, LangCode } from '../types';
import { disciplines as allDisciplines } from '../data/disciplines';
import { getText, getClanDisplayName, getClanSect } from './content';

/**
 * Clan filtering helpers backing the Clans page browse UI.
 *
 * Why a separate file (rather than inline in pages/clans.tsx):
 *
 *   - the search predicate has to peek into sibling data (disciplines)
 *     to allow searching by discipline name in both the active locale
 *     and English, which keeps mobile players from typing past the
 *     filter when they search "celeridad" / "celerity";
 *   - the unit tests for the filter want a pure function they can call
 *     with synthetic clans without rendering React;
 *   - a follow-up that adds a "by clan type" filter (clan vs. bloodline
 *     vs. caitiff vs. thin-blood) will live next to the existing logic
 *     here rather than threading new props through the page.
 *
 * The sect filter compares the *English* form of the resolved sect
 * label so the token list ("camarilla", "anarch", "sabbat", ...) is
 * stable across languages. This avoids having to also translate the
 * token strings and keeps the filter chip click handler trivial.
 */

export type ClanSortKey = 'default' | 'alpha';

/** Canonical sect token. `'all'` disables the filter. */
export type ClanSectToken =
  | 'all'
  | 'camarilla'
  | 'anarch'
  | 'sabbat'
  | 'independent'
  | 'unaligned';

export interface ClanFilterInput {
  clans: ClanEntry[];
  edition: EditionId;
  lang: LangCode;
  search: string;
  sortKey: ClanSortKey;
  sectFilter: ClanSectToken;
}

// Pre-index discipline records once per module load. Each discipline's
// `name` is a single-string field (not multilingual) but searching its
// id also catches the canonical short form.
const DISCIPLINE_INDEX = new Map<string, { name: string }>();
for (const d of allDisciplines) {
  DISCIPLINE_INDEX.set(d.id, { name: d.name });
}

const norm = (s: string | null | undefined): string => (s || '').toLowerCase().trim();

function clanMatchesSearch(
  clan: ClanEntry,
  edition: EditionId,
  lang: LangCode,
  query: string,
): boolean {
  const q = norm(query);
  if (!q) return true;

  if (clan.id.toLowerCase().includes(q)) return true;

  // Display name — active locale + English fallback so a player typing
  // in English while the app is in Spanish still finds the clan.
  const nameActive = norm(getClanDisplayName(clan, edition, lang));
  if (nameActive.includes(q)) return true;
  if (lang !== 'en') {
    const nameEn = norm(getClanDisplayName(clan, edition, 'en'));
    if (nameEn.includes(q)) return true;
  }

  // Sect label — same two-locale check.
  const sectActive = norm(getClanSect(clan, edition, lang));
  if (sectActive.includes(q)) return true;
  if (lang !== 'en') {
    const sectEn = norm(getClanSect(clan, edition, 'en'));
    if (sectEn.includes(q)) return true;
  }

  // Disciplines: id and display name (single-locale on the data side).
  for (const discId of clan.disciplines) {
    if (discId.toLowerCase().includes(q)) return true;
    const disc = DISCIPLINE_INDEX.get(discId);
    if (disc && norm(disc.name).includes(q)) return true;
  }

  return false;
}

function clanMatchesSect(
  clan: ClanEntry,
  edition: EditionId,
  token: ClanSectToken,
): boolean {
  if (token === 'all') return true;
  // English form is the stable comparison surface; sect labels are
  // short composites like "Camarilla / Anarch" so a substring check is
  // sufficient.
  const sectEn = norm(getClanSect(clan, edition, 'en'));
  return sectEn.includes(token);
}

/**
 * Apply the user's edition + search + sect + sort selections to the
 * full clan list. Pure; safe to call from `useMemo`.
 *
 * Edition availability filtering is done here too so callers do not
 * have to remember to chain `.filter(c => c.editionAvailability.includes(edition))`
 * separately.
 */
export function applyClanFilters(input: ClanFilterInput): ClanEntry[] {
  const { clans, edition, lang, search, sortKey, sectFilter } = input;

  const byEdition = clans.filter(c => c.editionAvailability.includes(edition));
  const bySect = byEdition.filter(c => clanMatchesSect(c, edition, sectFilter));
  const bySearch = bySect.filter(c => clanMatchesSearch(c, edition, lang, search));

  if (sortKey === 'alpha') {
    return [...bySearch].sort((a, b) => {
      const an = getClanDisplayName(a, edition, lang) || a.id;
      const bn = getClanDisplayName(b, edition, lang) || b.id;
      return an.localeCompare(bn);
    });
  }
  return bySearch;
}

/**
 * Which sect tokens have at least one clan in the current edition? Used
 * to hide filter chips that would always return zero results — e.g.
 * "Sabbat" makes no sense as a chip when V5 is selected because no V5
 * clan still reads as Sabbat in the bundled data.
 *
 * The token order is deliberate (the most populated sects first) so
 * the chip row scans naturally in the UI.
 */
const ALL_TOKENS: Exclude<ClanSectToken, 'all'>[] = [
  'camarilla',
  'anarch',
  'sabbat',
  'independent',
  'unaligned',
];

export function getActiveSectTokens(clans: ClanEntry[], edition: EditionId): ClanSectToken[] {
  const available = new Set<ClanSectToken>();
  for (const clan of clans) {
    if (!clan.editionAvailability.includes(edition)) continue;
    const sectEn = norm(getClanSect(clan, edition, 'en'));
    for (const token of ALL_TOKENS) {
      if (sectEn.includes(token)) available.add(token);
    }
  }
  // 'all' is always offered as the leftmost chip.
  return ['all', ...ALL_TOKENS.filter(t => available.has(t))];
}
