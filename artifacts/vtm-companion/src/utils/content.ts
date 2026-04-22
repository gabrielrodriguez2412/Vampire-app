import { LangCode, EditionId } from '../types';

export function getText(record: Record<LangCode, string>, lang: LangCode): string {
  if (record[lang]) return record[lang];
  if (record['en']) return record['en'];
  return "Content not available";
}

export function getTextArray(record: Record<LangCode, string[]>, lang: LangCode): string[] {
  if (record[lang]) return record[lang];
  if (record['en']) return record['en'];
  return [];
}

export function filterByEdition<T extends { editions: EditionId[] }>(items: T[], edition: EditionId): T[] {
  return items.filter(item => item.editions.includes(edition));
}

export function isAvailableInLang(record: Record<LangCode, string>, lang: LangCode): boolean {
  return !!record[lang];
}
