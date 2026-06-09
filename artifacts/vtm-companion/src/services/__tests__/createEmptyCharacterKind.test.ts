/**
 * Batch BA — `createEmptyCharacter` no longer seeds vampire-only defaults
 * on humans / ghouls, and `getCharacters` normalization no longer injects
 * legacy defaults for non-vampires.
 *
 * Locks the cleanup invariants the Batch AZ audit (§5) and the Batch BA
 * brief asked for:
 *   1. New V5 vampire: still gets bloodPotency 1, hunger 1, humanity 7.
 *   2. New V5 human:    none of those keys exist on the result.
 *   3. New V5 ghoul:    none of those keys exist (Blood Pool is deferred).
 *   4. New V20 vampire: still gets generation 13, humanity 7, bloodPool 10/10.
 *   5. New V20 human / ghoul: none of those keys exist.
 *   6. Existing dormant fields on legacy human / ghoul records survive
 *      a round trip (we do NOT strip on read).
 *   7. Legacy / missing-kind characters keep their vampire defaults so
 *      pre-Batch-AX saves load unchanged.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEmptyCharacter,
  getCharacters,
  clearCharacterStorage,
} from '../characterStorage';

const localStorageMock: Storage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
    removeItem: vi.fn((k: string) => { delete store[k]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    get length() { return Object.keys(store).length; },
  } as Storage;
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });

describe('Batch BA — createEmptyCharacter vampire defaults are unchanged', () => {
  it('V5 vampire still gets bloodPotency, hunger, humanity', () => {
    const v = createEmptyCharacter('V5', 'brujah', 'V5 Vampire') as any;
    expect(v.kind).toBe('vampire');
    expect(v.bloodPotency).toBe(1);
    expect(v.hunger).toBe(1);
    expect(v.humanity).toBe(7);
  });

  it('V20 vampire still gets generation, humanity, bloodPool', () => {
    const v = createEmptyCharacter('V20', 'tremere', 'V20 Vampire') as any;
    expect(v.kind).toBe('vampire');
    expect(v.generation).toBe(13);
    expect(v.humanity).toBe(7);
    expect(v.bloodPool).toEqual({ current: 10, max: 10 });
  });
});

describe('Batch BA — V5 human / ghoul drop vampire-only seeds', () => {
  it('V5 human has no bloodPotency / hunger / humanity in storage', () => {
    const h = createEmptyCharacter('V5', '', 'Mortal', 'human') as Record<string, unknown>;
    expect(h.kind).toBe('human');
    expect('bloodPotency' in h).toBe(false);
    expect('hunger' in h).toBe(false);
    expect('humanity' in h).toBe(false);
    // Universal trackers still seeded so the sheet renders Health + Willpower.
    expect(h.health).toEqual({ damage: 0, aggravated: 0, max: 5 });
    expect(h.willpower).toEqual({ damage: 0, aggravated: 0, max: 5 });
  });

  it('V5 ghoul has no bloodPotency / hunger / humanity in storage', () => {
    const g = createEmptyCharacter('V5', 'tremere', 'Famulus', 'ghoul') as Record<string, unknown>;
    expect(g.kind).toBe('ghoul');
    expect('bloodPotency' in g).toBe(false);
    expect('hunger' in g).toBe(false);
    expect('humanity' in g).toBe(false);
    // Regnant clan is preserved through `clan` for ghouls.
    expect(g.clan).toBe('tremere');
  });
});

describe('Batch BA — classic human / ghoul drop vampire-only seeds', () => {
  it('V20 human has no generation / humanity / bloodPool', () => {
    const h = createEmptyCharacter('V20', '', 'Mortal Classic', 'human') as Record<string, unknown>;
    expect(h.kind).toBe('human');
    expect('generation' in h).toBe(false);
    expect('humanity' in h).toBe(false);
    expect('bloodPool' in h).toBe(false);
    // Virtues stay — they're general Storyteller traits, not vampire-only.
    expect(h.virtues).toEqual({ conscience: 1, selfControl: 1, courage: 1 });
  });

  it('V20 ghoul has no generation / humanity / bloodPool seed', () => {
    // Ghoul Blood Pool is deferred (audit §5.5) — a future batch will
    // seed a smaller ghoul-sized pool when the rules-aware tracker
    // ships. For now the field is absent.
    const g = createEmptyCharacter('V20', 'tremere', 'Famulus', 'ghoul') as Record<string, unknown>;
    expect(g.kind).toBe('ghoul');
    expect('generation' in g).toBe(false);
    expect('humanity' in g).toBe(false);
    expect('bloodPool' in g).toBe(false);
    expect(g.clan).toBe('tremere'); // regnant clan preserved
  });
});

describe('Batch BA — getCharacters normalization respects kind', () => {
  beforeEach(() => clearCharacterStorage());

  it('preserves dormant vampire-only fields on a legacy V5 human (round-trip safe)', () => {
    // Simulates a character saved during Batch AX/AY when factories
    // still seeded these fields on humans. Reload must NOT strip them.
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'legacy-h', edition: 'V5', clan: '', name: 'Dormant', kind: 'human',
        bloodPotency: 1, hunger: 1, humanity: 7 },
    ]));
    const reloaded = getCharacters()[0] as any;
    expect(reloaded.kind).toBe('human');
    expect(reloaded.bloodPotency).toBe(1);
    expect(reloaded.hunger).toBe(1);
    expect(reloaded.humanity).toBe(7);
  });

  it('does NOT inject vampire-only defaults on a V5 human missing those keys', () => {
    // A character freshly created by the post-BA factory — no Hunger /
    // BP / Humanity on disk. The reload must NOT silently rehydrate them.
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'new-h', edition: 'V5', clan: '', name: 'New mortal', kind: 'human' },
    ]));
    const reloaded = getCharacters()[0] as Record<string, unknown>;
    expect(reloaded.kind).toBe('human');
    expect('bloodPotency' in reloaded).toBe(false);
    expect('hunger' in reloaded).toBe(false);
    expect('humanity' in reloaded).toBe(false);
  });

  it('does NOT inject vampire-only defaults on a V20 human missing those keys', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'new-cl-h', edition: 'V20', clan: '', name: 'New classic mortal', kind: 'human' },
    ]));
    const reloaded = getCharacters()[0] as Record<string, unknown>;
    expect(reloaded.kind).toBe('human');
    expect('generation' in reloaded).toBe(false);
    expect('humanity' in reloaded).toBe(false);
    expect('bloodPool' in reloaded).toBe(false);
  });

  it('still injects vampire defaults on a legacy character with no kind (backward-compat)', () => {
    // Pre-Batch-AX saves have no `kind` field — they must load as
    // vampires with the legacy defaults exactly as they always did.
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'pre-ax-v5', edition: 'V5', clan: 'brujah', name: 'Pre-AX' },
      { id: 'pre-ax-v20', edition: 'V20', clan: 'tremere', name: 'Pre-AX V20' },
    ]));
    const reloaded = getCharacters();
    const v5 = reloaded.find(c => c.id === 'pre-ax-v5') as any;
    const v20 = reloaded.find(c => c.id === 'pre-ax-v20') as any;
    expect(v5.kind).toBe('vampire');
    expect(v5.bloodPotency).toBe(1);
    expect(v5.hunger).toBe(1);
    expect(v5.humanity).toBe(7);
    expect(v20.kind).toBe('vampire');
    expect(v20.generation).toBe(13);
    expect(v20.humanity).toBe(7);
    expect(v20.bloodPool).toEqual({ current: 10, max: 10 });
  });
});
