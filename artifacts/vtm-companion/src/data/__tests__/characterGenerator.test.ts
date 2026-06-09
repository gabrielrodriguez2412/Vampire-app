/**
 * Batch AQ — random character-creation generator data + pure helpers.
 *
 * Drives the pickers with a seeded rng so suggestions are deterministic
 * in tests. Also pins which fields are available per edition so a
 * future edit can't quietly add (e.g.) Predator suggestions to a
 * classic sheet.
 */
import { describe, it, expect } from 'vitest';
import {
  pickRandom,
  poolFor,
  isFieldAvailable,
  generateSuggestion,
  generateInspirationBundle,
  GeneratorField,
} from '../characterGenerator';

describe('pickRandom (Batch AQ)', () => {
  it('returns the entry at the rng-determined index', () => {
    const pool = ['a', 'b', 'c', 'd'];
    expect(pickRandom(pool, () => 0)).toBe('a');
    expect(pickRandom(pool, () => 0.4)).toBe('b');
    expect(pickRandom(pool, () => 0.6)).toBe('c');
    expect(pickRandom(pool, () => 0.99)).toBe('d');
  });

  it('throws on an empty pool', () => {
    expect(() => pickRandom([], () => 0)).toThrow();
  });
});

describe('poolFor + isFieldAvailable (Batch AQ) — edition gating', () => {
  it('V5: name / concept / appearance / personality are available', () => {
    for (const field of ['name', 'concept', 'appearance', 'personality'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V5')).toBe(true);
      expect(poolFor(field, 'V5').length).toBeGreaterThan(0);
    }
  });

  it('V5: ambition / desire / predator are available; nature / demeanor are not', () => {
    for (const field of ['ambition', 'desire', 'predator'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V5')).toBe(true);
    }
    for (const field of ['nature', 'demeanor'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V5')).toBe(false);
      expect(poolFor(field, 'V5')).toEqual([]);
    }
  });

  it('V20/classic: nature / demeanor are available; ambition / desire / predator are not', () => {
    for (const field of ['nature', 'demeanor'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V20')).toBe(true);
    }
    for (const field of ['ambition', 'desire', 'predator'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V20')).toBe(false);
      expect(poolFor(field, 'V20')).toEqual([]);
    }
  });

  it('every classic edition (V20, REVISED, 2ND, 1ST) gates V5-only fields the same way', () => {
    for (const ed of ['V20', 'REVISED', '2ND', '1ST'] as const) {
      expect(isFieldAvailable('ambition', ed)).toBe(false);
      expect(isFieldAvailable('predator', ed)).toBe(false);
      expect(isFieldAvailable('nature', ed)).toBe(true);
    }
  });
});

describe('generateSuggestion (Batch AQ)', () => {
  it('returns a non-empty string when the field is available', () => {
    expect(generateSuggestion('name', 'V5', () => 0).length).toBeGreaterThan(0);
    expect(generateSuggestion('concept', 'V20', () => 0.5).length).toBeGreaterThan(0);
    expect(generateSuggestion('ambition', 'V5', () => 0).length).toBeGreaterThan(0);
    expect(generateSuggestion('nature', 'V20', () => 0).length).toBeGreaterThan(0);
  });

  it("returns '' when the field is not available for the edition", () => {
    expect(generateSuggestion('ambition', 'V20', () => 0)).toBe('');
    expect(generateSuggestion('nature', 'V5', () => 0)).toBe('');
  });

  it('is deterministic with a seeded rng', () => {
    expect(generateSuggestion('name', 'V5', () => 0)).toBe(generateSuggestion('name', 'V5', () => 0));
  });
});

describe('generateInspirationBundle (Batch AQ)', () => {
  it('returns both an appearance and a personality string', () => {
    const b = generateInspirationBundle(() => 0);
    expect(b.appearance).toBeTruthy();
    expect(b.personality).toBeTruthy();
  });

  it('is deterministic with a seeded rng', () => {
    const seed = () => 0.42;
    expect(generateInspirationBundle(seed)).toEqual(generateInspirationBundle(seed));
  });
});

describe('original-content guard (Batch AQ)', () => {
  // Defence-in-depth: the prompts must be original short content
  // authored for the app, NOT verbatim official rulebook strings. We
  // pin a few characteristic phrases the published V20 / V5 books use
  // and confirm none of them leak through any pool. This catches a
  // future contributor who pastes a rulebook table by mistake.
  const RULEBOOK_PHRASES = [
    'Architect', 'Bon Vivant', 'Conformist', 'Director', 'Loner',
    'Survivor', 'Trickster', 'Visionary', 'Caregiver',
    'Alleycat', 'Bagger', 'Cleaver', 'Farmer', 'Osiris',
    'Sandman', 'Scene Queen', 'Siren', 'Consensualist', 'Roadside Killer',
  ];
  it('no characteristic rulebook archetype/predator-type names appear in any pool', () => {
    const allPools = [
      ...poolFor('name', 'V5'),
      ...poolFor('concept', 'V5'),
      ...poolFor('appearance', 'V5'),
      ...poolFor('personality', 'V5'),
      ...poolFor('ambition', 'V5'),
      ...poolFor('desire', 'V5'),
      ...poolFor('predator', 'V5'),
      ...poolFor('nature', 'V20'),
      ...poolFor('demeanor', 'V20'),
    ];
    for (const phrase of RULEBOOK_PHRASES) {
      for (const entry of allPools) {
        expect(entry).not.toContain(phrase);
      }
    }
  });
});
