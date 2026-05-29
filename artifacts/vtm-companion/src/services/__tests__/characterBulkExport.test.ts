/**
 * @vitest-environment jsdom
 *
 * Batch AF — bulk character JSON export (selected subset, one file).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildCharacterBulkExport,
  CHARACTER_BULK_EXPORT_VERSION,
  isCharacterBulkExport,
  validateCharacterBulkExport,
  importCharacterBulkExport,
} from '../characterBulkExport';
import { createEmptyCharacter, saveCharacter, getCharacters } from '../characterStorage';

beforeEach(() => window.localStorage.clear());

function seedThree() {
  const a = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Aria'));
  const b = saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bea'));
  const c = saveCharacter(createEmptyCharacter('V20', 'ventrue', 'Cyrus'));
  return { a, b, c };
}

describe('buildCharacterBulkExport', () => {
  it('returns null when no ids are supplied', () => {
    expect(buildCharacterBulkExport([])).toBeNull();
  });

  it('returns null when none of the supplied ids resolve to a stored character', () => {
    seedThree();
    expect(buildCharacterBulkExport(['nope-1', 'nope-2'])).toBeNull();
  });

  it('produces a versioned envelope with only the selected characters', () => {
    const { a, c } = seedThree();
    const exp = buildCharacterBulkExport([a.id, c.id])!;

    expect(exp).not.toBeNull();
    expect(exp._vtmCharacterBulkExport).toBe(true);
    expect(exp.exportVersion).toBe(CHARACTER_BULK_EXPORT_VERSION);
    expect(typeof exp.exportedAt).toBe('string');
    expect(exp.count).toBe(2);
    expect(exp.characters).toHaveLength(2);

    const names = exp.characters.map(ch => ch.name).sort();
    expect(names).toEqual(['Aria', 'Cyrus']);
  });

  it('excludes unselected characters (cross-selection isolation)', () => {
    const { a, b } = seedThree();
    const exp = buildCharacterBulkExport([a.id])!;
    expect(exp.characters).toHaveLength(1);
    expect(exp.characters[0].name).toBe('Aria');
    expect(exp.characters.find(ch => ch.id === b.id)).toBeUndefined();
  });

  it('ignores unknown ids mixed in with valid ones', () => {
    const { b } = seedThree();
    const exp = buildCharacterBulkExport([b.id, 'unknown-x', 'unknown-y'])!;
    expect(exp.count).toBe(1);
    expect(exp.characters[0].name).toBe('Bea');
  });

  it('does not include chronicles or unrelated app-backup data', () => {
    const { a } = seedThree();
    const exp = buildCharacterBulkExport([a.id])!;
    // Envelope keys are character-only.
    expect(Object.keys(exp).sort()).toEqual(
      ['_vtmCharacterBulkExport', 'characters', 'count', 'exportVersion', 'exportedAt'].sort()
    );
    expect((exp as any).chronicles).toBeUndefined();
    expect((exp as any).chronicleSessions).toBeUndefined();
    expect((exp as any).chronicleLocations).toBeUndefined();
    expect((exp as any).chronicleRelationships).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Batch AG — bulk import.
// ---------------------------------------------------------------------------

/** Helper: build a valid bulk-export envelope from a list of partial chars. */
function makeBulkEnvelope(
  chars: { id?: string; name: string; clan?: string; edition?: string; [k: string]: any }[]
) {
  const characters = chars.map(c => ({
    id: c.id ?? crypto.randomUUID(),
    name: c.name,
    clan: c.clan ?? 'brujah',
    edition: c.edition ?? 'V20',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...c,
  }));
  return {
    _vtmCharacterBulkExport: true,
    exportVersion: CHARACTER_BULK_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    count: characters.length,
    characters,
  };
}

describe('isCharacterBulkExport', () => {
  it('recognizes only the bulk envelope discriminator', () => {
    expect(isCharacterBulkExport({ _vtmCharacterBulkExport: true })).toBe(true);
    expect(isCharacterBulkExport({ _vtmExport: true })).toBe(false);
    expect(isCharacterBulkExport({ _vtmBackup: true })).toBe(false);
    expect(isCharacterBulkExport({ _vtmAppBackup: true })).toBe(false);
    expect(isCharacterBulkExport(null)).toBe(false);
    expect(isCharacterBulkExport('string')).toBe(false);
  });
});

