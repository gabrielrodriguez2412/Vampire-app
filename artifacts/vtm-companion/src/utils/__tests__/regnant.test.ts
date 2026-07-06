/**
 * Batch BK-1 — pure-helper tests for `resolveRegnantClan`.
 *
 * The helper's contract:
 *   1. Non-ghouls always return the empty resolution.
 *   2. Ghoul with `regnantCharacterId` resolving to a vampire in the
 *      list → linked (clanId + linkedRegnant + displayName from the
 *      vampire).
 *   3. Ghoul with dangling / missing / non-vampire link → falls back
 *      to the manual `character.clan`.
 *   4. Ghoul with neither link nor manual clan → regnant-less.
 */
import { describe, it, expect } from 'vitest';
import { resolveRegnantClan } from '../regnant';
import type { Character, V5Character, ClassicCharacter } from '@/types';

function makeVampire(id: string, name: string, clan: string, edition: Character['edition'] = 'V20'): Character {
  if (edition === 'V5') {
    return {
      id, name, clan, edition: 'V5', kind: 'vampire',
      attributes: {}, skills: {}, disciplines: {},
      health: { damage: 0, aggravated: 0, max: 5 },
      willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 1, humanity: 7,
      experience: 0, createdAt: '', updatedAt: '',
    } as V5Character;
  }
  return {
    id, name, clan, edition, kind: 'vampire',
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    bloodPool: { current: 10, max: 10 },
    generation: 13, humanity: 7,
    experience: 0, createdAt: '', updatedAt: '',
  } as ClassicCharacter;
}

function makeGhoul(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return {
    id: 'g1', name: 'Ghoul', clan: '', edition: 'V20', kind: 'ghoul',
    attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
    virtues: { conscience: 1, selfControl: 1, courage: 1 },
    willpower: { current: 5, max: 5 },
    health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
    experience: 0, createdAt: '', updatedAt: '',
    ...overrides,
  } as ClassicCharacter;
}

function makeHuman(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
  return { ...makeGhoul(overrides), kind: 'human' } as ClassicCharacter;
}

describe('resolveRegnantClan — non-ghoul kinds', () => {
  it('returns empty resolution for a vampire', () => {
    const v = makeVampire('v1', 'Sire', 'brujah');
    expect(resolveRegnantClan(v, [v])).toEqual({ clanId: '', linkedRegnant: null, displayName: '' });
  });

  it('returns empty resolution for a human even with a stray regnantCharacterId', () => {
    const v = makeVampire('v1', 'Sire', 'brujah');
    const h = makeHuman({ regnantCharacterId: 'v1' } as any);
    expect(resolveRegnantClan(h, [v, h])).toEqual({ clanId: '', linkedRegnant: null, displayName: '' });
  });

  it('returns empty resolution when kind is absent (defaults to vampire)', () => {
    const legacy = { ...makeGhoul() } as any;
    delete legacy.kind;
    expect(resolveRegnantClan(legacy as Character, [legacy as Character])).toEqual({ clanId: '', linkedRegnant: null, displayName: '' });
  });
});

describe('resolveRegnantClan — linked ghoul', () => {
  it('returns the linked vampire clan and name when the id resolves', () => {
    const v = makeVampire('v1', 'Aleksandra', 'tremere');
    const g = makeGhoul({ regnantCharacterId: 'v1' } as any);
    const result = resolveRegnantClan(g, [v, g]);
    expect(result.clanId).toBe('tremere');
    expect(result.linkedRegnant).toBe(v);
    expect(result.displayName).toBe('Aleksandra');
  });

  it('uses the linked vampire clan even when the ghoul has a manual clan set (link wins)', () => {
    const v = makeVampire('v1', 'Aleksandra', 'tremere');
    const g = makeGhoul({ regnantCharacterId: 'v1', clan: 'brujah' } as any);
    expect(resolveRegnantClan(g, [v, g]).clanId).toBe('tremere');
  });

  it('resolves the linked vampire when the character list contains multiple candidates', () => {
    const v1 = makeVampire('v1', 'One', 'brujah');
    const v2 = makeVampire('v2', 'Two', 'tremere');
    const g = makeGhoul({ regnantCharacterId: 'v2' } as any);
    expect(resolveRegnantClan(g, [v1, v2, g]).displayName).toBe('Two');
  });
});

describe('resolveRegnantClan — dangling / invalid link falls back to manual clan', () => {
  it('falls through when regnantCharacterId points at a missing id', () => {
    const g = makeGhoul({ regnantCharacterId: 'never-exists', clan: 'brujah' } as any);
    const result = resolveRegnantClan(g, [g]);
    expect(result.clanId).toBe('brujah');
    expect(result.linkedRegnant).toBeNull();
    expect(result.displayName).toBe('');
  });

  it('falls through when the referenced character is not a vampire (e.g. was flipped to human)', () => {
    const notVampire = makeHuman({ id: 'h1' } as any);
    const g = makeGhoul({ regnantCharacterId: 'h1', clan: 'brujah' } as any);
    const result = resolveRegnantClan(g, [notVampire, g]);
    expect(result.clanId).toBe('brujah');
    expect(result.linkedRegnant).toBeNull();
  });

  it('falls through when regnantCharacterId is an empty string', () => {
    const g = makeGhoul({ regnantCharacterId: '', clan: 'tremere' } as any);
    expect(resolveRegnantClan(g, [g]).clanId).toBe('tremere');
  });
});

describe('resolveRegnantClan — regnant-less ghoul', () => {
  it('returns empty resolution when neither link nor manual clan is set', () => {
    const g = makeGhoul();
    expect(resolveRegnantClan(g, [g])).toEqual({ clanId: '', linkedRegnant: null, displayName: '' });
  });

  it('preserves a manual clan when no link exists', () => {
    const g = makeGhoul({ clan: 'ventrue' } as any);
    const result = resolveRegnantClan(g, [g]);
    expect(result.clanId).toBe('ventrue');
    expect(result.linkedRegnant).toBeNull();
    expect(result.displayName).toBe('');
  });
});

describe('resolveRegnantClan — archived and edition-flipped regnants', () => {
  it('resolves normally for an archived vampire (archived is still a valid regnant record)', () => {
    const v = makeVampire('v1', 'Retired', 'ventrue');
    (v as { status?: string }).status = 'archived';
    const g = makeGhoul({ regnantCharacterId: 'v1' } as any);
    const result = resolveRegnantClan(g, [v, g]);
    expect(result.linkedRegnant).toBe(v);
    expect(result.clanId).toBe('ventrue');
  });

  it('resolves for a V5 vampire regnant with the vampire`s own clan', () => {
    const v = makeVampire('v5v', 'V5 Sire', 'toreador', 'V5');
    const g = makeGhoul({ regnantCharacterId: 'v5v' } as any);
    expect(resolveRegnantClan(g, [v, g]).clanId).toBe('toreador');
  });
});
