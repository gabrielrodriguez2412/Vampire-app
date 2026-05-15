import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCharacters, saveCharacter, clearCharacterStorage, createEmptyCharacter } from '../characterStorage';

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
});
