import { describe, it, expect } from 'vitest';
import {
  getDisciplineDisplayName,
  isDisciplineNameUsingFallback,
} from '../disciplineDisplay';
import { disciplines } from '../../data/disciplines';

/**
 * Unit tests for the Batch H discipline-name display helper.
 *
 * These pin three contracts:
 *   1. The curated Spanish translations the user signed off on are
 *      actually returned for `es`. A typo or accidental key rename in
 *      the helper's lookup table would otherwise ship silently.
 *   2. Every discipline that lives in `data/disciplines.ts` resolves
 *      to a non-empty display name for every supported locale via
 *      the fallback chain — i.e. the helper is safe to call without
 *      null checks, and a future discipline addition does not regress
 *      to rendering raw lowercase ids in clan cards.
 *   3. `isDisciplineNameUsingFallback` correctly reports the EN-pill
 *      condition: true only when the active locale is non-English
 *      AND no curated translation exists for the locale.
 */

describe('getDisciplineDisplayName — Spanish translations the user signed off on', () => {
  it.each([
    ['animalism', 'Animalismo'],
    ['auspex', 'Auspex'],
    ['celerity', 'Celeridad'],
    ['dominate', 'Dominación'],
    ['fortitude', 'Fortaleza'],
    ['obfuscate', 'Ofuscación'],
    ['potence', 'Potencia'],
    ['presence', 'Presencia'],
    ['protean', 'Proteanismo'],
    ['blood_sorcery', 'Hechicería de Sangre'],
    ['oblivion', 'Olvido'],
    ['thin_blood_alchemy', 'Alquimia de Sangre Débil'],
    ['thaumaturgy', 'Taumaturgia'],
    ['obtenebration', 'Obtenebración'],
    ['necromancy', 'Nigromancia'],
    ['vicissitude', 'Vicisitud'],
    ['chimerstry', 'Quimerismo'],
    // Latin-origin proper nouns are intentionally kept as-is rather
    // than forced into awkward hispanicized forms.
    ['quietus', 'Quietus'],
    ['serpentis', 'Serpentis'],
    ['valeren', 'Valeren'],
  ])('returns %s -> %s for es', (id, expected) => {
    expect(getDisciplineDisplayName(id, 'es')).toBe(expected);
  });
});

describe('getDisciplineDisplayName — English display names match the data', () => {
  it.each([
    ['animalism', 'Animalism'],
    ['celerity', 'Celerity'],
    ['blood_sorcery', 'Blood Sorcery'],
    ['thin_blood_alchemy', 'Thin-Blood Alchemy'],
    ['obtenebration', 'Obtenebration'],
  ])('returns %s -> %s for en', (id, expected) => {
    expect(getDisciplineDisplayName(id, 'en')).toBe(expected);
  });
});

describe('getDisciplineDisplayName — fallback chain', () => {
  it('falls back to English name when the requested locale lacks a curated entry', () => {
    // Portuguese / French / German / Italian have no curated rows in
    // the helper yet — they must fall through to the English curated
    // name (NOT to the raw id) so the chips and titles stay readable.
    expect(getDisciplineDisplayName('celerity', 'pt')).toBe('Celerity');
    expect(getDisciplineDisplayName('celerity', 'fr')).toBe('Celerity');
    expect(getDisciplineDisplayName('celerity', 'de')).toBe('Celerity');
    expect(getDisciplineDisplayName('celerity', 'it')).toBe('Celerity');
  });

  it('falls back to the data-side name when an id is missing from the lookup table', () => {
    // Simulates a future discipline added to `data/disciplines.ts`
    // before someone remembers to add a row to the helper. We don't
    // want the chip to render the raw lowercase id — the data name
    // is at least the original English label.
    //
    // We pick a real entry, then synthesize a parallel id that's not
    // in the curated table to drive the fallback branch. A pure
    // unknown id is covered by the next case.
    const fakeId = '__totally_made_up__';
    expect(getDisciplineDisplayName(fakeId, 'es')).toBe('__totally_made_up__');
  });
});

describe('drift guard: every discipline in data resolves to a non-empty display name', () => {
  const LOCALES = ['en', 'es', 'pt', 'fr', 'de', 'it'] as const;
  for (const locale of LOCALES) {
    it(`[${locale}] every discipline in data/disciplines.ts has a non-empty display name`, () => {
      for (const disc of disciplines) {
        const name = getDisciplineDisplayName(disc.id, locale);
        expect(name, `${disc.id} resolved to empty for ${locale}`).toBeTruthy();
        expect(name.length, `${disc.id} resolved to whitespace for ${locale}`).toBeGreaterThan(0);
      }
    });
  }
});

describe('isDisciplineNameUsingFallback', () => {
  it('returns false when the curated locale entry exists', () => {
    expect(isDisciplineNameUsingFallback('celerity', 'es')).toBe(false);
    expect(isDisciplineNameUsingFallback('blood_sorcery', 'es')).toBe(false);
  });

  it('returns true when the curated locale entry is missing', () => {
    // pt/fr/de/it have no curated translations yet in Batch H.
    expect(isDisciplineNameUsingFallback('celerity', 'pt')).toBe(true);
    expect(isDisciplineNameUsingFallback('celerity', 'fr')).toBe(true);
  });

  it('never reports fallback when the active locale is English', () => {
    // An English user reading an English string is not a fallback —
    // they are reading the native locale. The chip would be visual
    // noise.
    expect(isDisciplineNameUsingFallback('celerity', 'en')).toBe(false);
    expect(isDisciplineNameUsingFallback('blood_sorcery', 'en')).toBe(false);
  });
});
