import type { LangCode } from '@/types';

/**
 * Discipline power-display translation tables.
 *
 * Batch H localized discipline-level names (Animalism → Animalismo).
 * Batch I extends that work to the per-power level: power **names**
 * appear as bold headings inside each discipline's collapsed Powers
 * accordion, and they are the next-most-visible text on the page
 * after the discipline title itself. They are stored in the data
 * file as plain English strings (`DisciplinePower.name: string`),
 * so we use the same lookup-table pattern as `disciplineDisplay.ts`
 * rather than migrating the schema and rippling through every
 * discipline / power / test.
 *
 * Scope (Batch I):
 *   - **Power names** for the 12 priority disciplines listed in
 *     `POWER_NAME_OVERRIDES` below. Other disciplines fall through
 *     to the data-side English name (no regression).
 *   - **Type label** for every visible discipline type string. The
 *     data file still stores types via `fallbackStr` (English in
 *     every slot), so a localized type badge has to come from a
 *     lookup. See `TYPE_OVERRIDES` below.
 *   - Power **descriptions** and **tactical-use** lines are NOT in
 *     this helper — those live in `data/disciplines.ts` and were
 *     converted from `fallbackStr` to `enEs` in this same batch so
 *     the existing `getText` / `getLocalizedText` chain handles
 *     them natively.
 *
 * Out of scope:
 *   - Power names for the 8 non-priority disciplines (Obtenebration,
 *     Necromancy, Quietus, Serpentis, Vicissitude, Chimerstry,
 *     Thaumaturgy, Valeren). The helper falls through to the data
 *     English name. A future batch can extend the table when those
 *     disciplines are next.
 *   - Special-system items (rituals / paths / ceremonies / formulae).
 *     They already carry their own `needsReview` markers in the data
 *     and a deeper rework is queued for a separate content batch.
 *
 * TODO(batch-i-disciplines): when the non-priority disciplines are
 * translated, append their entries here and extend the drift-guard
 * test to cover them.
 */

/**
 * Per-discipline power-name overrides, keyed by discipline id then
 * by level. We use `level` as the inner key (rather than power index
 * or English name) because the disciplines data file consistently
 * stores one power per dot level 1..5 — making the lookup stable
 * across data refactors.
 *
 * Each entry only stores the locales we actually translated. The
 * resolver below falls through to the data-side English name when
 * a locale row is missing.
 */
const POWER_NAME_OVERRIDES: Record<string, Record<number, Partial<Record<LangCode, string>>>> = {
  animalism: {
    1: { es: 'Vínculo Famulus' },
    // Animalism in the data file uses generic "Sense the Beast" /
    // "Feral Whispers" / etc. — the ES strings below are short
    // app-safe paraphrases that line up with the existing Spanish
    // power descriptions already in the data file.
    2: { es: 'Susurros Salvajes' },
    3: { es: 'Suculencia Animal' },
    4: { es: 'Aplacar la Bestia' },
    5: { es: 'Sacar la Bestia' },
  },
  auspex: {
    1: { es: 'Sentidos Agudizados' },
    2: { es: 'Premonición' },
    3: { es: 'Escrutinio del Alma' },
    4: { es: 'Telepatía' },
    5: { es: 'Clarividencia' },
  },
  blood_sorcery: {
    1: { es: 'Vitae Corrosiva' },
    2: { es: 'Disrupción de Vitae' },
    3: { es: 'Oleada de Potencia de Sangre' },
    4: { es: 'Robo de Vitae a Distancia' },
    5: { es: 'Toque Mortal' },
  },
  celerity: {
    1: { es: 'Reflejos Rápidos' },
    2: { es: 'Velocidad' },
    3: { es: 'Estallido de Velocidad' },
    4: { es: 'Acción Acelerada' },
    5: { es: 'Movimiento Imperceptible' },
  },
  dominate: {
    1: { es: 'Nublar la Memoria' },
    2: { es: 'Hipnotizar' },
    3: { es: 'Remodelar Memoria' },
    4: { es: 'Razonamiento Forzado' },
    5: { es: 'Mandato Absoluto' },
  },
  fortitude: {
    1: { es: 'Resiliencia' },
    2: { es: 'Dureza' },
    3: { es: 'Mente Firme' },
    4: { es: 'Desafiar la Maldición' },
    5: { es: 'Carne de Mármol' },
  },
  obfuscate: {
    1: { es: 'Manto de Sombras' },
    2: { es: 'Paso Invisible' },
    3: { es: 'Oculto a las Lentes' },
    4: { es: 'Desvanecimiento Súbito' },
    5: { es: 'Rostro Falso' },
  },
  oblivion: {
    1: { es: 'Paso de Sombra' },
    2: { es: 'Alcance en la Sombra' },
    3: { es: 'Toque de Decadencia' },
    4: { es: 'Velo Estigio' },
    5: { es: 'Cuerpo Tenebroso' },
  },
  potence: {
    1: { es: 'Cuerpo Letal' },
    2: { es: 'Proeza' },
    3: { es: 'Alimentación Aplastante' },
    4: { es: 'Embestida Demoledora' },
    5: { es: 'Golpe Sísmico' },
  },
  presence: {
    1: { es: 'Asombro' },
    2: { es: 'Intimidación' },
    3: { es: 'Corazón Devoto' },
    4: { es: 'Convocatoria Distante' },
    5: { es: 'Corona del Asombro' },
  },
  protean: {
    1: { es: 'Ojos de la Bestia' },
    2: { es: 'Armas Salvajes' },
    3: { es: 'Forma Bestial' },
    4: { es: 'Abrazo de la Tierra' },
    5: { es: 'Cuerpo de Niebla' },
  },
  // thin_blood_alchemy has no flat powers list (special-systems only).
  // No entries here is intentional — see the helper's pending-review
  // section in `data/disciplines.ts` for the formulae placeholders.
};

