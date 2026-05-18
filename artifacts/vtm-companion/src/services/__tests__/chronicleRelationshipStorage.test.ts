import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllChronicleRelationships,
  getChronicleRelationships,
  getChronicleRelationshipById,
  saveChronicleRelationship,
  createEmptyChronicleRelationship,
  updateChronicleRelationship,
  deleteChronicleRelationship,
  deleteChronicleRelationshipsForChronicle,
  clearChronicleRelationshipStorage,
  normalizeRelationshipType,
  normalizeRelationshipStatus,
} from '../chronicleRelationshipStorage';
import { ChronicleRelationship } from '../../types';

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

const KEY = 'vtm-chronicle-relationships';

/** Build a relationship scaffold with source + target set. */
const makeRel = (
  chronicleId: string,
  source: string,
  target: string,
  overrides: Partial<ChronicleRelationship> = {}
): ChronicleRelationship => ({
  ...createEmptyChronicleRelationship(chronicleId),
  sourceCharacterId: source,
  targetCharacterId: target,
  ...overrides,
});

describe('chronicleRelationshipStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('normalizeRelationshipType', () => {
    it('returns known values as-is', () => {
      for (const t of ['ally', 'enemy', 'sire', 'childe', 'rival', 'contact', 'mawla', 'touchstone', 'coterie_mate', 'other']) {
        expect(normalizeRelationshipType(t)).toBe(t);
      }
    });

    it('falls back to "other" for unknown / missing / garbage', () => {
      expect(normalizeRelationshipType(undefined)).toBe('other');
      expect(normalizeRelationshipType(null)).toBe('other');
      expect(normalizeRelationshipType('')).toBe('other');
      expect(normalizeRelationshipType('friend')).toBe('other');
      expect(normalizeRelationshipType(42)).toBe('other');
    });
  });

  describe('normalizeRelationshipStatus', () => {
    it('returns known values as-is', () => {
      for (const s of ['active', 'broken', 'unknown', 'secret']) {
        expect(normalizeRelationshipStatus(s)).toBe(s);
      }
    });

    it('falls back to "active" for unknown / missing / garbage', () => {
      expect(normalizeRelationshipStatus(undefined)).toBe('active');
      expect(normalizeRelationshipStatus(null)).toBe('active');
      expect(normalizeRelationshipStatus('')).toBe('active');
      expect(normalizeRelationshipStatus('paused')).toBe('active');
      expect(normalizeRelationshipStatus(42)).toBe('active');
    });
  });

  describe('getAllChronicleRelationships', () => {
    it('returns empty array when storage is empty', () => {
      expect(getAllChronicleRelationships()).toEqual([]);
    });

    it('returns empty array when storage holds non-array JSON', () => {
      localStorageMock.setItem(KEY, JSON.stringify({ x: 1 }));
      expect(getAllChronicleRelationships()).toEqual([]);
    });

    it('returns empty array when storage holds malformed JSON', () => {
      localStorageMock.setItem(KEY, '{not json');
      expect(getAllChronicleRelationships()).toEqual([]);
    });

    it('drops entries missing chronicleId, source, or target', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { id: '1', sourceCharacterId: 'a', targetCharacterId: 'b' }, // no chronicleId
        { id: '2', chronicleId: 'c1', targetCharacterId: 'b' },       // no source
        { id: '3', chronicleId: 'c1', sourceCharacterId: 'a' },       // no target
        { id: '4', chronicleId: '', sourceCharacterId: 'a', targetCharacterId: 'b' },
        { id: '5', chronicleId: 'c1', sourceCharacterId: '', targetCharacterId: 'b' },
        { id: '6', chronicleId: 'c1', sourceCharacterId: 'a', targetCharacterId: '' },
        { id: '7', chronicleId: 'c1', sourceCharacterId: 'a', targetCharacterId: 'b' },
      ]));
      const rels = getAllChronicleRelationships();
      expect(rels).toHaveLength(1);
      expect(rels[0].id).toBe('7');
    });

    it('fills in defaults for missing fields', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', sourceCharacterId: 'a', targetCharacterId: 'b' },
      ]));
      const [r] = getAllChronicleRelationships();
      expect(r.id).toBeTruthy();
      expect(r.relationshipType).toBe('other');
      expect(r.status).toBe('active');
      expect(r.createdAt).toBeTruthy();
      expect(r.updatedAt).toBeTruthy();
      expect(r.description).toBeUndefined();
    });

    it('normalizes unknown type / status', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        {
          chronicleId: 'c1',
          sourceCharacterId: 'a',
          targetCharacterId: 'b',
          relationshipType: 'frenemy',
          status: 'archived',
        },
      ]));
      const [r] = getAllChronicleRelationships();
      expect(r.relationshipType).toBe('other');
      expect(r.status).toBe('active');
    });

    it('drops blank optional description', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', sourceCharacterId: 'a', targetCharacterId: 'b', description: '   ' },
      ]));
      const [r] = getAllChronicleRelationships();
      expect(r.description).toBeUndefined();
    });
  });

  describe('getChronicleRelationships', () => {
    it('returns [] for empty chronicleId', () => {
      expect(getChronicleRelationships('')).toEqual([]);
    });

    it('returns only relationships for the given chronicle', () => {
      saveChronicleRelationship(makeRel('c1', 'a', 'b'));
      saveChronicleRelationship(makeRel('c2', 'a', 'b'));
      saveChronicleRelationship(makeRel('c1', 'b', 'c'));

      expect(getChronicleRelationships('c1')).toHaveLength(2);
      expect(getChronicleRelationships('c2')).toHaveLength(1);
    });

    it('sorts newest-first by updatedAt', async () => {
      saveChronicleRelationship(makeRel('c1', 'a', 'b'));
      await new Promise(r => setTimeout(r, 5));
      saveChronicleRelationship(makeRel('c1', 'b', 'c'));
      await new Promise(r => setTimeout(r, 5));
      saveChronicleRelationship(makeRel('c1', 'c', 'd'));

      const rels = getChronicleRelationships('c1');
      expect(rels[0].sourceCharacterId).toBe('c');
      expect(rels[2].sourceCharacterId).toBe('a');
    });
  });

  describe('createEmptyChronicleRelationship', () => {
    it('builds a scaffold with empty source/target', () => {
      const r = createEmptyChronicleRelationship('c1');
      expect(r.id).toBeTruthy();
      expect(r.chronicleId).toBe('c1');
      expect(r.sourceCharacterId).toBe('');
      expect(r.targetCharacterId).toBe('');
      expect(r.relationshipType).toBe('other');
      expect(r.status).toBe('active');
      expect(r.createdAt).toBeTruthy();
      expect(r.updatedAt).toBeTruthy();
    });

    it('does NOT persist by itself', () => {
      createEmptyChronicleRelationship('c1');
      expect(getAllChronicleRelationships()).toEqual([]);
    });
  });

  describe('saveChronicleRelationship', () => {
    it('inserts a new relationship', () => {
      const saved = saveChronicleRelationship(makeRel('c1', 'a', 'b', {
        relationshipType: 'ally',
      }));
      expect(saved?.relationshipType).toBe('ally');
      expect(getAllChronicleRelationships()).toHaveLength(1);
    });

    it('updates an existing relationship by id', () => {
      const r = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      saveChronicleRelationship({ ...r, relationshipType: 'enemy' });
      const all = getAllChronicleRelationships();
      expect(all).toHaveLength(1);
      expect(all[0].relationshipType).toBe('enemy');
    });

    it('returns null and writes nothing when source/target/chronicleId is blank', () => {
      expect(saveChronicleRelationship(makeRel('c1', '', 'b'))).toBeNull();
      expect(saveChronicleRelationship(makeRel('c1', 'a', ''))).toBeNull();
      expect(saveChronicleRelationship(makeRel('', 'a', 'b'))).toBeNull();
      expect(getAllChronicleRelationships()).toEqual([]);
    });

    it('coerces invalid type / status on save', () => {
      const saved = saveChronicleRelationship(makeRel('c1', 'a', 'b', {
        relationshipType: 'bogus' as unknown as ChronicleRelationship['relationshipType'],
        status: 'whatever' as unknown as ChronicleRelationship['status'],
      }));
      expect(saved?.relationshipType).toBe('other');
      expect(saved?.status).toBe('active');
    });

    it('refreshes updatedAt on save', async () => {
      const r = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      const before = r.updatedAt;
      await new Promise(res => setTimeout(res, 5));
      const after = saveChronicleRelationship({ ...r, description: 'edited' })!;
      expect(Date.parse(after.updatedAt)).toBeGreaterThanOrEqual(Date.parse(before));
    });
  });

  describe('updateChronicleRelationship', () => {
    it('returns null when id not found', () => {
      expect(updateChronicleRelationship('nope', { relationshipType: 'ally' })).toBeNull();
    });

    it('updates type, status, and description', () => {
      const r = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      const u = updateChronicleRelationship(r.id, {
        relationshipType: 'sire',
        status: 'secret',
        description: '  Embraced in 1923  ',
      });
      expect(u?.relationshipType).toBe('sire');
      expect(u?.status).toBe('secret');
      expect(u?.description).toBe('Embraced in 1923');
    });

    it('clears description when given empty string', () => {
      const r = saveChronicleRelationship(
        makeRel('c1', 'a', 'b', { description: 'foo' })
      )!;
      const u = updateChronicleRelationship(r.id, { description: '' });
      expect(u?.description).toBeUndefined();
    });

    it('ignores blank source/target updates (cannot clear)', () => {
      const r = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      const u = updateChronicleRelationship(r.id, {
        sourceCharacterId: '   ',
        targetCharacterId: '',
      });
      expect(u?.sourceCharacterId).toBe('a');
      expect(u?.targetCharacterId).toBe('b');
    });

    it('updates source/target when non-blank', () => {
      const r = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      const u = updateChronicleRelationship(r.id, {
        sourceCharacterId: 'X',
        targetCharacterId: 'Y',
      });
      expect(u?.sourceCharacterId).toBe('X');
      expect(u?.targetCharacterId).toBe('Y');
    });

    it('normalizes invalid type / status on update', () => {
      const r = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      const u = updateChronicleRelationship(r.id, {
        relationshipType: 'bogus' as unknown as ChronicleRelationship['relationshipType'],
        status: 'whatever' as unknown as ChronicleRelationship['status'],
      });
      expect(u?.relationshipType).toBe('other');
      expect(u?.status).toBe('active');
    });
  });

  describe('deleteChronicleRelationship', () => {
    it('removes the relationship', () => {
      const r1 = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      const r2 = saveChronicleRelationship(makeRel('c1', 'b', 'c'))!;
      deleteChronicleRelationship(r1.id);
      const remaining = getAllChronicleRelationships();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(r2.id);
    });

    it('is a safe no-op for an unknown id', () => {
      saveChronicleRelationship(makeRel('c1', 'a', 'b'));
      deleteChronicleRelationship('does-not-exist');
      expect(getAllChronicleRelationships()).toHaveLength(1);
    });
  });

  describe('deleteChronicleRelationshipsForChronicle', () => {
    it('removes only relationships for the target chronicle and returns count', () => {
      saveChronicleRelationship(makeRel('c1', 'a', 'b'));
      saveChronicleRelationship(makeRel('c1', 'b', 'c'));
      saveChronicleRelationship(makeRel('c2', 'd', 'e'));

      const removed = deleteChronicleRelationshipsForChronicle('c1');
      expect(removed).toBe(2);

      const remaining = getAllChronicleRelationships();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].chronicleId).toBe('c2');
    });

    it('returns 0 and writes nothing for an empty chronicleId', () => {
      saveChronicleRelationship(makeRel('c1', 'a', 'b'));
      expect(deleteChronicleRelationshipsForChronicle('')).toBe(0);
      expect(getAllChronicleRelationships()).toHaveLength(1);
    });
  });

  describe('getChronicleRelationshipById', () => {
    it('finds an existing relationship', () => {
      const r = saveChronicleRelationship(makeRel('c1', 'a', 'b'))!;
      expect(getChronicleRelationshipById(r.id)?.sourceCharacterId).toBe('a');
    });

    it('returns undefined for unknown id', () => {
      expect(getChronicleRelationshipById('nope')).toBeUndefined();
    });
  });

  describe('clearChronicleRelationshipStorage', () => {
    it('wipes everything', () => {
      saveChronicleRelationship(makeRel('c1', 'a', 'b'));
      saveChronicleRelationship(makeRel('c2', 'c', 'd'));
      clearChronicleRelationshipStorage();
      expect(getAllChronicleRelationships()).toEqual([]);
    });
  });

  describe('round-trip durability', () => {
    it('survives a save → read cycle without information loss', () => {
      const seed = makeRel('c1', 'pc1', 'npc7', {
        relationshipType: 'sire',
        status: 'secret',
        description: 'Embraced her in 1923 to keep a Tremere secret.',
      });
      saveChronicleRelationship(seed);

      const [r] = getChronicleRelationships('c1');
      expect(r.sourceCharacterId).toBe('pc1');
      expect(r.targetCharacterId).toBe('npc7');
      expect(r.relationshipType).toBe('sire');
      expect(r.status).toBe('secret');
      expect(r.description).toBe('Embraced her in 1923 to keep a Tremere secret.');
    });
  });
});
