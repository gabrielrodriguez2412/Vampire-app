import { disciplines } from '@/data/disciplines';
import type { LangCode } from '@/types';

/**
 * Discipline display-name translation table.
 *
 * `DisciplineEntry.name` in `data/disciplines.ts` is a plain English
 * string (the data shape predates the per-field `Record<LangCode, string>`
 * pattern). Rather than migrating every entry in the data file (which
 * would ripple through clan cards, search, and a dozen tests at
 * once), Batch H ships a small lookup table here. Consumers call
 * `getDisciplineDisplayName(id, lang)` and get a localized name; if no
 * mapping exists for an id/locale, the helper falls back to the
 * discipline's data-side English `name`, and finally to the raw id.
 *
 * Spanish names below follow the suggested list (Animalismo,
 * Celeridad, Dominación, etc.) and are the same set that natively
 * appears in Spanish-language White Wolf material where one exists.
 * Latin-origin proper nouns that don't translate (Auspex, Quietus,
 * Serpentis, Valeren) are kept as-is rather than forced into awkward
 * Spanish forms. Items the data file lists but where I'm not certain
 * of a consensus Spanish term carry a TODO marker — they'll fall
 * through to the English name for now, which is the same behavior
 * as before this helper landed (no regression).
 *
 * Adding a new discipline:
 *   1. Add a row below keyed by the canonical lowercase id.
 *   2. Run the test in `__tests__/disciplineDisplay.test.ts`; the
 *      drift-guard case will fail if a discipline in the data file
 *      is missing here.
 *
 * NOT in scope for this helper:
 *   - Power names. `DisciplinePower.name` is also a plain English
 *     string. Translating each individual power's name is a deeper
 *     content batch — for now we render them in English under
 *     whichever locale is active. The clan-card / discipline-card
 *     name is the user-visible win Batch H ships.
 *     TODO(batch-h-disciplines): build a power-name lookup keyed by
 *     `${disciplineId}.${powerName}` when a future content batch is
 *     ready to translate them.
 */
const NAMES: Record<string, Partial<Record<LangCode, string>>> = {
  animalism: { en: 'Animalism', es: 'Animalismo' },
  auspex: { en: 'Auspex', es: 'Auspex' },
  celerity: { en: 'Celerity', es: 'Celeridad' },
  dominate: { en: 'Dominate', es: 'Dominación' },
  fortitude: { en: 'Fortitude', es: 'Fortaleza' },
  obfuscate: { en: 'Obfuscate', es: 'Ofuscación' },
  potence: { en: 'Potence', es: 'Potencia' },
  presence: { en: 'Presence', es: 'Presencia' },
  protean: { en: 'Protean', es: 'Proteanismo' },
  blood_sorcery: { en: 'Blood Sorcery', es: 'Hechicería de Sangre' },
  oblivion: { en: 'Oblivion', es: 'Olvido' },
  thin_blood_alchemy: { en: 'Thin-Blood Alchemy', es: 'Alquimia de Sangre Débil' },
  thaumaturgy: { en: 'Thaumaturgy', es: 'Taumaturgia' },
  obtenebration: { en: 'Obtenebration', es: 'Obtenebración' },
  necromancy: { en: 'Necromancy', es: 'Nigromancia' },
  // Quietus / Serpentis / Valeren are Latin proper nouns kept as-is
  // in most published Spanish material rather than forced into
  // hispanicized forms.
  quietus: { en: 'Quietus', es: 'Quietus' },
  serpentis: { en: 'Serpentis', es: 'Serpentis' },
  valeren: { en: 'Valeren', es: 'Valeren' },
  vicissitude: { en: 'Vicissitude', es: 'Vicisitud' },
  chimerstry: { en: 'Chimerstry', es: 'Quimerismo' },
};

/**
 * Resolve a discipline's display name for a given language. Falls back
 * through:
 *   1. NAMES[id][lang]        — the curated translation
 *   2. NAMES[id]['en']        — the curated English name
 *   3. data `DisciplineEntry.name` lookup — original data-side string
 *   4. id, capitalized        — last-ditch readable label
 *
 * The third step keeps backwards compatibility: a discipline that ships
 * in `disciplines.ts` but isn't yet in the NAMES map will render
 * exactly as it did before this helper existed.
 */
export function getDisciplineDisplayName(id: string, lang: LangCode): string {
  const entry = NAMES[id];
  if (entry) {
    const localized = entry[lang];
    if (localized && localized.trim() !== '') return localized;
    if (entry.en && entry.en.trim() !== '') return entry.en;
  }
  const dataEntry = disciplines.find(d => d.id === id);
  if (dataEntry && dataEntry.name) return dataEntry.name;
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Whether the resolved display name for `(id, lang)` is the EN-language
 * curated translation rather than a native locale entry. Used by
 * consumers that want to render a subtle "EN" fallback chip next to
 * the discipline name (e.g. on the disciplines list card title when
 * the active locale is `es` but the discipline has no curated `es`
 * row in the table yet).
 *
 * Returns false when `lang === 'en'` even if EN is the active locale —
 * an English user reading an English string is not a fallback.
 */
export function isDisciplineNameUsingFallback(id: string, lang: LangCode): boolean {
  if (lang === 'en') return false;
  const entry = NAMES[id];
  if (!entry) return true;
  const localized = entry[lang];
  return !(localized && localized.trim() !== '');
}
