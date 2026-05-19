import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildAppBackup,
  validateAppBackup,
  importAppBackup,
  isAppBackupV2,
  APP_BACKUP_VERSION,
  type AppBackup,
} from '../appBackup';

// Tests run against the same localStorage mock the other storage tests use;
// vitest already provides a jsdom environment, but we reset explicitly to
// avoid order-dependent state.
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
  key(i: number) { return Object.keys(this.store)[i] ?? null; }
  get length() { return Object.keys(this.store).length; }
}

const localStorageMock = new LocalStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
});

function seedExisting(
  characters: any[] = [],
  chronicles: any[] = [],
  sessions: any[] = [],
  locations: any[] = [],
  relationships: any[] = [],
) {
  localStorage.setItem('vtm-characters', JSON.stringify(characters));
  localStorage.setItem('vtm-chronicles', JSON.stringify(chronicles));
  localStorage.setItem('vtm-chronicle-sessions', JSON.stringify(sessions));
  localStorage.setItem('vtm-chronicle-locations', JSON.stringify(locations));
  localStorage.setItem('vtm-chronicle-relationships', JSON.stringify(relationships));
}

describe('buildAppBackup', () => {
  it('returns an empty envelope when all storage is empty', () => {
    const b = buildAppBackup();
    expect(b._vtmAppBackup).toBe(true);
    expect(b.app).toBe('vtm-companion');
    expect(b.backupVersion).toBe(APP_BACKUP_VERSION);
    expect(b.counts).toEqual({
      characters: 0,
      chronicles: 0,
      chronicleSessions: 0,
      chronicleLocations: 0,
      chronicleRelationships: 0,
    });
    expect(b.characters).toEqual([]);
    expect(b.chronicles).toEqual([]);
    expect(b.chronicleSessions).toEqual([]);
    expect(b.chronicleLocations).toEqual([]);
    expect(b.chronicleRelationships).toEqual([]);
  });

  it('counts and snapshots every data type that is present', () => {
    seedExisting(
      [{ id: 'c1', name: 'Alice', clan: 'brujah', edition: 'V5', createdAt: 't', updatedAt: 't' }],
      [{ id: 'chr1', name: 'My Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      [{ id: 's1', chronicleId: 'chr1', title: 'Session 1', createdAt: 't', updatedAt: 't' }],
      [{ id: 'l1', chronicleId: 'chr1', name: 'Bar', createdAt: 't', updatedAt: 't' }],
      [{ id: 'r1', chronicleId: 'chr1', sourceCharacterId: 'pc1', targetCharacterId: 'npc1', relationshipType: 'ally', status: 'active', createdAt: 't', updatedAt: 't' }],
    );
    const b = buildAppBackup();
    expect(b.counts).toEqual({
      characters: 1,
      chronicles: 1,
      chronicleSessions: 1,
      chronicleLocations: 1,
      chronicleRelationships: 1,
    });
    expect(b.characters[0].name).toBe('Alice');
    expect(b.chronicles[0].name).toBe('My Chronicle');
  });
});

describe('isAppBackupV2 + validateAppBackup', () => {
  it('rejects non-objects, junk, and v1 character backups', () => {
    expect(isAppBackupV2(null)).toBe(false);
    expect(isAppBackupV2('hi')).toBe(false);
    expect(isAppBackupV2({})).toBe(false);
    expect(isAppBackupV2({ _vtmBackup: true, backupVersion: 1 })).toBe(false);
    expect(validateAppBackup(null)).toMatch(/JSON object/);
    expect(validateAppBackup({ _vtmAppBackup: true })).toMatch(/backup version/);
    expect(validateAppBackup({
      _vtmAppBackup: true, backupVersion: 2, characters: 'nope',
      chronicles: [], chronicleSessions: [], chronicleLocations: [], chronicleRelationships: [],
    })).toMatch(/characters/);
  });

  it('accepts a minimal valid envelope', () => {
    const env: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: new Date().toISOString(),
      counts: { characters: 0, chronicles: 0, chronicleSessions: 0, chronicleLocations: 0, chronicleRelationships: 0 },
      characters: [], chronicles: [], chronicleSessions: [], chronicleLocations: [], chronicleRelationships: [],
    };
    expect(isAppBackupV2(env)).toBe(true);
    expect(validateAppBackup(env)).toBeNull();
  });
});

describe('importAppBackup', () => {
  it('returns the validation error string when the file is invalid', () => {
    const result = importAppBackup({ totally: 'wrong' });
    expect(typeof result).toBe('string');
  });

  it('imports additively (never destroys existing local data)', () => {
    const existingChar = {
      id: 'existing-1', name: 'Existing Alice', clan: 'brujah', edition: 'V5',
      createdAt: 'a', updatedAt: 'a',
    };
    const existingChronicle = {
      id: 'existing-chr', name: 'Existing Chronicle', status: 'active', createdAt: 'a', updatedAt: 'a',
    };
    seedExisting([existingChar], [existingChronicle]);

    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 1, chronicles: 1, chronicleSessions: 0, chronicleLocations: 0, chronicleRelationships: 0 },
      characters: [{ id: 'old-bob', name: 'Bob', clan: 'gangrel', edition: 'V5', createdAt: 't', updatedAt: 't' }],
      chronicles: [{ id: 'old-chr', name: 'Imported Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [], chronicleLocations: [], chronicleRelationships: [],
    };
    const result = importAppBackup(incoming);
    expect(typeof result).not.toBe('string');
    if (typeof result === 'string') return;

    expect(result.importedCounts.characters).toBe(1);
    expect(result.importedCounts.chronicles).toBe(1);

    const charsAfter = JSON.parse(localStorage.getItem('vtm-characters') ?? '[]');
    const chrsAfter = JSON.parse(localStorage.getItem('vtm-chronicles') ?? '[]');
    expect(charsAfter.length).toBe(2);
    expect(chrsAfter.length).toBe(2);
    // The original record is still present with its original id and name.
    expect(charsAfter.some((c: any) => c.id === 'existing-1' && c.name === 'Existing Alice')).toBe(true);
    expect(chrsAfter.some((c: any) => c.id === 'existing-chr' && c.name === 'Existing Chronicle')).toBe(true);
  });

  it('remaps chronicleId on imported sessions/locations/relationships', () => {
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 0, chronicles: 1, chronicleSessions: 1, chronicleLocations: 1, chronicleRelationships: 1 },
      characters: [],
      chronicles: [{ id: 'old-chr', name: 'Imported Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [{ id: 'old-s', chronicleId: 'old-chr', title: 'S', createdAt: 't', updatedAt: 't' }],
      chronicleLocations: [{ id: 'old-l', chronicleId: 'old-chr', name: 'L', createdAt: 't', updatedAt: 't' }],
      chronicleRelationships: [{ id: 'old-r', chronicleId: 'old-chr', sourceCharacterId: 'pc1', targetCharacterId: 'npc1', relationshipType: 'ally', status: 'active', createdAt: 't', updatedAt: 't' }],
    };

    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);

    const chrs = JSON.parse(localStorage.getItem('vtm-chronicles') ?? '[]');
    const sessions = JSON.parse(localStorage.getItem('vtm-chronicle-sessions') ?? '[]');
    const locs = JSON.parse(localStorage.getItem('vtm-chronicle-locations') ?? '[]');
    const rels = JSON.parse(localStorage.getItem('vtm-chronicle-relationships') ?? '[]');

    expect(chrs.length).toBe(1);
    const newChrId = chrs[0].id;
    expect(newChrId).not.toBe('old-chr');
    expect(sessions[0]?.chronicleId).toBe(newChrId);
    expect(locs[0]?.chronicleId).toBe(newChrId);
    expect(rels[0]?.chronicleId).toBe(newChrId);
  });

  it('rewrites character.chronicleId when the chronicle was also in the backup', () => {
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 1, chronicles: 1, chronicleSessions: 0, chronicleLocations: 0, chronicleRelationships: 0 },
      characters: [
        { id: 'old-c', name: 'Bob', clan: 'gangrel', edition: 'V5', chronicleId: 'old-chr', createdAt: 't', updatedAt: 't' },
      ],
      chronicles: [{ id: 'old-chr', name: 'Imported Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [], chronicleLocations: [], chronicleRelationships: [],
    };
    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);

    const chars = JSON.parse(localStorage.getItem('vtm-characters') ?? '[]');
    const chrs = JSON.parse(localStorage.getItem('vtm-chronicles') ?? '[]');
    expect(chars[0].chronicleId).toBe(chrs[0].id);
    expect(chars[0].chronicleId).not.toBe('old-chr');
  });

  it('drops session/location/relationship rows whose chronicleId is not in the backup', () => {
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 0, chronicles: 0, chronicleSessions: 1, chronicleLocations: 0, chronicleRelationships: 0 },
      characters: [],
      chronicles: [],
      chronicleSessions: [{ id: 'orphan', chronicleId: 'missing-chr', title: 'Orphan', createdAt: 't', updatedAt: 't' }],
      chronicleLocations: [],
      chronicleRelationships: [],
    };
    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);
    expect(result.importedCounts.chronicleSessions).toBe(0);
    const sessions = JSON.parse(localStorage.getItem('vtm-chronicle-sessions') ?? '[]');
    expect(sessions.length).toBe(0);
  });

  // ---- characterId remapping ----
  // The bug fixed in this checkpoint: sessions / locations / relationships
  // referenced characters by old ids, which became "Unknown character"
  // after import. These tests lock in the fix.

  it('remaps session.taggedCharacterIds to the new character ids', () => {
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 2, chronicles: 1, chronicleSessions: 1, chronicleLocations: 0, chronicleRelationships: 0 },
      characters: [
        { id: 'old-pc', name: 'Alice', clan: 'brujah', edition: 'V5', createdAt: 't', updatedAt: 't' },
        { id: 'old-npc', name: 'Bob NPC', clan: 'gangrel', edition: 'V5', createdAt: 't', updatedAt: 't' },
      ],
      chronicles: [{ id: 'old-chr', name: 'My Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [
        { id: 'old-s', chronicleId: 'old-chr', title: 'S1', taggedCharacterIds: ['old-pc', 'old-npc'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleLocations: [],
      chronicleRelationships: [],
    };
    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);

    const chars = JSON.parse(localStorage.getItem('vtm-characters') ?? '[]');
    const sessions = JSON.parse(localStorage.getItem('vtm-chronicle-sessions') ?? '[]');
    const aliceId = chars.find((c: any) => c.name === 'Alice')?.id;
    const bobId = chars.find((c: any) => c.name === 'Bob NPC')?.id;
    expect(aliceId).toBeDefined();
    expect(bobId).toBeDefined();
    expect(sessions[0].taggedCharacterIds).toEqual(expect.arrayContaining([aliceId, bobId]));
    expect(sessions[0].taggedCharacterIds).not.toContain('old-pc');
    expect(sessions[0].taggedCharacterIds).not.toContain('old-npc');
  });

  it('remaps location.linkedCharacterIds to the new character ids', () => {
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 1, chronicles: 1, chronicleSessions: 0, chronicleLocations: 1, chronicleRelationships: 0 },
      characters: [
        { id: 'old-pc', name: 'Alice', clan: 'brujah', edition: 'V5', createdAt: 't', updatedAt: 't' },
      ],
      chronicles: [{ id: 'old-chr', name: 'My Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [],
      chronicleLocations: [
        { id: 'old-l', chronicleId: 'old-chr', name: 'Haven', category: 'haven', linkedCharacterIds: ['old-pc'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleRelationships: [],
    };
    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);

    const chars = JSON.parse(localStorage.getItem('vtm-characters') ?? '[]');
    const locs = JSON.parse(localStorage.getItem('vtm-chronicle-locations') ?? '[]');
    const aliceId = chars.find((c: any) => c.name === 'Alice')?.id;
    expect(aliceId).toBeDefined();
    expect(locs[0].linkedCharacterIds).toEqual([aliceId]);
    expect(locs[0].linkedCharacterIds).not.toContain('old-pc');
  });

  it('remaps relationship source/target to the new character ids', () => {
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 2, chronicles: 1, chronicleSessions: 0, chronicleLocations: 0, chronicleRelationships: 1 },
      characters: [
        { id: 'old-pc', name: 'Alice', clan: 'brujah', edition: 'V5', createdAt: 't', updatedAt: 't' },
        { id: 'old-npc', name: 'Bob NPC', clan: 'gangrel', edition: 'V5', createdAt: 't', updatedAt: 't' },
      ],
      chronicles: [{ id: 'old-chr', name: 'My Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [],
      chronicleLocations: [],
      chronicleRelationships: [
        { id: 'old-r', chronicleId: 'old-chr', sourceCharacterId: 'old-pc', targetCharacterId: 'old-npc', relationshipType: 'ally', status: 'active', createdAt: 't', updatedAt: 't' },
      ],
    };
    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);

    const chars = JSON.parse(localStorage.getItem('vtm-characters') ?? '[]');
    const rels = JSON.parse(localStorage.getItem('vtm-chronicle-relationships') ?? '[]');
    const aliceId = chars.find((c: any) => c.name === 'Alice')?.id;
    const bobId = chars.find((c: any) => c.name === 'Bob NPC')?.id;
    expect(rels[0].sourceCharacterId).toBe(aliceId);
    expect(rels[0].targetCharacterId).toBe(bobId);
    expect(rels[0].sourceCharacterId).not.toBe('old-pc');
    expect(rels[0].targetCharacterId).not.toBe('old-npc');
  });

  it('preserves unknown character ids on dependent rows (current safe behavior)', () => {
    // When a session/location references a character that is NOT in the
    // backup, the old id is preserved so it can still match a character
    // that already exists locally. The relationship row, in contrast,
    // requires both source and target — but those references too keep
    // their original id if it wasn't in the backup.
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 0, chronicles: 1, chronicleSessions: 1, chronicleLocations: 1, chronicleRelationships: 0 },
      characters: [],
      chronicles: [{ id: 'old-chr', name: 'My Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [
        { id: 'old-s', chronicleId: 'old-chr', title: 'S', taggedCharacterIds: ['external-char-id'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleLocations: [
        { id: 'old-l', chronicleId: 'old-chr', name: 'L', category: 'haven', linkedCharacterIds: ['external-char-id'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleRelationships: [],
    };
    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);

    const sessions = JSON.parse(localStorage.getItem('vtm-chronicle-sessions') ?? '[]');
    const locs = JSON.parse(localStorage.getItem('vtm-chronicle-locations') ?? '[]');
    expect(sessions[0].taggedCharacterIds).toEqual(['external-char-id']);
    expect(locs[0].linkedCharacterIds).toEqual(['external-char-id']);
  });
});
