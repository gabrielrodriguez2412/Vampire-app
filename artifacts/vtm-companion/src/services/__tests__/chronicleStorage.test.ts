import { describe, it, expect, beforeEach } from 'vitest';
import {
  getChronicles,
  getChronicleById,
  saveChronicle,
  clearChronicleStorage,
  createEmptyChronicle,
  renameChronicle,
  updateChronicle,
  setChronicleStatus,
  deleteChronicle,
  normalizeChronicleStatus,
} from '../chronicleStorage';

// Mock localStorage (same pattern as characterStorage tests)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('chronicleStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('normalizeChronicleStatus', () => {
    it('returns "archived" only for the exact "archived" string', () => {
      expect(normalizeChronicleStatus('archived')).toBe('archived');
    });

    it('defaults to "active" for active/missing/garbage values', () => {
      expect(normalizeChronicleStatus('active')).toBe('active');
      expect(normalizeChronicleStatus(undefined)).toBe('active');
      expect(normalizeChronicleStatus(null)).toBe('active');
      expect(normalizeChronicleStatus('')).toBe('active');
      expect(normalizeChronicleStatus('paused')).toBe('active');
      expect(normalizeChronicleStatus(42)).toBe('active');
    });
  });

  describe('getChronicles', () => {
    it('returns empty array when storage is empty', () => {
      expect(getChronicles()).toEqual([]);
    });

    it('returns empty array when storage holds non-array JSON', () => {
      localStorageMock.setItem('vtm-chronicles', JSON.stringify({ not: 'an array' }));
      expect(getChronicles()).toEqual([]);
    });

    it('returns empty array when storage holds malformed JSON', () => {
      localStorageMock.setItem('vtm-chronicles', '{not json');
      expect(getChronicles()).toEqual([]);
    });

    it('filters out non-object entries (null, primitives)', () => {
      localStorageMock.setItem('vtm-chronicles', JSON.stringify([
        null,
        'string',
        42,
        { id: 'c1', name: 'Valid', status: 'active' },
      ]));
      const chrs = getChronicles();
      expect(chrs).toHaveLength(1);
      expect(chrs[0].name).toBe('Valid');
    });

    it('fills in defaults for missing fields', () => {
      localStorageMock.setItem('vtm-chronicles', JSON.stringify([
        { id: 'c1' }, // missing name, status, timestamps
      ]));
      const chrs = getChronicles();
      expect(chrs).toHaveLength(1);
      expect(chrs[0].id).toBe('c1');
      expect(chrs[0].name).toBe('Untitled Chronicle');
      expect(chrs[0].status).toBe('active');
      expect(typeof chrs[0].createdAt).toBe('string');
      expect(typeof chrs[0].updatedAt).toBe('string');
    });

    it('preserves all valid fields verbatim', () => {
      const sample = {
        id: 'c1', name: 'By Night', description: 'A campaign of intrigue.',
        setting: 'Chicago', edition: 'V5', status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z',
      };
      localStorageMock.setItem('vtm-chronicles', JSON.stringify([sample]));
      const c = getChronicles()[0];
      expect(c).toMatchObject(sample);
    });

    it('coerces unknown status to "active"', () => {
      localStorageMock.setItem('vtm-chronicles', JSON.stringify([
        { id: 'c1', name: 'A', status: 'paused' },
      ]));
      expect(getChronicles()[0].status).toBe('active');
    });

    it('preserves archived status', () => {
      localStorageMock.setItem('vtm-chronicles', JSON.stringify([
        { id: 'c1', name: 'A', status: 'archived' },
      ]));
      expect(getChronicles()[0].status).toBe('archived');
    });

    it('omits empty-string optional fields after normalization', () => {
      localStorageMock.setItem('vtm-chronicles', JSON.stringify([
        { id: 'c1', name: 'A', description: '', setting: '   ' },
      ]));
      const c = getChronicles()[0];
      expect(c.description).toBeUndefined();
      expect(c.setting).toBeUndefined();
    });
  });

  describe('createEmptyChronicle', () => {
    it('returns a chronicle with safe defaults and a fresh id', () => {
      const c = createEmptyChronicle('My Chronicle');
      expect(c.name).toBe('My Chronicle');
      expect(c.status).toBe('active');
      expect(typeof c.id).toBe('string');
      expect(c.id.length).toBeGreaterThan(0);
      expect(typeof c.createdAt).toBe('string');
      expect(c.createdAt).toBe(c.updatedAt);
    });

    it('falls back to "Untitled Chronicle" for blank names', () => {
      expect(createEmptyChronicle('').name).toBe('Untitled Chronicle');
      expect(createEmptyChronicle('   ').name).toBe('Untitled Chronicle');
    });

    it('accepts optional fields and trims them', () => {
      const c = createEmptyChronicle('X', {
        description: '  A long description.  ',
        setting: '  Chicago  ',
        edition: 'V5',
      });
      expect(c.description).toBe('A long description.');
      expect(c.setting).toBe('Chicago');
      expect(c.edition).toBe('V5');
    });

    it('does NOT persist on its own', () => {
      createEmptyChronicle('X');
      expect(getChronicles()).toEqual([]);
    });
  });

  describe('saveChronicle', () => {
    it('appends a new chronicle and persists it', () => {
      const c = saveChronicle(createEmptyChronicle('Alpha'));
      const reloaded = getChronicles();
      expect(reloaded).toHaveLength(1);
      expect(reloaded[0].id).toBe(c.id);
      expect(reloaded[0].name).toBe('Alpha');
    });

    it('updates an existing chronicle by id and refreshes updatedAt', () => {
      const created = saveChronicle({ ...createEmptyChronicle('A'), updatedAt: '2000-01-01T00:00:00.000Z' });
      const updated = saveChronicle({ ...created, name: 'Alpha Renamed' });
      const reloaded = getChronicles();
      expect(reloaded).toHaveLength(1);
      expect(reloaded[0].name).toBe('Alpha Renamed');
      expect(updated.updatedAt).not.toBe('2000-01-01T00:00:00.000Z');
    });
  });

  describe('renameChronicle', () => {
    it('renames an existing chronicle', () => {
      const c = saveChronicle(createEmptyChronicle('Old Name'));
      const renamed = renameChronicle(c.id, 'New Name');
      expect(renamed?.name).toBe('New Name');
      expect(getChronicleById(c.id)?.name).toBe('New Name');
    });

    it('returns null for a blank name', () => {
      const c = saveChronicle(createEmptyChronicle('Original'));
      expect(renameChronicle(c.id, '')).toBeNull();
      expect(renameChronicle(c.id, '   ')).toBeNull();
      // Storage untouched
      expect(getChronicleById(c.id)?.name).toBe('Original');
    });

    it('returns null when the chronicle does not exist', () => {
      expect(renameChronicle('does-not-exist', 'X')).toBeNull();
    });
  });

  describe('updateChronicle', () => {
    it('updates description and setting', () => {
      const c = saveChronicle(createEmptyChronicle('A'));
      const updated = updateChronicle(c.id, { description: 'New desc', setting: 'New City' });
      expect(updated?.description).toBe('New desc');
      expect(updated?.setting).toBe('New City');
    });

    it('clears an optional field when given an empty string', () => {
      const c = saveChronicle({ ...createEmptyChronicle('A', { description: 'Old' }), id: 'c1' });
      const updated = updateChronicle(c.id, { description: '' });
      expect(updated?.description).toBeUndefined();
    });

    it('leaves fields unchanged when the patch key is undefined', () => {
      const c = saveChronicle(createEmptyChronicle('A', { description: 'Kept', setting: 'Kept' }));
      const updated = updateChronicle(c.id, { name: 'Renamed' });
      expect(updated?.name).toBe('Renamed');
      expect(updated?.description).toBe('Kept');
      expect(updated?.setting).toBe('Kept');
    });

    it('clears edition when given null', () => {
      const c = saveChronicle(createEmptyChronicle('A', { edition: 'V5' }));
      const updated = updateChronicle(c.id, { edition: null });
      expect(updated?.edition).toBeUndefined();
    });

    it('returns null when the chronicle does not exist', () => {
      expect(updateChronicle('nope', { name: 'X' })).toBeNull();
    });
  });

  describe('setChronicleStatus', () => {
    it('archives an active chronicle', () => {
      const c = saveChronicle(createEmptyChronicle('A'));
      const updated = setChronicleStatus(c.id, 'archived');
      expect(updated?.status).toBe('archived');
      expect(getChronicleById(c.id)?.status).toBe('archived');
    });

    it('unarchives an archived chronicle', () => {
      const c = saveChronicle(createEmptyChronicle('A'));
      setChronicleStatus(c.id, 'archived');
      const updated = setChronicleStatus(c.id, 'active');
      expect(updated?.status).toBe('active');
    });

    it('coerces unknown status values to "active"', () => {
      const c = saveChronicle(createEmptyChronicle('A'));
      const updated = setChronicleStatus(c.id, 'paused' as any);
      expect(updated?.status).toBe('active');
    });

    it('returns null when the chronicle does not exist', () => {
      expect(setChronicleStatus('nope', 'archived')).toBeNull();
    });
  });

  describe('deleteChronicle', () => {
    it('removes the chronicle from storage', () => {
      const a = saveChronicle(createEmptyChronicle('A'));
      const b = saveChronicle(createEmptyChronicle('B'));
      deleteChronicle(a.id);
      const remaining = getChronicles();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(b.id);
    });

    it('is a no-op for an unknown id', () => {
      saveChronicle(createEmptyChronicle('A'));
      deleteChronicle('does-not-exist');
      expect(getChronicles()).toHaveLength(1);
    });
  });

  describe('clearChronicleStorage', () => {
    it('removes the storage key entirely', () => {
      saveChronicle(createEmptyChronicle('A'));
      clearChronicleStorage();
      expect(getChronicles()).toEqual([]);
    });
  });
});
