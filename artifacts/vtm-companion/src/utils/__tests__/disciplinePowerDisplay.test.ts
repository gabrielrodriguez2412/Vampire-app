import { describe, it, expect } from 'vitest';
import {
  getDisciplinePowerName,
  isDisciplinePowerNameUsingFallback,
  getDisciplineTypeLabel,
} from '../disciplinePowerDisplay';
import { disciplines } from '../../data/disciplines';
import type { LangCode } from '../../types';

/**
 * Batch I — discipline power-display tests.
 *
 * These pin three contracts:
 *   1. Curated Spanish power names + type labels for the 12 priority
 *      disciplines are returned for `es`. A typo or accidental key
 *      rename in the overrides table would otherwise ship silently.
 *   2. Every priority discipline has all 5 levels covered in the
 *      power-name table (drift guard against forgetting one).
 *   3. `isDisciplinePowerNameUsingFallback` correctly reports the
 *      EN-pill condition.
 *
 * Out of scope: power names for the 8 non-priority disciplines. The
 * helper returns the data-side English name for those, which is the
 * intentional pre-Batch-I behavior. A future batch can extend the
 * table.
 */

const PRIORITY_DISCIPLINES = [
  'animalism',
  'auspex',
  'celerity',
  'dominate',
  'fortitude',
  'obfuscate',
  'potence',
  'presence',
  'protean',
  'blood_sorcery',
  'oblivion',
  // Batch L: extended to the previously non-priority classics now
  // that they too have curated Spanish power-name translations.
  'obtenebration',
  'quietus',
  'serpentis',
  'vicissitude',
  'chimerstry',
  'valeren',
] as const;

const SPANISH_POWER_NAMES: Array<[string, number, string]> = [
  // animalism
  ['animalism', 1, 'Vínculo Famulus'],
  ['animalism', 2, 'Susurros Salvajes'],
  ['animalism', 3, 'Suculencia Animal'],
  ['animalism', 4, 'Aplacar la Bestia'],
  ['animalism', 5, 'Sacar la Bestia'],
  // auspex
  ['auspex', 1, 'Sentidos Agudizados'],
  ['auspex', 2, 'Premonición'],
  ['auspex', 3, 'Escrutinio del Alma'],
  ['auspex', 4, 'Telepatía'],
  ['auspex', 5, 'Clarividencia'],
  // blood_sorcery
  ['blood_sorcery', 1, 'Vitae Corrosiva'],
  ['blood_sorcery', 2, 'Disrupción de Vitae'],
  ['blood_sorcery', 3, 'Oleada de Potencia de Sangre'],
  ['blood_sorcery', 4, 'Robo de Vitae a Distancia'],
  ['blood_sorcery', 5, 'Toque Mortal'],
  // celerity
  ['celerity', 1, 'Reflejos Rápidos'],
  ['celerity', 5, 'Movimiento Imperceptible'],
  // dominate
  ['dominate', 1, 'Nublar la Memoria'],
  ['dominate', 5, 'Mandato Absoluto'],
  // fortitude
  ['fortitude', 1, 'Resiliencia'],
  ['fortitude', 5, 'Carne de Mármol'],
  // obfuscate
  ['obfuscate', 1, 'Manto de Sombras'],
  ['obfuscate', 5, 'Rostro Falso'],
  // potence
  ['potence', 1, 'Cuerpo Letal'],
  ['potence', 5, 'Golpe Sísmico'],
  // presence
  ['presence', 1, 'Asombro'],
  ['presence', 5, 'Corona del Asombro'],
  // protean
  ['protean', 1, 'Ojos de la Bestia'],
  ['protean', 5, 'Cuerpo de Niebla'],
  // oblivion
  ['oblivion', 1, 'Paso de Sombra'],
  ['oblivion', 5, 'Cuerpo Tenebroso'],
  // Batch L additions — non-priority classic disciplines.
  ['obtenebration', 1, 'Visión Sombría'],
  ['obtenebration', 5, 'Forma Tenebrosa'],
  ['quietus', 1, 'Silencio Sonoro'],
  ['quietus', 5, 'Veredicto Final'],
  ['serpentis', 1, 'Vista de la Serpiente'],
  ['serpentis', 5, 'Ocultación del Corazón'],
  ['vicissitude', 1, 'Remodelado Propio'],
  ['vicissitude', 5, 'Forma de Sangre'],
  ['chimerstry', 1, 'Ilusión Menor'],
  ['chimerstry', 5, 'Velo de Realidad'],
  ['valeren', 1, 'Percibir la Vitalidad'],
  ['valeren', 5, 'Golpe del Tercer Ojo'],
];

describe('getDisciplinePowerName — curated Spanish names', () => {
  it.each(SPANISH_POWER_NAMES)(
    '%s power level %d resolves to "%s" in es',
    (discId, level, expected) => {
      // Pass an empty fallback name so we know the curated entry was used.
      expect(getDisciplinePowerName(discId, level, 'data-en', 'es')).toBe(expected);
    },
  );
});

