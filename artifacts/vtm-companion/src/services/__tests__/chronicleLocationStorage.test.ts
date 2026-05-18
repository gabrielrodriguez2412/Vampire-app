import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllChronicleLocations,
  getChronicleLocations,
  getChronicleLocationById,
  saveChronicleLocation,
  createEmptyChronicleLocation,
  updateChronicleLocation,
  deleteChronicleLocation,
  deleteChronicleLocationsForChronicle,
  clearChronicleLocationStorage,
  normalizeLocationCategory,
} from '../chronicleLocationStorage';
import { ChronicleLocation } from '../../types';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const KEY = 'vtm-chronicle-locations';

describe('chronicleLocationStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('normalizeLocationCategory', () => {
    it('returns the value for known categories', () => {
      for (const cat of ['haven', 'elysium', 'domain', 'business', 'street', 'neighborhood', 'enemy_base', 'other']) {
        expect(normalizeLocationCategory(cat)).toBe(cat);
      }
    });

    it('falls back to "other" for unknown / missing / garbage', () => {
      expect(normalizeLocationCategory(undefined)).toBe('other');
      expect(normalizeLocationCategory(null)).toBe('other');
      expect(normalizeLocationCategory('')).toBe('other');
      expect(normalizeLocationCategory('mansion')).toBe('other');
      expect(normalizeLocationCategory(42)).toBe('other');
    });
  });

  describe('getAllChronicleLocations', () => {
    it('returns empty array when storage is empty', () => {
      expect(getAllChronicleLocations()).toEqual([]);
    });

    it('returns empty array when storage holds non-array JSON', () => {
      localStorageMock.setItem(KEY, JSON.stringify({ x: 1 }));
      expect(getAllChronicleLocations()).toEqual([]);
    });

    it('returns empty array when storage holds malformed JSON', () => {
      localStorageMock.setItem(KEY, '{not json');
      expect(getAllChronicleLocations()).toEqual([]);
    });

    it('drops entries with no usable chronicleId (would be orphans)', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { id: 'l1', name: 'No chronicle' },
        { id: 'l2', chronicleId: '', name: 'Blank' },
        { id: 'l3', chronicleId: 'c1', name: 'Good' },
      ]));
      const locs = getAllChronicleLocations();
      expect(locs).toHaveLength(1);
      expect(locs[0].name).toBe('Good');
    });

    it('fills in defaults for missing fields', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1' }, // no id, name, category, timestamps, links
      ]));
      const [l] = getAllChronicleLocations();
      expect(l.id).toBeTruthy();
      expect(l.name).toBe('Untitled Location');
      expect(l.category).toBe('other');
      expect(l.linkedCharacterIds).toEqual([]);
      expect(l.createdAt).toBeTruthy();
      expect(l.updatedAt).toBeTruthy();
      expect(l.description).toBeUndefined();
      expect(l.district).toBeUndefined();
      expect(l.notes).toBeUndefined();
    });

    it('coerces unknown category to "other"', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', name: 'X', category: 'unknown-type' },
      ]));
      const [l] = getAllChronicleLocations();
      expect(l.category).toBe('other');
    });

    it('filters non-string entries out of linkedCharacterIds', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', name: 'X', linkedCharacterIds: ['a', null, 42, '', 'b'] },
      ]));
      const [l] = getAllChronicleLocations();
      expect(l.linkedCharacterIds).toEqual(['a', 'b']);
    });

    it('coerces non-array linkedCharacterIds to []', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', name: 'X', linkedCharacterIds: 'oops' },
      ]));
      const [l] = getAllChronicleLocations();
      expect(l.linkedCharacterIds).toEqual([]);
    });

    it('drops blank optional description / district / notes', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', name: 'X', description: '   ', district: '', notes: '   ' },
      ]));
      const [l] = getAllChronicleLocations();
      expect(l.description).toBeUndefined();
      expect(l.district).toBeUndefined();
      expect(l.notes).toBeUndefined();
    });
  });

  describe('getChronicleLocations', () => {
    it('returns [] for empty chronicleId', () => {
      expect(getChronicleLocations('')).toEqual([]);
    });

    it('returns only locations for the given chronicle', () => {
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'A' });
      saveChronicleLocation({ ...createEmptyChronicleLocation('c2'), name: 'B' });
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'C' });

      const a = getChronicleLocations('c1').map(l => l.name);
      const b = getChronicleLocations('c2').map(l => l.name);
      expect(a).toEqual(['A', 'C']);
      expect(b).toEqual(['B']);
    });

    it('sorts locations alphabetically by name', () => {
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'Zeta' });
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'Alpha' });
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'Mu' });
      const names = getChronicleLocations('c1').map(l => l.name);
      expect(names).toEqual(['Alpha', 'Mu', 'Zeta']);
    });
  });

  describe('createEmptyChronicleLocation', () => {
    it('builds a scaffold with safe defaults', () => {
      const l = createEmptyChronicleLocation('c1');
      expect(l.id).toBeTruthy();
      expect(l.chronicleId).toBe('c1');
      expect(l.name).toBeTruthy();
      expect(l.category).toBe('other');
      expect(l.linkedCharacterIds).toEqual([]);
      expect(l.createdAt).toBeTruthy();
      expect(l.updatedAt).toBeTruthy();
    });

    it('does NOT persist by itself', () => {
      createEmptyChronicleLocation('c1');
      expect(getAllChronicleLocations()).toEqual([]);
    });
  });

  describe('saveChronicleLocation', () => {
    it('inserts a new location', () => {
      const l = saveChronicleLocation({
        ...createEmptyChronicleLocation('c1'),
        name: 'The Last Round',
        category: 'business',
      });
      expect(l.name).toBe('The Last Round');
      expect(l.category).toBe('business');
      expect(getAllChronicleLocations()).toHaveLength(1);
    });

    it('updates an existing location by id', () => {
      const l = saveChronicleLocation({
        ...createEmptyChronicleLocation('c1'),
        name: 'First',
      });
      saveChronicleLocation({ ...l, name: 'Renamed' });
      const all = getAllChronicleLocations();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('Renamed');
    });

    it('coerces blank name to "Untitled Location"', () => {
      const l = saveChronicleLocation({
        ...createEmptyChronicleLocation('c1'),
        name: '   ',
      });
      expect(l.name).toBe('Untitled Location');
    });

    it('coerces invalid category to "other"', () => {
      const l = saveChronicleLocation({
        ...createEmptyChronicleLocation('c1'),
        name: 'X',
        category: 'unknown' as unknown as ChronicleLocation['category'],
      });
      expect(l.category).toBe('other');
    });

    it('filters non-string linkedCharacterIds on save', () => {
      const base = createEmptyChronicleLocation('c1');
      const l = saveChronicleLocation({
        ...base,
        name: 'X',
        linkedCharacterIds: ['a', '', null as unknown as string, 'b'],
      });
      expect(l.linkedCharacterIds).toEqual(['a', 'b']);
    });

    it('refreshes updatedAt on save', async () => {
      const l = saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'X' });
      const before = l.updatedAt;
      await new Promise(r => setTimeout(r, 5));
      const after = saveChronicleLocation({ ...l, description: 'edited' });
      expect(Date.parse(after.updatedAt)).toBeGreaterThanOrEqual(Date.parse(before));
    });
  });

  describe('updateChronicleLocation', () => {
    it('returns null when id not found', () => {
      expect(updateChronicleLocation('nope', { name: 'x' })).toBeNull();
    });

    it('updates name but ignores blank', () => {
      const l = saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'Orig' });
      const u = updateChronicleLocation(l.id, { name: '  Renamed ' });
      expect(u?.name).toBe('Renamed');
      const blank = updateChronicleLocation(l.id, { name: '   ' });
      expect(blank?.name).toBe('Renamed');
    });

    it('clears optional description/district/notes when given empty string', () => {
      const l = saveChronicleLocation({
        ...createEmptyChronicleLocation('c1'),
        name: 'X',
        description: 'foo',
        district: 'bar',
        notes: 'baz',
      });
      const u = updateChronicleLocation(l.id, { description: '', district: '', notes: '' });
      expect(u?.description).toBeUndefined();
      expect(u?.district).toBeUndefined();
      expect(u?.notes).toBeUndefined();
    });

    it('replaces linkedCharacterIds wholesale and filters non-strings', () => {
      const l = saveChronicleLocation({
        ...createEmptyChronicleLocation('c1'),
        name: 'X',
        linkedCharacterIds: ['a', 'b'],
      });
      const u = updateChronicleLocation(l.id, {
        linkedCharacterIds: ['c', '', null as unknown as string, 'd'],
      });
      expect(u?.linkedCharacterIds).toEqual(['c', 'd']);
    });

    it('normalizes category on update', () => {
      const l = saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'X' });
      const u = updateChronicleLocation(l.id, {
        category: 'bogus' as unknown as ChronicleLocation['category'],
      });
      expect(u?.category).toBe('other');
      const u2 = updateChronicleLocation(l.id, { category: 'haven' });
      expect(u2?.category).toBe('haven');
    });
  });

  describe('deleteChronicleLocation', () => {
    it('removes the location', () => {
      const l1 = saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'a' });
      const l2 = saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'b' });
      deleteChronicleLocation(l1.id);
      const remaining = getAllChronicleLocations();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(l2.id);
    });

    it('is a safe no-op for an unknown id', () => {
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'a' });
      deleteChronicleLocation('does-not-exist');
      expect(getAllChronicleLocations()).toHaveLength(1);
    });
  });

  describe('deleteChronicleLocationsForChronicle', () => {
    it('removes only locations for the target chronicle and returns count', () => {
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'a' });
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'b' });
      saveChronicleLocation({ ...createEmptyChronicleLocation('c2'), name: 'c' });

      const removed = deleteChronicleLocationsForChronicle('c1');
      expect(removed).toBe(2);

      const remaining = getAllChronicleLocations();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].chronicleId).toBe('c2');
    });

    it('returns 0 and writes nothing for an empty chronicleId', () => {
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'a' });
      expect(deleteChronicleLocationsForChronicle('')).toBe(0);
      expect(getAllChronicleLocations()).toHaveLength(1);
    });
  });

  describe('getChronicleLocationById', () => {
    it('finds an existing location', () => {
      const l = saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'T' });
      expect(getChronicleLocationById(l.id)?.name).toBe('T');
    });

    it('returns undefined for unknown id', () => {
      expect(getChronicleLocationById('nope')).toBeUndefined();
    });
  });

  describe('clearChronicleLocationStorage', () => {
    it('wipes everything', () => {
      saveChronicleLocation({ ...createEmptyChronicleLocation('c1'), name: 'a' });
      saveChronicleLocation({ ...createEmptyChronicleLocation('c2'), name: 'b' });
      clearChronicleLocationStorage();
      expect(getAllChronicleLocations()).toEqual([]);
    });
  });

  describe('round-trip durability', () => {
    it('survives a save → read cycle without information loss', () => {
      const seed: ChronicleLocation = {
        ...createEmptyChronicleLocation('c1'),
        name: 'Elysium of the Rose',
        category: 'elysium',
        description: 'The Prince holds court here.',
        district: 'Downtown',
        notes: 'Weapons forbidden.',
        linkedCharacterIds: ['pc1', 'npc7'],
      };
      saveChronicleLocation(seed);

      const [l] = getChronicleLocations('c1');
      expect(l.name).toBe('Elysium of the Rose');
      expect(l.category).toBe('elysium');
      expect(l.description).toBe('The Prince holds court here.');
      expect(l.district).toBe('Downtown');
      expect(l.notes).toBe('Weapons forbidden.');
      expect(l.linkedCharacterIds).toEqual(['pc1', 'npc7']);
    });
  });
});
