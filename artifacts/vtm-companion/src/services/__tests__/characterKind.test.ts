/**
 * Batch AX Phase 1 — character `kind` discriminator
 * ('vampire' | 'human' | 'ghoul').
 *
 * Locks the data-layer invariants the audit (Batch AW §10) set as
 * Phase 1 acceptance gates:
 *   1. Every legacy / missing / invalid `kind` on read defaults to 'vampire'.
 *   2. Valid kinds ('human', 'ghoul') round-trip through save → load.
 *   3. `createEmptyCharacter` defaults to 'vampire' (every existing
 *      test passes the 3-arg form unchanged).
 *   4. Single-character export / import preserves `kind`.
 *   5. Full library backup preserves `kind` across mixed entries.
 *   6. `validateCharacterExport` / `validateCharacterBackup` require a
 *      clan string ONLY when kind is 'vampire' (or absent / unknown);
 *      humans and ghouls may omit clan.
 *   7. A character with `kind: 'human'` is not silently coerced to a
 *      'brujah' clan.
 *
 * Phase 1 deliberately does NOT change sheet rendering — those tests
 * live with the existing schema audits.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCharacters,
  saveCharacter,
  createEmptyCharacter,
  clearCharacterStorage,
  normalizeCharacterKind,
  buildCharacterExport,
  validateCharacterExport,
  importCharacter,
  buildCharacterBackup,
  validateCharacterBackup,
  importCharacterBackup,
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

describe('Batch AX — normalizeCharacterKind', () => {
  it('passes "human" and "ghoul" through unchanged', () => {
    expect(normalizeCharacterKind('human')).toBe('human');
    expect(normalizeCharacterKind('ghoul')).toBe('ghoul');
  });

  it('defaults missing / unknown / garbage values to "vampire"', () => {
    expect(normalizeCharacterKind(undefined)).toBe('vampire');
    expect(normalizeCharacterKind(null)).toBe('vampire');
    expect(normalizeCharacterKind('')).toBe('vampire');
    expect(normalizeCharacterKind('Vampire')).toBe('vampire');   // case mismatch
    expect(normalizeCharacterKind('werewolf')).toBe('vampire');  // future kind we don't support
    expect(normalizeCharacterKind(42 as unknown)).toBe('vampire');
  });
});

describe('Batch AX — getCharacters normalization', () => {
  beforeEach(() => clearCharacterStorage());

  it('normalizes a legacy V5 character (no kind on disk) to kind=vampire', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: '1', edition: 'V5', clan: 'brujah', name: 'Legacy' },
    ]));
    const char = getCharacters()[0] as any;
    expect(char.kind).toBe('vampire');
  });

  it('preserves a saved human kind across reload', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'h', edition: 'V5', clan: '', name: 'Mortal', kind: 'human' },
    ]));
    const char = getCharacters()[0] as any;
    expect(char.kind).toBe('human');
  });

  it('preserves a saved ghoul kind across reload', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'g', edition: 'V20', clan: 'tremere', name: 'Famulus', kind: 'ghoul' },
    ]));
    const char = getCharacters()[0] as any;
    expect(char.kind).toBe('ghoul');
  });

  it('coerces an unknown / garbage kind value to vampire on read', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'x', edition: 'V20', clan: 'tremere', name: 'Bogus', kind: 'werewolf' },
    ]));
    const char = getCharacters()[0] as any;
    expect(char.kind).toBe('vampire');
  });
});

describe('Batch AX — createEmptyCharacter', () => {
  beforeEach(() => clearCharacterStorage());

  it('defaults to kind=vampire when not specified (backward-compat)', () => {
    const char = createEmptyCharacter('V5', 'brujah', 'Default') as any;
    expect(char.kind).toBe('vampire');
    expect(char.clan).toBe('brujah');
  });

  it('creates a human with no clan and kind=human', () => {
    const char = createEmptyCharacter('V5', '', 'Mortal', 'human') as any;
    expect(char.kind).toBe('human');
    expect(char.clan).toBe('');
  });

  it('creates a ghoul with an optional regnant clan and kind=ghoul', () => {
    const ghoulWithRegnant = createEmptyCharacter('V20', 'tremere', 'Famulus', 'ghoul') as any;
    expect(ghoulWithRegnant.kind).toBe('ghoul');
    expect(ghoulWithRegnant.clan).toBe('tremere');

    const ghoulNoRegnant = createEmptyCharacter('V20', '', 'Anonymous', 'ghoul') as any;
    expect(ghoulNoRegnant.kind).toBe('ghoul');
    expect(ghoulNoRegnant.clan).toBe('');
  });

  it('round-trips a non-vampire kind through save → load', () => {
    const human = createEmptyCharacter('V5', '', 'Mortal', 'human');
    saveCharacter(human);
    const loaded = getCharacters()[0] as any;
    expect(loaded.kind).toBe('human');
    expect(loaded.clan).toBe('');
  });

  it('does NOT coerce a human character to a brujah default on read', () => {
    // Regression guard for the audit's biggest soft-blocker: the
    // legacy fallback `clan: typeof c?.clan === 'string' ? c.clan : 'brujah'`
    // must NOT fire when the saved value is an empty string. Strings
    // pass the typeof check.
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'h', edition: 'V5', clan: '', name: 'Mortal', kind: 'human' },
    ]));
    const char = getCharacters()[0] as any;
    expect(char.clan).toBe('');           // not 'brujah'
    expect(char.kind).toBe('human');
  });
});

describe('Batch AX — single-character export / import', () => {
  beforeEach(() => clearCharacterStorage());

  it('preserves kind through export → import', () => {
    const human = saveCharacter(createEmptyCharacter('V5', '', 'Mortal', 'human'));
    const env = buildCharacterExport(human.id);
    expect(env).not.toBeNull();
    clearCharacterStorage();
    const result = importCharacter(env);
    expect(typeof result).not.toBe('string');
    const imported = result as any;
    expect(imported.kind).toBe('human');
    expect(imported.clan).toBe('');
  });

  it('export validates with NO clan when kind is human', () => {
    const error = validateCharacterExport({
      _vtmExport: true,
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      character: { name: 'Mortal', edition: 'V5', kind: 'human' }, // no clan
    });
    expect(error).toBeNull();
  });

  it('export validates with empty-string clan when kind is ghoul', () => {
    const error = validateCharacterExport({
      _vtmExport: true,
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      character: { name: 'Famulus', edition: 'V20', kind: 'ghoul', clan: '' },
    });
    expect(error).toBeNull();
  });

  it('export STILL rejects a missing clan when kind is vampire (legacy rule)', () => {
    const error = validateCharacterExport({
      _vtmExport: true,
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      character: { name: 'V', edition: 'V5', kind: 'vampire' }, // no clan
    });
    expect(error).toMatch(/clan/i);
  });

  it('export STILL rejects a missing clan when kind is absent (legacy character)', () => {
    const error = validateCharacterExport({
      _vtmExport: true,
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      character: { name: 'V', edition: 'V5' }, // no kind, no clan
    });
    expect(error).toMatch(/clan/i);
  });
});

describe('Batch AX — full library backup', () => {
  beforeEach(() => clearCharacterStorage());

  it('preserves a mix of vampire / human / ghoul kinds through backup round-trip', () => {
    saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice')); // default vampire
    saveCharacter(createEmptyCharacter('V5', '', 'Bob', 'human'));
    saveCharacter(createEmptyCharacter('V20', 'tremere', 'Carol', 'ghoul'));

    const backup = buildCharacterBackup();
    expect(validateCharacterBackup(backup)).toBeNull();
    expect(backup.characters.map(c => c.kind).sort()).toEqual(['ghoul', 'human', 'vampire']);

    clearCharacterStorage();
    const result = importCharacterBackup(backup);
    expect(typeof result).not.toBe('string');
    const reloaded = getCharacters();
    const byKind = new Map(reloaded.map(c => [(c as any).name, (c as any).kind]));
    expect(byKind.get('Alice')).toBe('vampire');
    expect(byKind.get('Bob')).toBe('human');
    expect(byKind.get('Carol')).toBe('ghoul');
  });

  it('backup validates with mixed-kind entries where humans/ghouls omit clan', () => {
    const error = validateCharacterBackup({
      _vtmBackup: true,
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      characters: [
        { name: 'V', edition: 'V5', clan: 'brujah', kind: 'vampire' },
        { name: 'H', edition: 'V5', kind: 'human' },          // no clan
        { name: 'G', edition: 'V20', kind: 'ghoul', clan: '' },
      ],
    });
    expect(error).toBeNull();
  });

  it('backup still rejects a legacy entry (no kind) missing clan', () => {
    const error = validateCharacterBackup({
      _vtmBackup: true,
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      characters: [
        { name: 'Legacy', edition: 'V5' }, // no kind, no clan
      ],
    });
    expect(error).toMatch(/clan/i);
  });
});
