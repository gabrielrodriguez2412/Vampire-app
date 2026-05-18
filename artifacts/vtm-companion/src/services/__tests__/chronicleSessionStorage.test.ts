import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllChronicleSessions,
  getChronicleSessions,
  getChronicleSessionById,
  saveChronicleSession,
  createEmptyChronicleSession,
  updateChronicleSession,
  deleteChronicleSession,
  deleteChronicleSessionsForChronicle,
  clearChronicleSessionStorage,
} from '../chronicleSessionStorage';
import { ChronicleSession } from '../../types';

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

const KEY = 'vtm-chronicle-sessions';

describe('chronicleSessionStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getAllChronicleSessions', () => {
    it('returns empty array when storage is empty', () => {
      expect(getAllChronicleSessions()).toEqual([]);
    });

    it('returns empty array when storage holds non-array JSON', () => {
      localStorageMock.setItem(KEY, JSON.stringify({ x: 1 }));
      expect(getAllChronicleSessions()).toEqual([]);
    });

    it('returns empty array when storage holds malformed JSON', () => {
      localStorageMock.setItem(KEY, '{not json');
      expect(getAllChronicleSessions()).toEqual([]);
    });

    it('drops entries with no usable chronicleId (would be orphans)', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { id: 's1', title: 'No chronicle' },
        { id: 's2', chronicleId: '', title: 'Blank' },
        { id: 's3', chronicleId: 'c1', title: 'Good' },
      ]));
      const sessions = getAllChronicleSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].title).toBe('Good');
    });

    it('fills in defaults for missing optional fields', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1' }, // no id, title, timestamps, tags
      ]));
      const [s] = getAllChronicleSessions();
      expect(s.id).toBeTruthy();
      expect(s.title).toBe('Untitled Session');
      expect(s.taggedCharacterIds).toEqual([]);
      expect(s.createdAt).toBeTruthy();
      expect(s.updatedAt).toBeTruthy();
      expect(s.summary).toBeUndefined();
      expect(s.sessionDate).toBeUndefined();
    });

    it('filters non-string entries out of taggedCharacterIds', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', title: 'T', taggedCharacterIds: ['a', null, 42, '', 'b'] },
      ]));
      const [s] = getAllChronicleSessions();
      expect(s.taggedCharacterIds).toEqual(['a', 'b']);
    });

    it('coerces taggedCharacterIds to [] when not an array', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', title: 'T', taggedCharacterIds: 'oops' },
      ]));
      const [s] = getAllChronicleSessions();
      expect(s.taggedCharacterIds).toEqual([]);
    });

    it('drops blank optional summary and sessionDate', () => {
      localStorageMock.setItem(KEY, JSON.stringify([
        { chronicleId: 'c1', title: 'T', summary: '   ', sessionDate: '' },
      ]));
      const [s] = getAllChronicleSessions();
      expect(s.summary).toBeUndefined();
      expect(s.sessionDate).toBeUndefined();
    });
  });

  describe('getChronicleSessions', () => {
    it('returns [] for empty/missing chronicleId', () => {
      expect(getChronicleSessions('')).toEqual([]);
    });

    it('returns only sessions for the given chronicle', () => {
      saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'A' });
      saveChronicleSession({ ...createEmptyChronicleSession('c2'), title: 'B' });
      saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'C' });

      const a = getChronicleSessions('c1').map(s => s.title).sort();
      const b = getChronicleSessions('c2').map(s => s.title);
      expect(a).toEqual(['A', 'C']);
      expect(b).toEqual(['B']);
    });

    it('sorts sessions newest-first by sessionDate, dateless last by updatedAt', () => {
      const base = createEmptyChronicleSession('c1');
      saveChronicleSession({ ...base, id: 'a', title: 'Old', sessionDate: '2024-01-01' });
      saveChronicleSession({ ...base, id: 'b', title: 'New', sessionDate: '2025-06-01' });
      saveChronicleSession({ ...base, id: 'c', title: 'Mid', sessionDate: '2024-12-25' });
      saveChronicleSession({ ...base, id: 'd', title: 'NoDate' });

      const titles = getChronicleSessions('c1').map(s => s.title);
      expect(titles.slice(0, 3)).toEqual(['New', 'Mid', 'Old']);
      expect(titles[3]).toBe('NoDate');
    });
  });

  describe('createEmptyChronicleSession', () => {
    it('builds a session with fresh id, timestamps, empty tags', () => {
      const s = createEmptyChronicleSession('c1');
      expect(s.id).toBeTruthy();
      expect(s.chronicleId).toBe('c1');
      expect(s.taggedCharacterIds).toEqual([]);
      expect(s.title).toBeTruthy();
      expect(s.createdAt).toBeTruthy();
      expect(s.updatedAt).toBeTruthy();
    });

    it('does NOT persist by itself', () => {
      createEmptyChronicleSession('c1');
      expect(getAllChronicleSessions()).toEqual([]);
    });
  });

  describe('saveChronicleSession', () => {
    it('inserts a new session', () => {
      const s = saveChronicleSession({
        ...createEmptyChronicleSession('c1'),
        title: 'First',
      });
      expect(s.title).toBe('First');
      expect(getAllChronicleSessions()).toHaveLength(1);
    });

    it('updates an existing session by id', () => {
      const s = saveChronicleSession({
        ...createEmptyChronicleSession('c1'),
        title: 'First',
      });
      saveChronicleSession({ ...s, title: 'Renamed' });
      const all = getAllChronicleSessions();
      expect(all).toHaveLength(1);
      expect(all[0].title).toBe('Renamed');
    });

    it('refreshes updatedAt on save', async () => {
      const s = saveChronicleSession({
        ...createEmptyChronicleSession('c1'),
        title: 'First',
      });
      const before = s.updatedAt;
      await new Promise(r => setTimeout(r, 5));
      const after = saveChronicleSession({ ...s, summary: 'edited' });
      expect(Date.parse(after.updatedAt)).toBeGreaterThanOrEqual(Date.parse(before));
    });

    it('coerces blank title to "Untitled Session" on save', () => {
      const s = saveChronicleSession({
        ...createEmptyChronicleSession('c1'),
        title: '   ',
      });
      expect(s.title).toBe('Untitled Session');
    });

    it('filters non-string taggedCharacterIds on save', () => {
      const base = createEmptyChronicleSession('c1');
      const s = saveChronicleSession({
        ...base,
        taggedCharacterIds: ['a', '', null as unknown as string, 'b'],
      });
      expect(s.taggedCharacterIds).toEqual(['a', 'b']);
    });
  });

  describe('updateChronicleSession', () => {
    it('returns null when id not found', () => {
      expect(updateChronicleSession('nope', { title: 'x' })).toBeNull();
    });

    it('updates title but ignores blank', () => {
      const s = saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'Orig' });
      const u = updateChronicleSession(s.id, { title: '  Renamed ' });
      expect(u?.title).toBe('Renamed');
      const blank = updateChronicleSession(s.id, { title: '   ' });
      expect(blank?.title).toBe('Renamed');
    });

    it('clears optional summary/sessionDate when given empty string', () => {
      const s = saveChronicleSession({
        ...createEmptyChronicleSession('c1'),
        title: 'T',
        summary: 'something',
        sessionDate: '2024-05-01',
      });
      const u = updateChronicleSession(s.id, { summary: '', sessionDate: '' });
      expect(u?.summary).toBeUndefined();
      expect(u?.sessionDate).toBeUndefined();
    });

    it('replaces taggedCharacterIds wholesale and filters non-strings', () => {
      const s = saveChronicleSession({
        ...createEmptyChronicleSession('c1'),
        title: 'T',
        taggedCharacterIds: ['a', 'b'],
      });
      const u = updateChronicleSession(s.id, {
        taggedCharacterIds: ['c', '', null as unknown as string, 'd'],
      });
      expect(u?.taggedCharacterIds).toEqual(['c', 'd']);
    });
  });

  describe('deleteChronicleSession', () => {
    it('removes the session', () => {
      const s1 = saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'a' });
      const s2 = saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'b' });
      deleteChronicleSession(s1.id);
      const remaining = getAllChronicleSessions();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(s2.id);
    });

    it('is a safe no-op for an unknown id', () => {
      saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'a' });
      deleteChronicleSession('does-not-exist');
      expect(getAllChronicleSessions()).toHaveLength(1);
    });
  });

  describe('deleteChronicleSessionsForChronicle', () => {
    it('removes only sessions for the target chronicle and returns count', () => {
      saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'a' });
      saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'b' });
      saveChronicleSession({ ...createEmptyChronicleSession('c2'), title: 'c' });

      const removed = deleteChronicleSessionsForChronicle('c1');
      expect(removed).toBe(2);

      const remaining = getAllChronicleSessions();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].chronicleId).toBe('c2');
    });

    it('returns 0 and writes nothing for an empty chronicleId', () => {
      saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'a' });
      expect(deleteChronicleSessionsForChronicle('')).toBe(0);
      expect(getAllChronicleSessions()).toHaveLength(1);
    });
  });

  describe('getChronicleSessionById', () => {
    it('finds an existing session', () => {
      const s = saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'T' });
      expect(getChronicleSessionById(s.id)?.title).toBe('T');
    });

    it('returns undefined for unknown id', () => {
      expect(getChronicleSessionById('nope')).toBeUndefined();
    });
  });

  describe('clearChronicleSessionStorage', () => {
    it('wipes everything', () => {
      saveChronicleSession({ ...createEmptyChronicleSession('c1'), title: 'a' });
      saveChronicleSession({ ...createEmptyChronicleSession('c2'), title: 'b' });
      clearChronicleSessionStorage();
      expect(getAllChronicleSessions()).toEqual([]);
    });
  });

  describe('round-trip durability', () => {
    it('survives a save → read cycle without information loss', () => {
      const seed: ChronicleSession = {
        ...createEmptyChronicleSession('c1'),
        title: 'Session 1',
        summary: 'Things happened.',
        sessionDate: '2025-03-15',
        taggedCharacterIds: ['pc1', 'npc7'],
      };
      saveChronicleSession(seed);

      const [s] = getChronicleSessions('c1');
      expect(s.title).toBe('Session 1');
      expect(s.summary).toBe('Things happened.');
      expect(s.sessionDate).toBe('2025-03-15');
      expect(s.taggedCharacterIds).toEqual(['pc1', 'npc7']);
    });
  });
});