/**
 * Resolve a power name for display. Falls back through:
 *   1. NAMES[discipline][level][lang]   — curated translation
 *   2. NAMES[discipline][level]['en']   — curated English (rare; we
 *      use the data's English instead in practice)
 *   3. fallbackDataName                 — the `name` field from the
 *      discipline data file
 *   4. id-ish synthetic label           — last resort
 */
export function getDisciplinePowerName(
  disciplineId: string,
  level: number,
  fallbackDataName: string,
  lang: LangCode,
): string {
  const disc = POWER_NAME_OVERRIDES[disciplineId];
  if (disc) {
    const entry = disc[level];
    if (entry) {
      const localized = entry[lang];
      if (localized && localized.trim() !== '') return localized;
      if (entry.en && entry.en.trim() !== '') return entry.en;
    }
  }
  if (fallbackDataName && fallbackDataName.trim() !== '') return fallbackDataName;
  return `${disciplineId}-${level}`;
}

/**
 * Same fallback-detection contract as `isDisciplineNameUsingFallback`
 * in the discipline-display helper: returns `true` only when the
 * active locale is non-English AND the override table has no
 * curated entry for it. The disciplines page uses this to render a
 * subtle "EN" chip beside the power title when we are leaning on
 * the data-side English name.
 */
export function isDisciplinePowerNameUsingFallback(
  disciplineId: string,
  level: number,
  lang: LangCode,
): boolean {
  if (lang === 'en') return false;
  const disc = POWER_NAME_OVERRIDES[disciplineId];
  if (!disc) return true;
  const entry = disc[level];
  if (!entry) return true;
  const localized = entry[lang];
  return !(localized && localized.trim() !== '');
}

/**
 * Discipline `type` field translation table.
 *
 * Most type strings in `data/disciplines.ts` are stored via
 * `fallbackStr("Physical")` — i.e. baked English in every locale,
 * which silently shows English under a Spanish UI. Animalism and
 * Auspex are the only two with hand-written Spanish type strings in
 * the data. The table below normalizes the rest.
 *
 * Keyed by discipline id (not by type string) because some
 * disciplines share a type label but might diverge in a future
 * edition (e.g. Blood Sorcery vs. Thaumaturgy both render
 * "Sorcery"/"Hechicería" today, but only one of them might gain
 * "Hechicería de Sangre" as a distinct type tag later).
 */
const TYPE_OVERRIDES: Record<string, Partial<Record<LangCode, string>>> = {
  // Animalism + Auspex already carry ES in the data file; entries
  // here are duplicated for consistency so the helper returns one
  // canonical Spanish label regardless of which source supplied it.
  animalism: { es: 'Mental' },
  auspex: { es: 'Sensorial' },
  celerity: { es: 'Físico' },
  dominate: { es: 'Mental' },
  obfuscate: { es: 'Sigilo' },
  presence: { es: 'Social' },
  protean: { es: 'Transformación' },
  fortitude: { es: 'Físico' },
  potence: { es: 'Físico' },
  blood_sorcery: { es: 'Hechicería' },
  oblivion: { es: 'Sombra/Muerte' },
  thin_blood_alchemy: { es: 'Alquimia' },
};

/**
 * Resolve the localized type label for a discipline. Falls back
 * through:
 *   1. TYPE_OVERRIDES[discipline][lang]  — curated translation
 *   2. fallbackDataType                  — whatever the data record
 *      returned for the active locale (typically English when the
 *      type field uses `fallbackStr`)
 *   3. empty string                      — defensive; consumer can
 *      decide whether to render anything
 */
export function getDisciplineTypeLabel(
  disciplineId: string,
  fallbackDataType: string | null,
  lang: LangCode,
): string {
  const entry = TYPE_OVERRIDES[disciplineId];
  if (entry) {
    const localized = entry[lang];
    if (localized && localized.trim() !== '') return localized;
  }
  return fallbackDataType ?? '';
}
