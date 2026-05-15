import { LangCode, EditionId, ClanEntry } from '../types';
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

// Get text with English fallback (use ONLY in search/indexing contexts — never in UI rendering)
export function getTextWithFallback(record: Record<LangCode, string> | undefined, lang: LangCode): string {
  if (!record) return '';
  return record[lang] || record['en'] || '';
}

export function filterByEdition<T extends { editions: EditionId[] }>(items: T[], edition: EditionId): T[] {
  return items.filter(item => item.editions.includes(edition));
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

export function getClanDisplayNameById(clanId: string, edition: EditionId, lang: LangCode): string {
  const clan = clans.find(c => c.id === clanId);
  if (!clan) return clanId;
  return getClanDisplayName(clan, edition, lang);
}
