import { LangCode, EditionId, ClanEntry } from '../types';
import type { EditionScope } from '../types';
import { clans } from '../data/clans';

// Returns text in lang. If not available, falls back to 'en'. If still not available, returns null.
export function getText(record: Record<LangCode, string> | undefined, lang: LangCode): string | null {
  if (!record) return null;
  const val = record[lang];
  if (val && val.trim() !== '') return val;
  const fallback = record['en'];
  return (fallback && fallback.trim() !== '') ? fallback : null;
}

// Returns array in lang. If not available, returns null.
export function getTextArray(record: Record<LangCode, string[]> | undefined, lang: LangCode): string[] | null {
  if (!record) return null;
  const val = record[lang];
  return (val && val.length > 0) ? val : null;
}

/**
 * Like `getText`, but for string-array fields (e.g. the bullet list inside a
 * Roleplay tip). Falls back to English when the requested language has no
 * content, and to an empty array when even English is missing — so callers
 * can map() the result without null checks.
 */
export function getLocalizedArray(
  record: Record<LangCode, string[]> | undefined,
  lang: LangCode,
): string[] {
  if (!record) return [];
  const val = record[lang];
  if (val && val.length > 0) return val;
  const fallback = record['en'];
  return (fallback && fallback.length > 0) ? fallback : [];
}

// Get text with English fallback (use ONLY in search/indexing contexts — never in UI rendering)
export function getTextWithFallback(record: Record<LangCode, string> | undefined, lang: LangCode): string {
  if (!record) return '';
  return record[lang] || record['en'] || '';
}

export function filterByEdition<T extends { editions: EditionId[] }>(items: T[], edition: EditionId): T[] {
  return items.filter(item => item.editions.includes(edition));
}

/**
 * Does an entry tagged with an `EditionScope` belong on the page for the
 * currently selected `EditionId`?
 *
 * Universal entries (`scope` is `null` / `undefined`) match every edition.
 * `v5`-scoped entries match only the V5 edition. `classic`-scoped entries
 * match every classic edition (V20, Revised, 2nd, 1st). This is the
 * intentional coarse grouping the rest of the UI already uses — the
 * combat-summary card on Tools, for instance, distinguishes V5 from a
 * single "classic editions" cluster. If the app later wants to split
 * those further (e.g. Revised-only content), the scope union can grow;
 * for now, two scope buckets cover every real-device-QA finding.
 */
export function isEditionInScope(scope: EditionScope | undefined, edition: EditionId): boolean {
  if (scope === null || scope === undefined) return true;
  if (scope === 'v5') return edition === 'V5';
  if (scope === 'classic') return edition !== 'V5';
  return true;
}

export function isAvailableInLang(record: Record<LangCode, string> | undefined, lang: LangCode): boolean {
  if (!record) return false;
  return !!(record[lang] && record[lang].trim() !== '');
}

export function normalizeEditionId(value: string | null | undefined): EditionId {
  if (!value) return 'V20';
  const normalized = value.toString().toUpperCase();
  if (normalized === 'V1' || normalized === '1ST' || normalized === 'FIRST') return '1ST';
  if (normalized === 'V2' || normalized === '2ND' || normalized === 'SECOND') return '2ND';
  if (normalized === 'REVISED') return 'REVISED';
  if (normalized === 'V20') return 'V20';
  if (normalized === 'V5') return 'V5';
  return 'V20';
}

export function getClanDisplayName(clan: ClanEntry, edition: EditionId, lang: LangCode): string {
  if (clan.alternateNames && clan.alternateNames[edition]) {
    const altName = getText(clan.alternateNames[edition], lang);
    if (altName) return altName;
  }
  return getText(clan.name, lang) || clan.id;
}

/**
 * Return the multilingual record for a clan's sect at the given edition.
 * Prefers a `sectByEdition[edition]` override when present; otherwise
 * falls back to the canonical `clan.sect`.
 */
export function getClanSectRecord(clan: ClanEntry, edition: EditionId): Record<LangCode, string> {
  const override = clan.sectByEdition && clan.sectByEdition[edition];
  return override || clan.sect;
}

/**
 * Return the visible sect label for a clan in the given edition + language,
 * falling back to English via `getText`. Returns null when no sect data
 * exists at all (currently never the case in the bundled clan data).
 *
 * This is the single source of truth for the sect chip on clan cards
 * and the sect line on the clan detail header. Keeping it centralized
 * means a future, more granular per-edition split (Revised-only, 1st-
 * only) needs only one helper change rather than a sweep of the page.
 */
export function getClanSect(clan: ClanEntry, edition: EditionId, lang: LangCode): string | null {
  return getText(getClanSectRecord(clan, edition), lang);
}

export function getClanDisplayNameById(clanId: string, edition: EditionId, lang: LangCode): string {
  const clan = clans.find(c => c.id === clanId);
  if (!clan) return clanId;
  return getClanDisplayName(clan, edition, lang);
}
