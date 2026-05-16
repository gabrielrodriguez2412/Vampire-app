import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCharacters, saveCharacter, clearCharacterStorage, createEmptyCharacter, deleteCharacter, renameCharacter, duplicateCharacter, buildCharacterExport, validateCharacterExport, importCharacter, EXPORT_VERSION } from '../characterStorage';

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
      expect(char.health).toBe(0);
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
});
