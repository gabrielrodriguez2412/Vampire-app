/**
 * Batch BJ — pure-helper tests for the dormant-data predicates that
 * drive the inline prompts inside the Morality / Vitae / Powers cards.
 * No React, no DOM — the helpers are deterministic data functions.
 *
 * Each helper has four classes of "false" return:
 *   1. Ineligible kind / edition.
 *   2. Matching `track*` flag is already on (data is visible, not dormant).
 *   3. Matching `dismissedDormant*Prompt` flag is on (user has decided).
 *   4. Data field is trivially empty.
 *
 * And one class of "true" return: the canonical pre-Batch-BA dormant
 * shape on a still-eligible character.
 */
import { describe, it, expect } from 'vitest';
import { hasDormantHumanity, hasDormantVitae, hasDormantPowers } from '../dormantData';
import type { Character, V5Character, ClassicCharacter } from '@/types';

function makeMortalClassic(kind: 'human' | 'ghoul', overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: '1', name: 'Mortal', clan: '', edition: 'V20', kind,
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as ClassicCharacter;
}

function makeMortalV5(kind: 'human' | 'ghoul', overrides: Partial<V5Character> = {}): V5Character {
  return {
    id: '1', name: 'Mortal', clan: '', edition: 'V5', kind,
    attributes: {}, skills: {}, disciplines: {},
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as V5Character;
}

function makeVampireClassic(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: 'v', name: 'V', clan: 'brujah', edition: 'V20', kind: 'vampire',
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    bloodPool: { current: 10, max: 10 },
    generation: 13, humanity: 7,
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as ClassicCharacter;
}

describe('hasDormantHumanity', () => {
  it('returns true for a Human with stored humanity > 0 and no track / dismissal flag', () => {
    expect(hasDormantHumanity(makeMortalClassic('human', { humanity: 7 } as any))).toBe(true);
  });

  it('returns true for a Ghoul with stored humanity > 0', () => {
    expect(hasDormantHumanity(makeMortalClassic('ghoul', { humanity: 5 } as any))).toBe(true);
  });

  it('returns true for a V5 mortal with stored humanity > 0', () => {
    expect(hasDormantHumanity(makeMortalV5('human', { humanity: 7 } as any))).toBe(true);
  });

  it('returns false for a vampire (gated by kind, never prompted)', () => {
    expect(hasDormantHumanity(makeVampireClassic({ humanity: 7 }))).toBe(false);
  });

  it('returns false when trackMorality is already true (data is visible, not dormant)', () => {
    expect(hasDormantHumanity(makeMortalClassic('human', { humanity: 7, trackMorality: true } as any))).toBe(false);
  });

  it('returns false when the user has dismissed the prompt for this character', () => {
    expect(hasDormantHumanity(makeMortalClassic('ghoul', { humanity: 4, dismissedDormantMoralityPrompt: true } as any))).toBe(false);
  });

  it('returns false for a mortal with no humanity field on disk', () => {
    expect(hasDormantHumanity(makeMortalClassic('human'))).toBe(false);
  });

  it('returns false for humanity === 0 (trivially empty)', () => {
    expect(hasDormantHumanity(makeMortalClassic('ghoul', { humanity: 0 } as any))).toBe(false);
  });

  it('returns false for non-numeric humanity (defensive: malformed data)', () => {
    const m = makeMortalClassic('human') as Character & { humanity: unknown };
    (m as any).humanity = '7';
    expect(hasDormantHumanity(m)).toBe(false);
  });

  it('treats a missing kind as vampire (default), returning false', () => {
    const legacy = { ...makeMortalClassic('human'), humanity: 7 } as any;
    delete legacy.kind;
    expect(hasDormantHumanity(legacy)).toBe(false);
  });
});

describe('hasDormantVitae', () => {
  it('returns true for a classic Ghoul with stored bloodPool > 0 / 0', () => {
    expect(hasDormantVitae(makeMortalClassic('ghoul', { bloodPool: { current: 10, max: 10 } } as any))).toBe(true);
  });

  it('returns true even when only `current` is positive (dormant data may be partially edited)', () => {
    expect(hasDormantVitae(makeMortalClassic('ghoul', { bloodPool: { current: 4, max: 0 } } as any))).toBe(true);
  });

  it('returns true even when only `max` is positive', () => {
    expect(hasDormantVitae(makeMortalClassic('ghoul', { bloodPool: { current: 0, max: 3 } } as any))).toBe(true);
  });

  it('returns false for a Human with stored bloodPool (gated by kind)', () => {
    expect(hasDormantVitae(makeMortalClassic('human', { bloodPool: { current: 10, max: 10 } } as any))).toBe(false);
  });

  it('returns false for a V5 Ghoul (gated by edition)', () => {
    expect(hasDormantVitae(makeMortalV5('ghoul', { bloodPool: { current: 5, max: 5 } } as any))).toBe(false);
  });

  it('returns false for a vampire', () => {
    expect(hasDormantVitae(makeVampireClassic())).toBe(false);
  });

  it('returns false when trackVitae is already true', () => {
    expect(hasDormantVitae(makeMortalClassic('ghoul', { trackVitae: true, bloodPool: { current: 2, max: 3 } } as any))).toBe(false);
  });

  it('returns false when dismissed', () => {
    expect(hasDormantVitae(makeMortalClassic('ghoul', { dismissedDormantVitaePrompt: true, bloodPool: { current: 10, max: 10 } } as any))).toBe(false);
  });

  it('returns false for a ghoul with no bloodPool on disk', () => {
    expect(hasDormantVitae(makeMortalClassic('ghoul'))).toBe(false);
  });

  it('returns false for bloodPool: { current: 0, max: 0 }', () => {
    expect(hasDormantVitae(makeMortalClassic('ghoul', { bloodPool: { current: 0, max: 0 } } as any))).toBe(false);
  });

  it('returns false for a non-object bloodPool (defensive)', () => {
    const ghoul = makeMortalClassic('ghoul') as Character;
    (ghoul as any).bloodPool = 10;
    expect(hasDormantVitae(ghoul)).toBe(false);
  });
});

describe('hasDormantPowers', () => {
  it('returns true for a classic Ghoul with a non-empty disciplines map', () => {
    expect(hasDormantPowers(makeMortalClassic('ghoul', { disciplines: { potence: 1 } as any }))).toBe(true);
  });

  it('returns false for the empty `disciplines: {}` createEmptyCharacter seed (trivially empty)', () => {
    expect(hasDormantPowers(makeMortalClassic('ghoul'))).toBe(false);
  });

  it('returns false for a Human with disciplines on disk (gated by kind)', () => {
    expect(hasDormantPowers(makeMortalClassic('human', { disciplines: { potence: 1 } as any }))).toBe(false);
  });

  it('returns false for a V5 Ghoul (gated by edition)', () => {
    expect(hasDormantPowers(makeMortalV5('ghoul', { disciplines: { auspex: 1 } as any }))).toBe(false);
  });

  it('returns false for a vampire', () => {
    expect(hasDormantPowers(makeVampireClassic({ disciplines: { dominate: 3 } as any }))).toBe(false);
  });

  it('returns false when trackGhoulPowers is already true', () => {
    expect(hasDormantPowers(makeMortalClassic('ghoul', { trackGhoulPowers: true, disciplines: { potence: 1 } as any }))).toBe(false);
  });

  it('returns false when dismissed', () => {
    expect(hasDormantPowers(makeMortalClassic('ghoul', { dismissedDormantPowersPrompt: true, disciplines: { potence: 1 } as any }))).toBe(false);
  });

  it('returns false for a non-object disciplines (defensive)', () => {
    const ghoul = makeMortalClassic('ghoul') as Character;
    (ghoul as any).disciplines = 'not-an-object';
    expect(hasDormantPowers(ghoul)).toBe(false);
  });
});
