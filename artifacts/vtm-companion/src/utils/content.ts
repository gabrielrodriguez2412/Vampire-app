import { LangCode, EditionId } from '../types';

// Returns text in lang. If not available, returns null (no silent fallback).
export function getText(record: Record<LangCode, string> | undefined, lang: LangCode): string | null {
  if (!record) return null;
  const val = record[lang];
  return (val && val.trim() !== '') ? val : null;
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