describe('validateCharacterBulkExport', () => {
  it('accepts a well-formed envelope', () => {
    expect(validateCharacterBulkExport(makeBulkEnvelope([{ name: 'A' }]))).toBeNull();
  });

  it('rejects a wrong/missing discriminator', () => {
    const env = makeBulkEnvelope([{ name: 'A' }]) as any;
    env._vtmCharacterBulkExport = false;
    expect(validateCharacterBulkExport(env))
      .toBe('Invalid file: not a VTM bulk character export.');
  });

  it('rejects an unsupported export version', () => {
    const env = makeBulkEnvelope([{ name: 'A' }]) as any;
    env.exportVersion = 99;
    expect(validateCharacterBulkExport(env))
      .toBe('Invalid file: unsupported export version (99).');
  });

  it('rejects a missing characters array', () => {
    const env: any = { _vtmCharacterBulkExport: true, exportVersion: 1 };
    expect(validateCharacterBulkExport(env))
      .toBe('Invalid file: missing characters list.');
  });

  it('rejects an empty characters array', () => {
    expect(validateCharacterBulkExport(makeBulkEnvelope([])))
      .toBe('Invalid file: no characters to import.');
  });

  it('rejects when count does not match characters length', () => {
    const env: any = makeBulkEnvelope([{ name: 'A' }, { name: 'B' }]);
    env.count = 5;
    expect(validateCharacterBulkExport(env))
      .toBe('Invalid file: count (5) does not match characters length (2).');
  });

  it('rejects a character missing required fields', () => {
    const env = makeBulkEnvelope([{ name: 'A' }]) as any;
    delete env.characters[0].clan;
    expect(validateCharacterBulkExport(env))
      .toBe('Invalid character at index 0: missing clan.');
  });
});

describe('importCharacterBulkExport', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns the validation error for an invalid file', () => {
    expect(importCharacterBulkExport({ _vtmExport: true }))
      .toBe('Invalid file: not a VTM bulk character export.');
  });

  it('imports all characters from a valid file', () => {
    const env = makeBulkEnvelope([{ name: 'Aria' }, { name: 'Bea' }]);
    const result = importCharacterBulkExport(env);

    expect(typeof result).not.toBe('string');
    expect((result as any).imported).toBe(2);
    expect((result as any).renamed).toBe(0);

    const stored = getCharacters();
    expect(stored).toHaveLength(2);
    expect(stored.map(c => c.name).sort()).toEqual(['Aria', 'Bea']);
  });

  it('remaps duplicate IDs and does NOT overwrite existing characters', () => {
    // Seed an existing character.
    const existing = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Existing'));

    // Bulk file contains a character with the SAME id but different name.
    const env = makeBulkEnvelope([{ id: existing.id, name: 'Imported' }]);
    const result = importCharacterBulkExport(env);
    expect(typeof result).not.toBe('string');

    const stored = getCharacters();
    expect(stored).toHaveLength(2);

    // The existing record is untouched (id and name preserved).
    const stillExisting = stored.find(c => c.id === existing.id)!;
    expect(stillExisting).toBeDefined();
    expect(stillExisting.name).toBe('Existing');

    // The imported character was assigned a new UUID (distinct from existing).
    const imported = stored.find(c => c.name === 'Imported')!;
    expect(imported).toBeDefined();
    expect(imported.id).not.toBe(existing.id);
  });

  it('keeps imported characters distinct from existing (different ids, name-collision suffix)', () => {
    saveCharacter(createEmptyCharacter('V20', 'brujah', 'Twin'));
    const env = makeBulkEnvelope([{ name: 'Twin' }, { name: 'Twin' }]);
    const result = importCharacterBulkExport(env);

    expect(typeof result).not.toBe('string');
    expect((result as any).imported).toBe(2);
    expect((result as any).renamed).toBe(2);

    const stored = getCharacters();
    expect(stored).toHaveLength(3);
    const ids = new Set(stored.map(c => c.id));
    expect(ids.size).toBe(3); // all distinct
    const names = stored.map(c => c.name).sort();
    expect(names).toEqual(['Twin', 'Twin Imported', 'Twin Imported 2']);
  });
});
