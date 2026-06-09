/**
 * Batch AV — V5 Generation field.
 *
 * Locks down the new optional `generation` field on V5 characters:
 *   1. The V5 sheet schema exposes `generation` as a basic-info number field.
 *   2. Storage normalization preserves a numeric V5 generation on read.
 *   3. Storage normalization does NOT inject a default for V5 — a saved
 *      character without `generation` continues to load with the field
 *      absent (no silent "13" appearing on every existing V5 sheet).
 *   4. Garbage values (NaN, strings, null) are stripped on read.
 *   5. Export/import round-trips preserve the field.
 *   6. Classic generation behavior is unchanged (still defaults to 13).
 *   7. `createEmptyCharacter('V5', …)` does not set `generation`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCharacters,
  saveCharacter,
  createEmptyCharacter,
  clearCharacterStorage,
  buildCharacterExport,
  importCharacter,
} from '../characterStorage';

// jsdom doesn't provide localStorage in node-mode service tests; stub it just
// like other characterStorage tests in this folder do (see the
// `localStorageMock` setup in `characterStorage.test.ts`).
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

describe('Batch AV — V5 generation field (schema)', () => {
  it('v5Schema lists `generation` as a basic-info number field', async () => {
    const { v5Schema } = await import('@/data/characterSheets/v5');
    const ids = v5Schema.sections.flatMap(s => s.fields.map(f => f.id));
    expect(ids).toContain('generation');

    const basic = v5Schema.sections.find(s => s.id === 'basic_info');
    expect(basic).toBeDefined();
    const gen = basic!.fields.find(f => f.id === 'generation');
    expect(gen).toBeDefined();
    expect(gen!.type).toBe('number');
    expect(gen!.labelKey).toBe('sheet_generation');
  });
});

describe('Batch AV — V5 generation field (storage normalization)', () => {
  beforeEach(() => {
    clearCharacterStorage();
  });

  it('preserves a numeric `generation` on a saved V5 character', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: '1', edition: 'V5', clan: 'brujah', generation: 12 },
    ]));
    const char = getCharacters()[0] as any;
    expect(char.edition).toBe('V5');
    expect(char.generation).toBe(12);
  });

  it('does NOT inject a default `generation` on V5 characters missing the field', () => {
    // Critical: existing installs have V5 characters in storage that were
    // saved before this batch landed. Auto-injecting a 13 default would
    // silently show "13" on every one of those sheets on first reload.
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'legacy', edition: 'V5', clan: 'brujah' },
    ]));
    const char = getCharacters()[0] as any;
    expect(char.edition).toBe('V5');
    expect('generation' in char).toBe(false);
  });

  it('strips a non-numeric `generation` value (NaN / string / null) on V5', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: 'a', edition: 'V5', clan: 'brujah', generation: 'thirteen' },
      { id: 'b', edition: 'V5', clan: 'brujah', generation: null },
      { id: 'c', edition: 'V5', clan: 'brujah', generation: Number.NaN },
    ]));
    const chars = getCharacters() as any[];
    for (const c of chars) {
      expect('generation' in c).toBe(false);
    }
  });

  it('leaves classic generation behavior unchanged (defaults to 13)', () => {
    localStorage.setItem('vtm-characters', JSON.stringify([
      { id: '1', edition: 'V20', clan: 'tremere' }, // missing generation
    ]));
    const char = getCharacters()[0] as any;
    expect(char.generation).toBe(13);
  });

  it('round-trips a V5 generation through save → load', () => {
    const fresh = createEmptyCharacter('V5', 'brujah', 'Ada');
    (fresh as any).generation = 10;
    saveCharacter(fresh);
    const loaded = getCharacters()[0] as any;
    expect(loaded.edition).toBe('V5');
    expect(loaded.generation).toBe(10);
  });
});

describe('Batch AV — V5 generation field (createEmptyCharacter)', () => {
  beforeEach(() => {
    clearCharacterStorage();
  });

  it('does not seed `generation` on a brand-new V5 character', () => {
    const char = createEmptyCharacter('V5', 'brujah', 'New V5');
    expect(char.edition).toBe('V5');
    expect((char as any).generation).toBeUndefined();
  });

  it('still seeds classic generation to 13 (unchanged behavior)', () => {
    const char = createEmptyCharacter('V20', 'tremere', 'New V20');
    expect(char.edition).toBe('V20');
    expect((char as any).generation).toBe(13);
  });
});

describe('Batch AV — V5 generation field (export / import)', () => {
  beforeEach(() => {
    clearCharacterStorage();
  });

  it('preserves V5 generation through export → import round-trip', () => {
    const char = createEmptyCharacter('V5', 'brujah', 'Roundtrip V5');
    (char as any).generation = 11;
    const saved = saveCharacter(char);
    const exp = buildCharacterExport(saved.id);
    clearCharacterStorage();
    const imported = importCharacter(exp) as any;
    expect(imported).toBeTruthy();
    expect(imported.edition).toBe('V5');
    expect(imported.generation).toBe(11);
  });

  it('imports a V5 character that omits generation without injecting a default', () => {
    const char = createEmptyCharacter('V5', 'brujah', 'No-gen V5');
    const saved = saveCharacter(char);
    const exp = buildCharacterExport(saved.id);
    clearCharacterStorage();
    const imported = importCharacter(exp) as any;
    expect(imported).toBeTruthy();
    expect(imported.edition).toBe('V5');
    expect('generation' in imported).toBe(false);
  });
});