describe('getDisciplinePowerName — fallback chain', () => {
  it('falls back to the data English name when the curated Spanish row is missing', () => {
    // The thin_blood_alchemy discipline intentionally has no curated
    // entries (it uses special-systems formulae, not a flat powers
    // list). Asking for a power name should fall through to the data
    // string we pass in.
    expect(
      getDisciplinePowerName('thin_blood_alchemy', 1, 'Some Formula', 'es'),
    ).toBe('Some Formula');
  });

  it('falls back to a synthetic id-level label when both curated and data names are empty', () => {
    expect(getDisciplinePowerName('nonexistent', 3, '', 'es')).toBe('nonexistent-3');
  });

  it('returns the curated English name for "en" if present, otherwise the data English name', () => {
    // None of our curated entries supply an explicit "en" row — we
    // intentionally rely on the data English name as the EN source
    // of truth. So passing a real data name should win.
    expect(getDisciplinePowerName('celerity', 1, 'Rapid Reflexes', 'en'))
      .toBe('Rapid Reflexes');
  });
});

describe('getDisciplinePowerName — drift guard for priority disciplines', () => {
  it('every priority discipline + level 1..5 has a non-empty curated Spanish name', () => {
    for (const id of PRIORITY_DISCIPLINES) {
      // thin_blood_alchemy is priority but has no flat powers list,
      // so it's not in this drift guard (its formulae live under
      // specialSystems and are tracked separately as needsReview).
      if (id === ('thin_blood_alchemy' as string)) continue;
      for (const level of [1, 2, 3, 4, 5] as const) {
        const name = getDisciplinePowerName(id, level, '', 'es');
        expect(
          name && name !== `${id}-${level}`,
          `${id}.L${level} has no curated Spanish power name`,
        ).toBe(true);
      }
    }
  });
});

describe('isDisciplinePowerNameUsingFallback', () => {
  it('returns false when a curated locale entry exists', () => {
    expect(isDisciplinePowerNameUsingFallback('celerity', 1, 'es')).toBe(false);
    expect(isDisciplinePowerNameUsingFallback('oblivion', 5, 'es')).toBe(false);
    // Batch L: non-priority disciplines also covered now.
    expect(isDisciplinePowerNameUsingFallback('vicissitude', 1, 'es')).toBe(false);
    expect(isDisciplinePowerNameUsingFallback('quietus', 5, 'es')).toBe(false);
    expect(isDisciplinePowerNameUsingFallback('chimerstry', 3, 'es')).toBe(false);
  });

  it('returns true for locales we have not translated yet', () => {
    // PT / FR / DE / IT have no curated rows anywhere; the helper
    // should still surface this honestly so the page can render the
    // "EN" pill.
    expect(isDisciplinePowerNameUsingFallback('celerity', 1, 'pt')).toBe(true);
    expect(isDisciplinePowerNameUsingFallback('celerity', 1, 'fr')).toBe(true);
    expect(isDisciplinePowerNameUsingFallback('vicissitude', 1, 'pt')).toBe(true);
  });

  it('never reports fallback when the active locale is English', () => {
    expect(isDisciplinePowerNameUsingFallback('celerity', 1, 'en')).toBe(false);
    expect(isDisciplinePowerNameUsingFallback('vicissitude', 1, 'en')).toBe(false);
  });
});

describe('getDisciplineTypeLabel', () => {
  it.each([
    ['celerity', 'Físico'],
    ['dominate', 'Mental'],
    ['obfuscate', 'Sigilo'],
    ['presence', 'Social'],
    ['protean', 'Transformación'],
    ['fortitude', 'Físico'],
    ['potence', 'Físico'],
    ['blood_sorcery', 'Hechicería'],
    ['oblivion', 'Sombra/Muerte'],
    ['thin_blood_alchemy', 'Alquimia'],
    ['animalism', 'Mental'],
    ['auspex', 'Sensorial'],
    // Batch L additions — non-priority classic disciplines.
    ['thaumaturgy', 'Hechicería'],
    ['obtenebration', 'Sombra'],
    ['necromancy', 'Hechicería/Muerte'],
    ['quietus', 'Asesinato'],
    ['serpentis', 'Transformación'],
    ['vicissitude', 'Moldeado de Carne'],
    ['chimerstry', 'Ilusión'],
    ['valeren', 'Curación/Combate'],
  ])('returns curated Spanish type for %s -> %s', (id, expected) => {
    expect(getDisciplineTypeLabel(id, 'English fallback', 'es')).toBe(expected);
  });

  it('falls back to the data type string when no curated locale entry exists', () => {
    // A discipline asked in Portuguese — no override — should return
    // whatever the caller passed in as data fallback.
    expect(getDisciplineTypeLabel('vicissitude', 'Fleshcrafting', 'pt'))
      .toBe('Fleshcrafting');
  });

  it('falls back to an empty string when both override and data fallback are missing', () => {
    expect(getDisciplineTypeLabel('nonexistent', null, 'es')).toBe('');
  });
});

describe('drift guard: every discipline in data resolves a non-empty power name for each of its powers', () => {
  const LOCALES: LangCode[] = ['en', 'es', 'pt', 'fr', 'de', 'it'];
  for (const locale of LOCALES) {
    it(`[${locale}] every power resolves to a non-empty display name`, () => {
      for (const disc of disciplines) {
        for (const p of disc.powers) {
          const resolved = getDisciplinePowerName(disc.id, p.level, p.name, locale);
          expect(
            resolved,
            `${disc.id}.L${p.level} resolved to empty for ${locale}`,
          ).toBeTruthy();
        }
      }
    });
  }
});
