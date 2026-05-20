import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildAppBackup,
  validateAppBackup,
  importAppBackup,
  isAppBackupV2,
  APP_BACKUP_VERSION,
  type AppBackup,
} from '../appBackup';
import { getCharacters } from '../characterStorage';
import { getChronicles } from '../chronicleStorage';
import { getChronicleSessions } from '../chronicleSessionStorage';
import { getChronicleLocations } from '../chronicleLocationStorage';
import { getChronicleRelationships } from '../chronicleRelationshipStorage';

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

  // End-to-end import of a backup that contains EVERY dependent type at
  // once, then resolves names exactly as the chronicle UI does (via the
  // storage getters that the page calls, not by reading raw JSON). This
  // locks in the scenario reported in the field: characters appearing as
  // "Unknown character" in session chips, location chips, and relationship
  // endpoints after a full-backup import.
  it('resolves every character reference on the imported chronicle end-to-end', () => {
    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 2, chronicles: 1, chronicleSessions: 1, chronicleLocations: 1, chronicleRelationships: 1 },
      characters: [
        { id: 'old-pc', name: 'Alice', clan: 'brujah', edition: 'V5', chronicleId: 'old-chr', createdAt: 't', updatedAt: 't' },
        { id: 'old-npc', name: 'Bob NPC', clan: 'gangrel', edition: 'V5', chronicleId: 'old-chr', characterType: 'npc', createdAt: 't', updatedAt: 't' },
      ],
      chronicles: [{ id: 'old-chr', name: 'My Chronicle', status: 'active', createdAt: 't', updatedAt: 't' }],
      chronicleSessions: [
        { id: 'old-s', chronicleId: 'old-chr', title: 'Session 1', taggedCharacterIds: ['old-pc', 'old-npc'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleLocations: [
        { id: 'old-l', chronicleId: 'old-chr', name: 'The Haven', category: 'haven', linkedCharacterIds: ['old-pc'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleRelationships: [
        { id: 'old-r', chronicleId: 'old-chr', sourceCharacterId: 'old-pc', targetCharacterId: 'old-npc', relationshipType: 'ally', status: 'active', createdAt: 't', updatedAt: 't' },
      ],
    };

    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);

    // Read back through the same storage helpers the UI calls.
    const chronicles = getChronicles();
    expect(chronicles.length).toBe(1);
    const newChrId = chronicles[0].id;

    const characters = getCharacters();
    const characterById = new Map(characters.map(c => [c.id, c]));

    // 1. character.chronicleId points to the new chronicle id.
    const alice = characters.find(c => c.name === 'Alice');
    const bob = characters.find(c => c.name === 'Bob NPC');
    expect(alice?.chronicleId).toBe(newChrId);
    expect(bob?.chronicleId).toBe(newChrId);

    // 2. Sessions: tagged ids resolve to imported character records.
    const sessions = getChronicleSessions(newChrId);
    expect(sessions.length).toBe(1);
    const taggedNames = sessions[0].taggedCharacterIds.map(id => characterById.get(id)?.name);
    expect(taggedNames).toEqual(expect.arrayContaining(['Alice', 'Bob NPC']));
    expect(taggedNames).not.toContain(undefined);

    // 3. Locations: linked ids resolve to imported character records.
    const locations = getChronicleLocations(newChrId);
    expect(locations.length).toBe(1);
    const linkedNames = locations[0].linkedCharacterIds.map(id => characterById.get(id)?.name);
    expect(linkedNames).toEqual(['Alice']);
    expect(linkedNames).not.toContain(undefined);

    // 4. Relationships: source/target resolve to imported character records.
    const relationships = getChronicleRelationships(newChrId);
    expect(relationships.length).toBe(1);
    const src = characterById.get(relationships[0].sourceCharacterId);
    const tgt = characterById.get(relationships[0].targetCharacterId);
    expect(src?.name).toBe('Alice');
    expect(tgt?.name).toBe('Bob NPC');
  });

  // Multi-chronicle scenario with a name collision against an existing local
  // character, AND a session that tags a character from a DIFFERENT chronicle
  // (cross-chronicle reference). All names must still resolve.
  it('resolves cross-chronicle references and name collisions end-to-end', () => {
    // Seed an existing local Alice so the imported Alice triggers a rename.
    seedExisting([
      { id: 'local-alice', name: 'Alice', clan: 'brujah', edition: 'V5', createdAt: 'a', updatedAt: 'a' },
    ]);

    const incoming: AppBackup = {
      _vtmAppBackup: true,
      app: 'vtm-companion',
      backupVersion: 2,
      createdAt: 'b',
      counts: { characters: 3, chronicles: 2, chronicleSessions: 2, chronicleLocations: 2, chronicleRelationships: 1 },
      characters: [
        { id: 'old-pc', name: 'Alice', clan: 'brujah', edition: 'V5', chronicleId: 'old-chr-A', createdAt: 't', updatedAt: 't' },
        { id: 'old-npc', name: 'Bob NPC', clan: 'gangrel', edition: 'V5', chronicleId: 'old-chr-A', characterType: 'npc', createdAt: 't', updatedAt: 't' },
        { id: 'old-other', name: 'Wanderer', clan: 'toreador', edition: 'V5', chronicleId: 'old-chr-B', createdAt: 't', updatedAt: 't' },
      ],
      chronicles: [
        { id: 'old-chr-A', name: 'Chronicle A', status: 'active', createdAt: 't', updatedAt: 't' },
        { id: 'old-chr-B', name: 'Chronicle B', status: 'active', createdAt: 't', updatedAt: 't' },
      ],
      chronicleSessions: [
        // Cross-chronicle: chronicle A session tags a wanderer who belongs to chronicle B.
        { id: 'old-sA', chronicleId: 'old-chr-A', title: 'Crossover', taggedCharacterIds: ['old-pc', 'old-other'], createdAt: 't', updatedAt: 't' },
        { id: 'old-sB', chronicleId: 'old-chr-B', title: 'Solo', taggedCharacterIds: ['old-other'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleLocations: [
        { id: 'old-lA', chronicleId: 'old-chr-A', name: 'Bar', category: 'haven', linkedCharacterIds: ['old-npc'], createdAt: 't', updatedAt: 't' },
        { id: 'old-lB', chronicleId: 'old-chr-B', name: 'Road', category: 'other', linkedCharacterIds: ['old-other'], createdAt: 't', updatedAt: 't' },
      ],
      chronicleRelationships: [
        { id: 'old-r', chronicleId: 'old-chr-A', sourceCharacterId: 'old-pc', targetCharacterId: 'old-npc', relationshipType: 'ally', status: 'active', createdAt: 't', updatedAt: 't' },
      ],
    };

    const result = importAppBackup(incoming);
    if (typeof result === 'string') throw new Error(result);
    expect(result.renamedCharacters).toBe(1); // imported Alice collided with local Alice.

    const chronicles = getChronicles();
    expect(chronicles.length).toBe(2); // 0 existing chronicles + 2 imported
    const newChrA = chronicles.find(c => c.name === 'Chronicle A')?.id;
    const newChrB = chronicles.find(c => c.name === 'Chronicle B')?.id;
    expect(newChrA).toBeDefined();
    expect(newChrB).toBeDefined();

    const characters = getCharacters();
    expect(characters.length).toBe(4); // 1 existing + 3 imported
    const byId = new Map(characters.map(c => [c.id, c]));
    const importedAlice = characters.find(c => c.name === 'Alice Imported');
    const bob = characters.find(c => c.name === 'Bob NPC');
    const wanderer = characters.find(c => c.name === 'Wanderer');
    expect(importedAlice?.chronicleId).toBe(newChrA);
    expect(bob?.chronicleId).toBe(newChrA);
    expect(wanderer?.chronicleId).toBe(newChrB);

    // Cross-chronicle session: tags Alice (in A) and Wanderer (lives in B).
    const sessionsA = getChronicleSessions(newChrA!);
    expect(sessionsA.length).toBe(1);
    const tagsA = sessionsA[0].taggedCharacterIds.map(id => byId.get(id)?.name);
    expect(tagsA.sort()).toEqual(['Alice Imported', 'Wanderer']);

    const sessionsB = getChronicleSessions(newChrB!);
    expect(sessionsB[0].taggedCharacterIds.map(id => byId.get(id)?.name)).toEqual(['Wanderer']);

    const locsA = getChronicleLocations(newChrA!);
    expect(locsA[0].linkedCharacterIds.map(id => byId.get(id)?.name)).toEqual(['Bob NPC']);

    const locsB = getChronicleLocations(newChrB!);
    expect(locsB[0].linkedCharacterIds.map(id => byId.get(id)?.name)).toEqual(['Wanderer']);

    const relsA = getChronicleRelationships(newChrA!);
    expect(byId.get(relsA[0].sourceCharacterId)?.name).toBe('Alice Imported');
    expect(byId.get(relsA[0].targetCharacterId)?.name).toBe('Bob NPC');

    // Original local Alice is untouched.
    expect(characters.find(c => c.id === 'local-alice')?.name).toBe('Alice');
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
