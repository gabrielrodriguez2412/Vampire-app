import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCharacters, saveCharacter, clearCharacterStorage, createEmptyCharacter, deleteCharacter, renameCharacter, duplicateCharacter, buildCharacterExport, validateCharacterExport, importCharacter, EXPORT_VERSION, buildCharacterBackup, validateCharacterBackup, importCharacterBackup, BACKUP_VERSION, setCharacterType, setCharacterChronicle, setCharacterArchived, normalizeInventory, normalizeCharacterNotes, normalizeClassicHealth, normalizeCharacterStatus } from '../characterStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock
});

describe('characterStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getCharacters', () => {
    it('returns empty array when storage is empty', () => {
      expect(getCharacters()).toEqual([]);
    });

    it('filters out corrupted data (null, primitives)', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        null,
        "string-data",
        123,
        { id: '1', name: 'Valid', clan: 'brujah', edition: 'V5' }
      ]));

      const chars = getCharacters();
      expect(chars).toHaveLength(1);
      expect(chars[0].name).toBe('Valid');
    });

    it('provides V5 fallback fields', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', edition: 'V5' } // missing fields
      ]));

      const chars = getCharacters();
      const char = chars[0] as any;
      expect(char.health).toEqual({ damage: 0, aggravated: 0, max: 5 });
      expect(char.attributes).toEqual({});
      expect(char.bloodPotency).toBe(1);
    });

    it('provides Classic fallback fields', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', edition: 'V20' } // missing fields
      ]));

      const chars = getCharacters();
      const char = chars[0] as any;
      expect(char.bloodPool).toEqual({ current: 10, max: 10 });
      expect(char.generation).toBe(13);
      expect(char.health).toEqual({ bashing: 0, lethal: 0, aggravated: 0, max: 7 });
    });

    it('defaults a missing/unknown archive status to active on load', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', edition: 'V5' },                  // missing status
        { id: '2', edition: 'V20', status: 'bogus' }, // unknown status
        { id: '3', edition: 'V5', status: 'archived' },
      ]));
      const chars = getCharacters() as any[];
      expect(chars[0].status).toBe('active');
      expect(chars[1].status).toBe('active');
      expect(chars[2].status).toBe('archived');
    });

    it('migrates a legacy numeric classic health into the box track (as bashing)', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', edition: 'V20', health: 3 }
      ]));

      const char = getCharacters()[0] as any;
      // Legacy untyped damage maps to bashing (least severe) — never escalated.
      expect(char.health).toEqual({ bashing: 3, lethal: 0, aggravated: 0, max: 7 });
    });

    it('preserves a structured classic health track on load', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', edition: 'V20', health: { bashing: 1, lethal: 2, aggravated: 1, max: 7 } }
      ]));

      const char = getCharacters()[0] as any;
      expect(char.health).toEqual({ bashing: 1, lethal: 2, aggravated: 1, max: 7 });
    });
  });

  describe('normalizeClassicHealth', () => {
    it('maps a legacy numeric count to bashing, defaulting the track to 7', () => {
      expect(normalizeClassicHealth(2)).toEqual({ bashing: 2, lethal: 0, aggravated: 0, max: 7 });
    });

    it('clamps a legacy number above the track length', () => {
      expect(normalizeClassicHealth(99)).toEqual({ bashing: 7, lethal: 0, aggravated: 0, max: 7 });
    });

    it('floors fractional and zeroes negative legacy numbers', () => {
      expect(normalizeClassicHealth(2.9)).toEqual({ bashing: 2, lethal: 0, aggravated: 0, max: 7 });
      expect(normalizeClassicHealth(-4)).toEqual({ bashing: 0, lethal: 0, aggravated: 0, max: 7 });
    });

    it('reads a well-formed structured track unchanged', () => {
      expect(normalizeClassicHealth({ bashing: 1, lethal: 2, aggravated: 1, max: 7 }))
        .toEqual({ bashing: 1, lethal: 2, aggravated: 1, max: 7 });
    });

    it('trims total overflow least-severe-first', () => {
      // 5 + 3 + 1 = 9 on a 7-track → drop 2 bashing first.
      expect(normalizeClassicHealth({ bashing: 5, lethal: 3, aggravated: 1, max: 7 }))
        .toEqual({ bashing: 3, lethal: 3, aggravated: 1, max: 7 });
    });

    it('falls back to an empty 7-box track for garbage input', () => {
      expect(normalizeClassicHealth(null)).toEqual({ bashing: 0, lethal: 0, aggravated: 0, max: 7 });
      expect(normalizeClassicHealth('nope')).toEqual({ bashing: 0, lethal: 0, aggravated: 0, max: 7 });
      expect(normalizeClassicHealth(undefined)).toEqual({ bashing: 0, lethal: 0, aggravated: 0, max: 7 });
    });
  });

  describe('createEmptyCharacter', () => {
    it('creates a V5 character correctly', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Test V5');
      expect(char.edition).toBe('V5');
      expect(char.name).toBe('Test V5');
      expect((char as any).bloodPotency).toBe(1);
      expect((char as any).health).toEqual({ damage: 0, aggravated: 0, max: 5 });
    });

    it('creates a Classic character correctly', () => {
      const char = createEmptyCharacter('V20', 'tremere', 'Test V20');
      expect(char.edition).toBe('V20');
      expect(char.name).toBe('Test V20');
      expect((char as any).generation).toBe(13);
      expect((char as any).bloodPool).toEqual({ current: 10, max: 10 });
    });

    it('creates characters as active', () => {
      expect(createEmptyCharacter('V5', 'brujah', 'A').status).toBe('active');
      expect(createEmptyCharacter('V20', 'tremere', 'B').status).toBe('active');
    });
  });

  describe('normalizeCharacterStatus', () => {
    it('keeps "archived" and coerces everything else to "active"', () => {
      expect(normalizeCharacterStatus('archived')).toBe('archived');
      expect(normalizeCharacterStatus('active')).toBe('active');
      expect(normalizeCharacterStatus('bogus')).toBe('active');
      expect(normalizeCharacterStatus(undefined)).toBe('active');
      expect(normalizeCharacterStatus(null)).toBe('active');
    });
  });

  describe('setCharacterArchived', () => {
    it('archives an active character and persists it', () => {
      const char = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Archie'));
      const updated = setCharacterArchived(char.id, 'archived');
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('archived');
      // Persisted, not deleted.
      const loaded = getCharacters();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].status).toBe('archived');
    });

    it('unarchives an archived character (restore)', () => {
      const char = saveCharacter(createEmptyCharacter('V20', 'tremere', 'Resto'));
      setCharacterArchived(char.id, 'archived');
      const restored = setCharacterArchived(char.id, 'active');
      expect(restored!.status).toBe('active');
      expect(getCharacters()[0].status).toBe('active');
    });

    it('coerces an unknown status to active', () => {
      const char = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Coerce'));
      const updated = setCharacterArchived(char.id, 'nonsense' as any);
      expect(updated!.status).toBe('active');
    });

    it('returns null for a non-existent character', () => {
      expect(setCharacterArchived('does-not-exist', 'archived')).toBeNull();
    });

    it('preserves other fields (name, chronicle link, type) when archiving', () => {
      const char = saveCharacter(createEmptyCharacter('V20', 'ventrue', 'Keeper'));
      setCharacterChronicle(char.id, 'chron-1');
      setCharacterType(char.id, 'npc');
      const updated = setCharacterArchived(char.id, 'archived');
      expect(updated!.name).toBe('Keeper');
      expect(updated!.chronicleId).toBe('chron-1');
      expect(updated!.characterType).toBe('npc');
      expect(updated!.status).toBe('archived');
    });
  });

  describe('renameCharacter', () => {
    it('renames a character and persists to storage', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Original');
      saveCharacter(char);

      const updated = renameCharacter(char.id, 'New Name');
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('New Name');

      // Verify persistence
      const loaded = getCharacters();
      expect(loaded[0].name).toBe('New Name');
    });

    it('trims whitespace from names', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Original');
      saveCharacter(char);

      const updated = renameCharacter(char.id, '  Trimmed Name  ');
      expect(updated!.name).toBe('Trimmed Name');
    });

    it('rejects blank names (returns null)', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Original');
      saveCharacter(char);

      expect(renameCharacter(char.id, '')).toBeNull();
      expect(renameCharacter(char.id, '   ')).toBeNull();

      // Name should be unchanged
      const loaded = getCharacters();
      expect(loaded[0].name).toBe('Original');
    });

    it('returns null for non-existent character', () => {
      expect(renameCharacter('nonexistent-id', 'New Name')).toBeNull();
    });

    it('does not affect other characters', () => {
      const char1 = createEmptyCharacter('V5', 'brujah', 'First');
      const char2 = createEmptyCharacter('V5', 'tremere', 'Second');
      saveCharacter(char1);
      saveCharacter(char2);

      renameCharacter(char1.id, 'Renamed');

      const loaded = getCharacters();
      expect(loaded.find(c => c.id === char1.id)!.name).toBe('Renamed');
      expect(loaded.find(c => c.id === char2.id)!.name).toBe('Second');
    });
  });

  describe('duplicateCharacter', () => {
    it('creates a copy with a new ID and "Copy" suffix', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Original');
      saveCharacter(char);

      const cloned = duplicateCharacter(char.id);
      expect(cloned).not.toBeNull();
      expect(cloned!.id).not.toBe(char.id);
      expect(cloned!.name).toBe('Original Copy');
      expect(cloned!.clan).toBe('brujah');
      expect(cloned!.edition).toBe('V5');
    });

    it('preserves all character data', () => {
      const char = createEmptyCharacter('V20', 'tremere', 'Wizard') as any;
      char.generation = 8;
      char.humanity = 6;
      char.disciplines = { thaumaturgy: 3 };
      char.backgrounds = { resources: 2 };
      saveCharacter(char);

      const cloned = duplicateCharacter(char.id) as any;
      expect(cloned.generation).toBe(8);
      expect(cloned.humanity).toBe(6);
      expect(cloned.disciplines).toEqual({ thaumaturgy: 3 });
      expect(cloned.backgrounds).toEqual({ resources: 2 });
    });

    it('creates independent copy (no shared references)', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Original') as any;
      char.disciplines = { potence: 2 };
      saveCharacter(char);

      const cloned = duplicateCharacter(char.id) as any;
      cloned.disciplines.potence = 5;

      // Original should not be affected
      const loaded = getCharacters();
      const original = loaded.find(c => c.id === char.id) as any;
      expect(original.disciplines.potence).toBe(2);
    });

    it('results in two characters in storage', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Test');
      saveCharacter(char);

      duplicateCharacter(char.id);

      const loaded = getCharacters();
      expect(loaded).toHaveLength(2);
    });

    it('returns null for non-existent character', () => {
      expect(duplicateCharacter('nonexistent-id')).toBeNull();
    });
  });

  describe('deleteCharacter', () => {
    it('removes only the specified character', () => {
      const char1 = createEmptyCharacter('V5', 'brujah', 'First');
      const char2 = createEmptyCharacter('V5', 'tremere', 'Second');
      saveCharacter(char1);
      saveCharacter(char2);

      deleteCharacter(char1.id);

      const loaded = getCharacters();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(char2.id);
      expect(loaded[0].name).toBe('Second');
    });

    it('does nothing for non-existent id', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Test');
      saveCharacter(char);

      deleteCharacter('nonexistent-id');

      const loaded = getCharacters();
      expect(loaded).toHaveLength(1);
    });
  });

  describe('buildCharacterExport', () => {
    it('creates a valid export envelope', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'ExportMe');
      saveCharacter(char);

      const exp = buildCharacterExport(char.id);
      expect(exp).not.toBeNull();
      expect(exp!._vtmExport).toBe(true);
      expect(exp!.exportVersion).toBe(EXPORT_VERSION);
      expect(typeof exp!.exportedAt).toBe('string');
      expect(exp!.character.name).toBe('ExportMe');
      expect(exp!.character.clan).toBe('brujah');
      expect(exp!.character.edition).toBe('V5');
    });

    it('returns null for non-existent character', () => {
      expect(buildCharacterExport('nonexistent')).toBeNull();
    });
  });

  describe('validateCharacterExport', () => {
    it('accepts a valid export', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Test');
      saveCharacter(char);
      const exp = buildCharacterExport(char.id);
      expect(validateCharacterExport(exp)).toBeNull();
    });

    it('rejects null', () => {
      expect(validateCharacterExport(null)).toBeTruthy();
    });

    it('rejects non-object', () => {
      expect(validateCharacterExport('hello')).toBeTruthy();
    });

    it('rejects missing _vtmExport flag', () => {
      expect(validateCharacterExport({ character: { name: 'x', edition: 'V5', clan: 'brujah' }, exportVersion: 1 })).toBeTruthy();
    });

    it('rejects missing character data', () => {
      expect(validateCharacterExport({ _vtmExport: true, exportVersion: 1 })).toBeTruthy();
    });

    it('rejects character without name', () => {
      expect(validateCharacterExport({ _vtmExport: true, exportVersion: 1, character: { edition: 'V5', clan: 'brujah' } })).toBeTruthy();
    });

    it('rejects character without edition', () => {
      expect(validateCharacterExport({ _vtmExport: true, exportVersion: 1, character: { name: 'Test', clan: 'brujah' } })).toBeTruthy();
    });

    it('rejects character without clan', () => {
      expect(validateCharacterExport({ _vtmExport: true, exportVersion: 1, character: { name: 'Test', edition: 'V5' } })).toBeTruthy();
    });
  });

  describe('importCharacter', () => {
    it('imports a valid export as a new character', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Imported V5');
      saveCharacter(char);
      const exp = buildCharacterExport(char.id);

      // Clear storage to simulate import on another device
      localStorageMock.clear();

      const result = importCharacter(exp);
      expect(typeof result).not.toBe('string'); // not an error
      const imported = result as any;
      expect(imported.name).toBe('Imported V5');
      expect(imported.clan).toBe('brujah');
      expect(imported.edition).toBe('V5');
      // New ID should be different from original
      expect(imported.id).not.toBe(char.id);

      // Should be in storage
      const loaded = getCharacters();
      expect(loaded).toHaveLength(1);
    });

    it('appends Imported suffix on name conflict', () => {
      const char = createEmptyCharacter('V5', 'brujah', 'Conflict');
      saveCharacter(char);
      const exp = buildCharacterExport(char.id);

      // Import without clearing — same name exists
      const result = importCharacter(exp);
      expect(typeof result).not.toBe('string');
      const imported = result as any;
      expect(imported.name).toBe('Conflict Imported');

      // Both characters should exist
      const loaded = getCharacters();
      expect(loaded).toHaveLength(2);
    });

    it('does not overwrite existing characters', () => {
      const char1 = createEmptyCharacter('V5', 'brujah', 'Existing');
      saveCharacter(char1);

      const exp = {
        _vtmExport: true,
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        character: { name: 'NewChar', clan: 'tremere', edition: 'V20' }
      };

      importCharacter(exp);

      const loaded = getCharacters();
      expect(loaded).toHaveLength(2);
      expect(loaded.find(c => c.id === char1.id)!.name).toBe('Existing');
    });

    it('returns error string for invalid data', () => {
      const result = importCharacter({ bad: 'data' });
      expect(typeof result).toBe('string');
    });

    it('preserves all character fields through export/import round-trip', () => {
      const char = createEmptyCharacter('V20', 'tremere', 'RoundTrip') as any;
      char.generation = 8;
      char.disciplines = { thaumaturgy: 3 };
      char.backgrounds = { resources: 2 };
      char.notes = 'Test notes';
      saveCharacter(char);

      const exp = buildCharacterExport(char.id);
      localStorageMock.clear();

      const result = importCharacter(exp) as any;
      expect(typeof result).not.toBe('string');
      expect(result.generation).toBe(8);
      expect(result.disciplines).toEqual({ thaumaturgy: 3 });
      expect(result.backgrounds).toEqual({ resources: 2 });
      expect(result.notes).toBe('Test notes');
    });
  });

  // --- Full library backup ---

  describe('buildCharacterBackup', () => {
    it('returns an envelope with the backup marker, version, timestamp, and characters array', () => {
      saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      saveCharacter(createEmptyCharacter('V20', 'tremere', 'Bob'));

      const backup = buildCharacterBackup();
      expect(backup._vtmBackup).toBe(true);
      expect(backup.backupVersion).toBe(BACKUP_VERSION);
      expect(typeof backup.exportedAt).toBe('string');
      expect(Array.isArray(backup.characters)).toBe(true);
      expect(backup.characters).toHaveLength(2);
      expect(backup.characters.map((c: any) => c.name).sort()).toEqual(['Alice', 'Bob']);
    });

    it('returns an empty characters array when storage is empty', () => {
      const backup = buildCharacterBackup();
      expect(backup._vtmBackup).toBe(true);
      expect(backup.characters).toEqual([]);
    });

    it('does not mutate storage', () => {
      saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      const before = getCharacters().length;
      buildCharacterBackup();
      expect(getCharacters().length).toBe(before);
    });
  });

  describe('validateCharacterBackup', () => {
    it('returns null for a valid backup', () => {
      expect(validateCharacterBackup({
        _vtmBackup: true,
        backupVersion: 1,
        exportedAt: 'now',
        characters: [{ name: 'Alice', edition: 'V5', clan: 'brujah' }],
      })).toBeNull();
    });

    it('returns null when the characters array is empty', () => {
      expect(validateCharacterBackup({
        _vtmBackup: true,
        backupVersion: 1,
        exportedAt: 'now',
        characters: [],
      })).toBeNull();
    });

    it('rejects null and non-objects', () => {
      expect(validateCharacterBackup(null)).toMatch(/JSON object/);
      expect(validateCharacterBackup('string')).toMatch(/JSON object/);
      expect(validateCharacterBackup(42)).toMatch(/JSON object/);
    });

    it('rejects files without the backup marker', () => {
      expect(validateCharacterBackup({ backupVersion: 1, characters: [] })).toMatch(/not a VTM character backup/);
    });

    it('does not accept a single-character export as a backup', () => {
      // A valid single-character export has _vtmExport, not _vtmBackup
      expect(validateCharacterBackup({
        _vtmExport: true,
        exportVersion: 1,
        exportedAt: 'now',
        character: { name: 'Alice', edition: 'V5', clan: 'brujah' },
      })).toMatch(/not a VTM character backup/);
    });

    it('rejects when backupVersion is missing or not a number', () => {
      expect(validateCharacterBackup({ _vtmBackup: true, characters: [] }))
        .toMatch(/missing backup version/);
      expect(validateCharacterBackup({ _vtmBackup: true, backupVersion: 'one', characters: [] }))
        .toMatch(/missing backup version/);
    });

    it('rejects when the characters list is missing or not an array', () => {
      expect(validateCharacterBackup({ _vtmBackup: true, backupVersion: 1 }))
        .toMatch(/missing characters list/);
      expect(validateCharacterBackup({ _vtmBackup: true, backupVersion: 1, characters: 'oops' }))
        .toMatch(/missing characters list/);
    });

    it('rejects when a character is missing required fields', () => {
      expect(validateCharacterBackup({
        _vtmBackup: true,
        backupVersion: 1,
        characters: [{ edition: 'V5', clan: 'brujah' }], // no name
      })).toMatch(/index 0: missing name/);

      expect(validateCharacterBackup({
        _vtmBackup: true,
        backupVersion: 1,
        characters: [
          { name: 'Alice', edition: 'V5', clan: 'brujah' },
          { name: 'Bob', edition: 'V5' }, // no clan
        ],
      })).toMatch(/index 1: missing clan/);
    });
  });

  describe('importCharacterBackup', () => {
    it('returns an error string for invalid input (no throws)', () => {
      expect(typeof importCharacterBackup(null)).toBe('string');
      expect(typeof importCharacterBackup({ foo: 'bar' })).toBe('string');
      expect(typeof importCharacterBackup({ _vtmBackup: true })).toBe('string');
    });

    it('imports every character with a new UUID', () => {
      const backup = {
        _vtmBackup: true,
        backupVersion: 1,
        exportedAt: 'now',
        characters: [
          { id: 'old-1', name: 'Alice', edition: 'V5', clan: 'brujah' },
          { id: 'old-2', name: 'Bob', edition: 'V20', clan: 'tremere', generation: 8 },
        ],
      };

      const result = importCharacterBackup(backup);
      expect(typeof result).not.toBe('string');
      expect((result as any).imported).toBe(2);
      expect((result as any).renamed).toBe(0);

      const chars = getCharacters();
      expect(chars).toHaveLength(2);
      // Old IDs must not survive
      expect(chars.find(c => c.id === 'old-1')).toBeUndefined();
      expect(chars.find(c => c.id === 'old-2')).toBeUndefined();
      // Each character has a non-empty, unique id
      const ids = chars.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      ids.forEach(id => expect(typeof id).toBe('string'));
    });

    it('does not overwrite existing characters; appends and renames on conflict', () => {
      saveCharacter({ ...createEmptyCharacter('V5', 'brujah', 'Alice'), id: 'existing-1' });

      const backup = {
        _vtmBackup: true,
        backupVersion: 1,
        exportedAt: 'now',
        characters: [
          { name: 'Alice', edition: 'V5', clan: 'brujah' },
          { name: 'Carol', edition: 'V5', clan: 'toreador' },
        ],
      };

      const result = importCharacterBackup(backup);
      expect((result as any).imported).toBe(2);
      expect((result as any).renamed).toBe(1);

      const chars = getCharacters();
      expect(chars).toHaveLength(3);
      // Original Alice still present (untouched)
      expect(chars.find(c => c.id === 'existing-1')?.name).toBe('Alice');
      // Imported clash renamed
      expect(chars.find(c => c.name === 'Alice Imported')).toBeDefined();
      // Non-clashing import keeps its name
      expect(chars.find(c => c.name === 'Carol')).toBeDefined();
    });

    it('escalates the rename suffix when "Imported" itself is taken', () => {
      saveCharacter({ ...createEmptyCharacter('V5', 'brujah', 'Alice'), id: 'e1' });
      saveCharacter({ ...createEmptyCharacter('V5', 'brujah', 'Alice Imported'), id: 'e2' });

      const backup = {
        _vtmBackup: true,
        backupVersion: 1,
        exportedAt: 'now',
        characters: [
          { name: 'Alice', edition: 'V5', clan: 'brujah' },
          { name: 'Alice', edition: 'V5', clan: 'brujah' },
        ],
      };

      const result = importCharacterBackup(backup);
      expect((result as any).imported).toBe(2);
      expect((result as any).renamed).toBe(2);

      const names = getCharacters().map(c => c.name).sort();
      expect(names).toEqual(['Alice', 'Alice Imported', 'Alice Imported 2', 'Alice Imported 3']);
    });

    it('preserves character data fields (disciplines, powers, backgrounds, notes, identity)', () => {
      const richCharacter = {
        name: 'Rich Char',
        edition: 'V20' as const,
        clan: 'tremere',
        generation: 8,
        concept: 'Test concept',
        chronicle: 'Test chronicle',
        nature: 'Visionary',
        demeanor: 'Architect',
        disciplines: {
          thaumaturgy: 3,
          auspex: { rating: 2, powers: ['Heightened Senses'] },
        },
        backgrounds: { resources: 4, allies: 2 },
        notes: 'Rich notes here',
      };

      const result = importCharacterBackup({
        _vtmBackup: true,
        backupVersion: 1,
        exportedAt: 'now',
        characters: [richCharacter],
      });
      expect((result as any).imported).toBe(1);

      const imported = getCharacters()[0] as any;
      expect(imported.name).toBe('Rich Char');
      expect(imported.edition).toBe('V20');
      expect(imported.clan).toBe('tremere');
      expect(imported.generation).toBe(8);
      expect(imported.concept).toBe('Test concept');
      expect(imported.chronicle).toBe('Test chronicle');
      expect(imported.nature).toBe('Visionary');
      expect(imported.demeanor).toBe('Architect');
      expect(imported.disciplines).toEqual({
        thaumaturgy: 3,
        auspex: { rating: 2, powers: ['Heightened Senses'] },
      });
      expect(imported.backgrounds).toEqual({ resources: 4, allies: 2 });
      expect(imported.notes).toBe('Rich notes here');
    });

    it('does not mutate the caller\'s character objects', () => {
      const original = { name: 'Alice', edition: 'V5', clan: 'brujah', id: 'frozen-id' };
      importCharacterBackup({
        _vtmBackup: true,
        backupVersion: 1,
        exportedAt: 'now',
        characters: [original],
      });
      // Source object must still have its original id
      expect(original.id).toBe('frozen-id');
    });

    it('round-trips: build then import re-creates the same characters under new IDs', () => {
      saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      saveCharacter(createEmptyCharacter('V20', 'tremere', 'Bob'));
      const backup = buildCharacterBackup();
      // Wipe and re-import
      clearCharacterStorage();

      const result = importCharacterBackup(backup);
      expect((result as any).imported).toBe(2);
      const names = getCharacters().map(c => c.name).sort();
      expect(names).toEqual(['Alice', 'Bob']);
    });
  });

  // --- Character type tag (player / npc) ---

  describe('characterType normalization', () => {
    it('createEmptyCharacter defaults new characters to "player"', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      expect((c as any).characterType).toBe('player');
    });

    it('getCharacters defaults legacy entries (missing field) to "player"', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'Legacy', clan: 'brujah', edition: 'V5' }, // no characterType
      ]));
      const chars = getCharacters();
      expect((chars[0] as any).characterType).toBe('player');
    });

    it('getCharacters preserves explicit "player"', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'PC', clan: 'brujah', edition: 'V5', characterType: 'player' },
      ]));
      expect((getCharacters()[0] as any).characterType).toBe('player');
    });

    it('getCharacters preserves explicit "npc"', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'NPC', clan: 'brujah', edition: 'V5', characterType: 'npc' },
      ]));
      expect((getCharacters()[0] as any).characterType).toBe('npc');
    });

    it('getCharacters coerces garbage values to "player"', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'A', clan: 'brujah', edition: 'V5', characterType: 'foo' },
        { id: '2', name: 'B', clan: 'brujah', edition: 'V5', characterType: 42 },
        { id: '3', name: 'C', clan: 'brujah', edition: 'V5', characterType: null },
      ]));
      const chars = getCharacters();
      expect(chars.every(c => (c as any).characterType === 'player')).toBe(true);
    });
  });

  describe('setCharacterType', () => {
    it('updates the characterType and persists', () => {
      const created = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      const updated = setCharacterType(created.id, 'npc');
      expect(updated).not.toBeNull();
      expect((updated as any).characterType).toBe('npc');
      // Persisted across re-read
      expect((getCharacters()[0] as any).characterType).toBe('npc');
    });

    it('returns null when the character is not found', () => {
      expect(setCharacterType('does-not-exist', 'npc')).toBeNull();
    });

    it('refreshes updatedAt when the tag changes', () => {
      const created = saveCharacter({ ...createEmptyCharacter('V5', 'brujah', 'A'), updatedAt: '2000-01-01T00:00:00.000Z' });
      const updated = setCharacterType(created.id, 'npc');
      expect((updated as any).updatedAt).not.toBe('2000-01-01T00:00:00.000Z');
    });

    it('coerces unknown type strings to "player"', () => {
      const created = saveCharacter(createEmptyCharacter('V5', 'brujah', 'A'));
      const updated = setCharacterType(created.id, 'something' as any);
      expect((updated as any).characterType).toBe('player');
    });
  });

  describe('characterType preservation through copy/export/backup paths', () => {
    it('duplicateCharacter preserves the tag on the new copy', () => {
      const created = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      setCharacterType(created.id, 'npc');
      const copy = duplicateCharacter(created.id);
      expect(copy).not.toBeNull();
      expect((copy as any).characterType).toBe('npc');
    });

    it('renameCharacter preserves the tag', () => {
      const created = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      setCharacterType(created.id, 'npc');
      const renamed = renameCharacter(created.id, 'Renamed');
      expect((renamed as any).characterType).toBe('npc');
    });

    it('single-character export → import preserves the tag', () => {
      const created = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      setCharacterType(created.id, 'npc');
      const exp = buildCharacterExport(created.id);
      localStorageMock.clear();
      const result = importCharacter(exp);
      expect(typeof result).not.toBe('string');
      expect((result as any).characterType).toBe('npc');
    });

    it('backup export → import preserves the tag for each character', () => {
      const a = saveCharacter(createEmptyCharacter('V5', 'brujah', 'Alice'));
      const b = saveCharacter(createEmptyCharacter('V20', 'tremere', 'Bob'));
      setCharacterType(a.id, 'npc');
      // b stays 'player' (default)
      const backup = buildCharacterBackup();
      localStorageMock.clear();
      importCharacterBackup(backup);
      const loaded = getCharacters();
      const aReloaded = loaded.find(c => c.name === 'Alice');
      const bReloaded = loaded.find(c => c.name === 'Bob');
      expect((aReloaded as any).characterType).toBe('npc');
      expect((bReloaded as any).characterType).toBe('player');
    });
  });

  // --- Inventory normalization ---

  describe('normalizeInventory', () => {
    it('returns an empty array for missing/null/garbage values', () => {
      expect(normalizeInventory(undefined)).toEqual([]);
      expect(normalizeInventory(null)).toEqual([]);
      expect(normalizeInventory(42)).toEqual([]);
      expect(normalizeInventory({})).toEqual([]);
    });

    it('returns an empty array for an empty string', () => {
      expect(normalizeInventory('')).toEqual([]);
      expect(normalizeInventory('   ')).toEqual([]);
    });

    it('wraps a non-empty legacy string as a single "Legacy Notes" item', () => {
      const result = normalizeInventory('Stake, lockpicks, lighter');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Legacy Notes');
      expect(result[0].notes).toBe('Stake, lockpicks, lighter');
      expect(typeof result[0].id).toBe('string');
      expect(result[0].id.length).toBeGreaterThan(0);
    });

    it('preserves a well-formed item array verbatim', () => {
      const items = [
        { id: 'i1', name: 'Stake', quantity: 1, category: 'weapon', notes: 'Wooden' },
        { id: 'i2', name: 'Jacket', quantity: 1, category: 'armor' },
      ];
      const result = normalizeInventory(items);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(items[0]);
      expect(result[1].name).toBe('Jacket');
      expect(result[1].notes).toBeUndefined();
    });

    it('assigns a fresh id to items missing/empty id', () => {
      const result = normalizeInventory([{ name: 'NoId' }, { id: '', name: 'EmptyId' }]);
      expect(result).toHaveLength(2);
      expect(typeof result[0].id).toBe('string');
      expect(result[0].id.length).toBeGreaterThan(0);
      expect(typeof result[1].id).toBe('string');
      expect(result[1].id.length).toBeGreaterThan(0);
      expect(result[0].id).not.toBe(result[1].id);
    });

    it('drops entries that are not items (null, primitives, missing name)', () => {
      const result = normalizeInventory([
        { id: 'a', name: 'Keep' },
        null,
        'string',
        42,
        { id: 'b' }, // no name
        { id: 'c', name: 'AlsoKeep' },
      ]);
      expect(result.map(i => i.name)).toEqual(['Keep', 'AlsoKeep']);
    });

    it('rejects an invalid category and leaves the slot undefined', () => {
      const result = normalizeInventory([
        { id: 'i1', name: 'A', category: 'plasma-rifle' },
      ]);
      expect(result[0].category).toBeUndefined();
    });

    it('strips non-finite quantities (NaN, Infinity)', () => {
      const result = normalizeInventory([
        { id: 'i1', name: 'A', quantity: NaN },
        { id: 'i2', name: 'B', quantity: Infinity },
        { id: 'i3', name: 'C', quantity: 3 },
      ]);
      expect(result[0].quantity).toBeUndefined();
      expect(result[1].quantity).toBeUndefined();
      expect(result[2].quantity).toBe(3);
    });

    it('accepts the Phase 2 categories: document, vehicle, occult, personal', () => {
      const result = normalizeInventory([
        { id: 'd', name: 'Map', category: 'document' },
        { id: 'v', name: 'Sedan', category: 'vehicle' },
        { id: 'o', name: 'Amulet', category: 'occult' },
        { id: 'p', name: 'Diary', category: 'personal' },
      ]);
      expect(result.map(i => i.category)).toEqual(['document', 'vehicle', 'occult', 'personal']);
    });

    it('preserves the legacy categories untouched (weapon/armor/tool/equipment/money/other)', () => {
      const result = normalizeInventory([
        { id: '1', name: 'A', category: 'weapon' },
        { id: '2', name: 'B', category: 'armor' },
        { id: '3', name: 'C', category: 'tool' },
        { id: '4', name: 'D', category: 'equipment' },
        { id: '5', name: 'E', category: 'money' },
        { id: '6', name: 'F', category: 'other' },
      ]);
      expect(result.map(i => i.category)).toEqual(['weapon', 'armor', 'tool', 'equipment', 'money', 'other']);
    });

    it('keeps equipped=true and drops anything else (backward-compatible: missing field is normal)', () => {
      const result = normalizeInventory([
        { id: '1', name: 'A', equipped: true },
        { id: '2', name: 'B', equipped: 'true' },
        { id: '3', name: 'C', equipped: false },
        { id: '4', name: 'D', equipped: 'false' },
        { id: '5', name: 'E' /* no equipped field */ },
        { id: '6', name: 'F', equipped: 1 },
      ]);
      expect(result[0].equipped).toBe(true);
      expect(result[1].equipped).toBe(true);
      expect(result[2].equipped).toBeUndefined();
      expect(result[3].equipped).toBeUndefined();
      expect(result[4].equipped).toBeUndefined();
      expect(result[5].equipped).toBeUndefined();
    });
  });

  describe('inventory integration with storage', () => {
    it('createEmptyCharacter starts with an empty inventory', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      expect((c as any).inventory).toEqual([]);
    });

    it('getCharacters normalizes legacy inventory shapes on read', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'A', clan: 'brujah', edition: 'V5' }, // no inventory
        { id: '2', name: 'B', clan: 'brujah', edition: 'V5', inventory: 'Stakes and lockpicks' }, // legacy string
        { id: '3', name: 'C', clan: 'brujah', edition: 'V5', inventory: [{ id: 'i1', name: 'Sword' }] },
      ]));
      const chars = getCharacters();
      expect((chars[0] as any).inventory).toEqual([]);
      expect((chars[1] as any).inventory).toHaveLength(1);
      expect((chars[1] as any).inventory[0].notes).toBe('Stakes and lockpicks');
      expect((chars[2] as any).inventory).toHaveLength(1);
      expect((chars[2] as any).inventory[0].name).toBe('Sword');
    });
  });

  describe('chronicleId linking (backward compatible)', () => {
    it('omits chronicleId entirely for legacy characters (missing field)', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'Legacy', clan: 'brujah', edition: 'V5' },
      ]));
      const c = getCharacters()[0];
      expect((c as any).chronicleId).toBeUndefined();
      expect('chronicleId' in c).toBe(false);
    });

    it('drops blank or non-string chronicleId values on load', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'A', clan: 'brujah', edition: 'V5', chronicleId: '' },
        { id: '2', name: 'B', clan: 'brujah', edition: 'V5', chronicleId: '   ' },
        { id: '3', name: 'C', clan: 'brujah', edition: 'V5', chronicleId: 42 },
        { id: '4', name: 'D', clan: 'brujah', edition: 'V5', chronicleId: null },
      ]));
      const chars = getCharacters();
      for (const c of chars) {
        expect((c as any).chronicleId).toBeUndefined();
      }
    });

    it('preserves a valid chronicleId on load', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'A', clan: 'brujah', edition: 'V5', chronicleId: 'chr-123' },
      ]));
      expect(getCharacters()[0].chronicleId).toBe('chr-123');
    });

    it('createEmptyCharacter does not set chronicleId', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      expect((c as any).chronicleId).toBeUndefined();
    });
  });

  describe('setCharacterChronicle', () => {
    it('assigns a chronicleId to a character', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      saveCharacter(c);
      const updated = setCharacterChronicle(c.id, 'chr-1');
      expect(updated?.chronicleId).toBe('chr-1');
      expect(getCharacters()[0].chronicleId).toBe('chr-1');
    });

    it('clears the link when given null', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      saveCharacter(c);
      setCharacterChronicle(c.id, 'chr-1');
      const cleared = setCharacterChronicle(c.id, null);
      expect((cleared as any).chronicleId).toBeUndefined();
      expect((getCharacters()[0] as any).chronicleId).toBeUndefined();
    });

    it('clears the link when given an empty/whitespace string', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      saveCharacter(c);
      setCharacterChronicle(c.id, 'chr-1');
      setCharacterChronicle(c.id, '   ');
      expect((getCharacters()[0] as any).chronicleId).toBeUndefined();
    });

    it('returns null for unknown character id', () => {
      expect(setCharacterChronicle('nope', 'chr-1')).toBeNull();
    });

    it('does not verify the chronicle exists — that is the UI\'s job', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      saveCharacter(c);
      const updated = setCharacterChronicle(c.id, 'never-created');
      expect(updated?.chronicleId).toBe('never-created');
    });
  });

  describe('chronicleId survives import/export round-trips', () => {
    it('single-character export includes chronicleId and import preserves it', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Linked');
      saveCharacter(c);
      setCharacterChronicle(c.id, 'chr-xyz');

      const exported = buildCharacterExport(c.id);
      expect(exported?.character.chronicleId).toBe('chr-xyz');

      clearCharacterStorage();
      const imported = importCharacter(exported);
      // importCharacter returns Character or string error
      expect(typeof imported === 'object' && imported !== null).toBe(true);
      expect((imported as any).chronicleId).toBe('chr-xyz');
    });

    it('full backup preserves chronicleId for every character', () => {
      const a = createEmptyCharacter('V5', 'brujah', 'A');
      const b = createEmptyCharacter('V5', 'tremere', 'B');
      saveCharacter(a);
      saveCharacter(b);
      setCharacterChronicle(a.id, 'chr-1');
      // b intentionally left unassigned

      const backup = buildCharacterBackup();
      expect(backup.characters.find(x => x.name === 'A')?.chronicleId).toBe('chr-1');
      expect(backup.characters.find(x => x.name === 'B')?.chronicleId).toBeUndefined();

      clearCharacterStorage();
      const result = importCharacterBackup(backup);
      expect(typeof result).toBe('object');
      const reloaded = getCharacters();
      const restoredA = reloaded.find(c => c.name === 'A');
      const restoredB = reloaded.find(c => c.name === 'B');
      expect(restoredA?.chronicleId).toBe('chr-1');
      expect((restoredB as any)?.chronicleId).toBeUndefined();
    });
  });

  describe('normalizeCharacterNotes', () => {
    it('returns an empty array for missing/null/garbage values when no legacy notes', () => {
      expect(normalizeCharacterNotes(undefined)).toEqual([]);
      expect(normalizeCharacterNotes(null)).toEqual([]);
      expect(normalizeCharacterNotes(42)).toEqual([]);
      expect(normalizeCharacterNotes('not-an-array')).toEqual([]);
      expect(normalizeCharacterNotes({})).toEqual([]);
    });

    it('seeds a single "general" entry from a non-empty legacy notes string', () => {
      const result = normalizeCharacterNotes(undefined, 'My old freeform notes.');
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('general');
      expect(result[0].title).toBe('');
      expect(result[0].body).toBe('My old freeform notes.');
      expect(typeof result[0].id).toBe('string');
      expect(result[0].id.length).toBeGreaterThan(0);
      expect(typeof result[0].createdAt).toBe('string');
      expect(typeof result[0].updatedAt).toBe('string');
    });

    it('does NOT seed from a legacy string when characterNotes is already a non-empty array', () => {
      const existing = [{ id: 'n1', category: 'goals', title: 'Find Sire', body: 'Soon.', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }];
      const result = normalizeCharacterNotes(existing, 'Should be ignored.');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Find Sire');
    });

    it('treats an explicit empty array as "user already migrated" and does not seed', () => {
      const result = normalizeCharacterNotes([], 'Legacy text that should be left alone.');
      expect(result).toEqual([]);
    });

    it('treats blank/whitespace legacy notes as nothing to seed', () => {
      expect(normalizeCharacterNotes(undefined, '')).toEqual([]);
      expect(normalizeCharacterNotes(undefined, '   ')).toEqual([]);
    });

    it('preserves a well-formed note array verbatim (id, category, timestamps)', () => {
      const notes = [
        { id: 'n1', category: 'backstory', title: 'Childe of', body: 'Brujah elder', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-02T00:00:00.000Z' },
        { id: 'n2', category: 'secrets',  title: '',           body: 'Sees ghosts', createdAt: '2025-01-03T00:00:00.000Z', updatedAt: '2025-01-03T00:00:00.000Z' },
      ];
      const result = normalizeCharacterNotes(notes);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(notes[0]);
      expect(result[1].category).toBe('secrets');
      expect(result[1].title).toBe('');
      expect(result[1].body).toBe('Sees ghosts');
    });

    it('assigns a fresh id to notes missing/empty id', () => {
      const result = normalizeCharacterNotes([
        { category: 'general', title: 'A', body: '' },
        { id: '',              category: 'general', title: 'B', body: '' },
      ]);
      expect(result).toHaveLength(2);
      expect(typeof result[0].id).toBe('string');
      expect(result[0].id.length).toBeGreaterThan(0);
      expect(typeof result[1].id).toBe('string');
      expect(result[1].id.length).toBeGreaterThan(0);
      expect(result[0].id).not.toBe(result[1].id);
    });

    it('drops entries that have neither a title nor a body', () => {
      const result = normalizeCharacterNotes([
        { id: 'a', category: 'general', title: 'Keep', body: '' },
        { id: 'b', category: 'general', title: '',     body: 'Keep too' },
        { id: 'c', category: 'general', title: '',     body: '' },          // drop
        { id: 'd', category: 'general', title: '   ',  body: '   ' },        // drop (whitespace only)
        null,                                                                 // drop
        'string',                                                             // drop
        { id: 'e', category: 'general' /* no title or body */ },              // drop
      ]);
      expect(result.map(n => n.id)).toEqual(['a', 'b']);
    });

    it('normalizes unknown / missing categories to "other"', () => {
      const result = normalizeCharacterNotes([
        { id: '1', category: 'plasma-rifle', title: 'A', body: '' },
        { id: '2',                          title: 'B', body: '' },
        { id: '3', category: null,          title: 'C', body: '' },
      ]);
      expect(result[0].category).toBe('other');
      expect(result[1].category).toBe('other');
      expect(result[2].category).toBe('other');
    });

    it('accepts all valid categories', () => {
      const cats = ['general', 'backstory', 'goals', 'secrets', 'contacts', 'session', 'other'];
      const result = normalizeCharacterNotes(
        cats.map((cat, i) => ({ id: `n${i}`, category: cat, title: cat, body: '' }))
      );
      expect(result.map(n => n.category)).toEqual(cats);
    });

    it('fills missing timestamps with current time', () => {
      const before = Date.now();
      const result = normalizeCharacterNotes([
        { id: 'n1', category: 'general', title: 'A', body: '' },
      ]);
      const after = Date.now();
      const created = Date.parse(result[0].createdAt);
      expect(created).toBeGreaterThanOrEqual(before);
      expect(created).toBeLessThanOrEqual(after);
      // updatedAt falls back to createdAt when missing.
      expect(result[0].updatedAt).toBe(result[0].createdAt);
    });
  });

  describe('characterNotes integration with storage', () => {
    it('createEmptyCharacter starts with an empty characterNotes array', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Alice');
      expect((c as any).characterNotes).toEqual([]);
    });

    it('getCharacters seeds characterNotes from a legacy notes string on read', () => {
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'Legacy', clan: 'brujah', edition: 'V5', notes: 'Older free-form notes' },
      ]));
      const c = getCharacters()[0] as any;
      expect(c.characterNotes).toHaveLength(1);
      expect(c.characterNotes[0].body).toBe('Older free-form notes');
      expect(c.characterNotes[0].category).toBe('general');
      // The legacy `notes` string is NOT cleared.
      expect(c.notes).toBe('Older free-form notes');
    });

    it('getCharacters preserves existing structured characterNotes verbatim', () => {
      const notes = [
        { id: 'n1', category: 'goals', title: 'Find sire', body: 'soon', createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
      ];
      localStorageMock.setItem('vtm-characters', JSON.stringify([
        { id: '1', name: 'A', clan: 'brujah', edition: 'V5', characterNotes: notes, notes: 'Should be ignored as a seed source' },
      ]));
      const c = getCharacters()[0] as any;
      expect(c.characterNotes).toEqual(notes);
    });
  });

  describe('characterNotes survives import/export round-trips', () => {
    it('single-character export and re-import preserves characterNotes', () => {
      const c = createEmptyCharacter('V5', 'brujah', 'Journaler');
      const now = new Date().toISOString();
      const cWithNotes = {
        ...c,
        characterNotes: [
          { id: 'n1', category: 'backstory' as const, title: 'Childhood', body: 'Born in Vienna.', createdAt: now, updatedAt: now },
          { id: 'n2', category: 'secrets'   as const, title: '',          body: 'Sees ghosts.',    createdAt: now, updatedAt: now },
        ],
      };
      saveCharacter(cWithNotes as any);

      const exported = buildCharacterExport(c.id);
      expect(Array.isArray(exported?.character.characterNotes)).toBe(true);
      expect(exported?.character.characterNotes).toHaveLength(2);

      clearCharacterStorage();
      const imported = importCharacter(exported);
      expect(typeof imported === 'object' && imported !== null).toBe(true);
      const restored = (imported as any).characterNotes;
      expect(restored).toHaveLength(2);
      expect(restored[0].body).toBe('Born in Vienna.');
      expect(restored[1].category).toBe('secrets');
    });

    it('full backup preserves characterNotes for every character', () => {
      const a = createEmptyCharacter('V5', 'brujah', 'A');
      const b = createEmptyCharacter('V5', 'tremere', 'B');
      const now = new Date().toISOString();
      saveCharacter({ ...a, characterNotes: [
        { id: 'n1', category: 'goals' as const, title: 'Find Sire', body: '', createdAt: now, updatedAt: now },
      ] } as any);
      saveCharacter(b); // no notes

      const backup = buildCharacterBackup();
      expect(backup.characters.find(x => x.name === 'A')?.characterNotes).toHaveLength(1);
      expect(backup.characters.find(x => x.name === 'B')?.characterNotes).toEqual([]);

      clearCharacterStorage();
      const result = importCharacterBackup(backup);
      expect(typeof result).toBe('object');
      const reloaded = getCharacters();
      const restoredA = reloaded.find(c => c.name === 'A') as any;
      const restoredB = reloaded.find(c => c.name === 'B') as any;
      expect(restoredA?.characterNotes).toHaveLength(1);
      expect(restoredA?.characterNotes[0].title).toBe('Find Sire');
      expect(restoredB?.characterNotes).toEqual([]);
    });
  });
});
