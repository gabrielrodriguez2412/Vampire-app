/**
 * @vitest-environment jsdom
 *
 * Batch AE — single-chronicle JSON export.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildChronicleExport,
  CHRONICLE_EXPORT_VERSION,
  isChronicleExport,
  validateChronicleExport,
  importChronicleExport,
} from '../chronicleExport';
import { createEmptyChronicle, saveChronicle, getChronicles, getChronicleById } from '../chronicleStorage';
import {
  createEmptyChronicleSession, saveChronicleSession, getChronicleSessions,
} from '../chronicleSessionStorage';
import {
  createEmptyChronicleLocation, saveChronicleLocation, getChronicleLocations,
} from '../chronicleLocationStorage';
import {
  createEmptyChronicleRelationship, saveChronicleRelationship, getChronicleRelationships,
} from '../chronicleRelationshipStorage';
import { createEmptyCharacter, saveCharacter, setCharacterChronicle, getCharacters } from '../characterStorage';

// jsdom provides window.localStorage.
beforeEach(() => window.localStorage.clear());

function seedChronicleWithData() {
  const chronicle = saveChronicle(createEmptyChronicle('Berlin by Night', { setting: 'Berlin' }));
  saveChronicleSession(createEmptyChronicleSession(chronicle.id));
  saveChronicleLocation(createEmptyChronicleLocation(chronicle.id));
  // A character linked to this chronicle, plus an unrelated one.
  const linked = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Aria'));
  setCharacterChronicle(linked.id, chronicle.id);
  const other = saveCharacter(createEmptyCharacter('V5', 'tremere', 'Unrelated'));
  // A relationship needs valid source/target character ids to persist.
  saveChronicleRelationship({
    ...createEmptyChronicleRelationship(chronicle.id),
    sourceCharacterId: linked.id,
    targetCharacterId: other.id,
  });
  return { chronicle, linkedId: linked.id };
}

describe('buildChronicleExport', () => {
  it('returns null for an unknown chronicle id', () => {
    expect(buildChronicleExport('does-not-exist')).toBeNull();
  });

  it('produces a versioned envelope with the chronicle and its dependent rows', () => {
    const { chronicle } = seedChronicleWithData();
    const exp = buildChronicleExport(chronicle.id)!;

    expect(exp).not.toBeNull();
    expect(exp._vtmChronicleExport).toBe(true);
    expect(exp.exportVersion).toBe(CHRONICLE_EXPORT_VERSION);
    expect(typeof exp.exportedAt).toBe('string');

    // Chronicle metadata.
    expect(exp.chronicle.id).toBe(chronicle.id);
    expect(exp.chronicle.name).toBe('Berlin by Night');
    expect(exp.chronicle.setting).toBe('Berlin');

    // Dependent rows, all scoped to this chronicle.
    expect(exp.sessions).toHaveLength(1);
    expect(exp.locations).toHaveLength(1);
    expect(exp.relationships).toHaveLength(1);
    expect(exp.sessions[0].chronicleId).toBe(chronicle.id);
    expect(exp.locations[0].chronicleId).toBe(chronicle.id);
    expect(exp.relationships[0].chronicleId).toBe(chronicle.id);
  });

  it('includes only linked-character summaries (not full character objects)', () => {
    const { chronicle, linkedId } = seedChronicleWithData();
    const exp = buildChronicleExport(chronicle.id)!;

    expect(exp.linkedCharacters).toHaveLength(1);
    const summary = exp.linkedCharacters[0];
    expect(summary).toEqual({
      id: linkedId,
      name: 'Aria',
      clan: 'brujah',
      edition: 'V20',
      characterType: 'player',
    });
    // Summary shape only — no nested sheet data leaks in.
    expect(Object.keys(summary).sort()).toEqual(['characterType', 'clan', 'edition', 'id', 'name']);
  });

  it('excludes data from other chronicles', () => {
    const { chronicle } = seedChronicleWithData();
    // A second chronicle with its own session.
    const other = saveChronicle(createEmptyChronicle('Chicago'));
    saveChronicleSession(createEmptyChronicleSession(other.id));

    const exp = buildChronicleExport(chronicle.id)!;
    expect(exp.sessions).toHaveLength(1);
    expect(exp.sessions.every(s => s.chronicleId === chronicle.id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Batch AH — single chronicle import.
// ---------------------------------------------------------------------------

/** Build a valid chronicle export envelope from partial inputs. */
function makeChronicleEnvelope(opts: {
  chronicle?: Record<string, any>;
  sessions?: Record<string, any>[];
  locations?: Record<string, any>[];
  relationships?: Record<string, any>[];
  linkedCharacters?: Record<string, any>[];
} = {}) {
  return {
    _vtmChronicleExport: true,
    exportVersion: CHRONICLE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    chronicle: {
      id: crypto.randomUUID(),
      name: 'Imported Chronicle',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...opts.chronicle,
    },
    sessions: opts.sessions ?? [],
    locations: opts.locations ?? [],
    relationships: opts.relationships ?? [],
    linkedCharacters: opts.linkedCharacters ?? [],
  };
}

describe('isChronicleExport', () => {
  it('recognizes only the chronicle export discriminator', () => {
    expect(isChronicleExport({ _vtmChronicleExport: true })).toBe(true);
    expect(isChronicleExport({ _vtmExport: true })).toBe(false);
    expect(isChronicleExport({ _vtmCharacterBulkExport: true })).toBe(false);
    expect(isChronicleExport({ _vtmAppBackup: true })).toBe(false);
    expect(isChronicleExport(null)).toBe(false);
    expect(isChronicleExport('not an object')).toBe(false);
  });
});

describe('validateChronicleExport', () => {
  it('accepts a well-formed envelope', () => {
    expect(validateChronicleExport(makeChronicleEnvelope())).toBeNull();
  });

  it('rejects a wrong discriminator', () => {
    const env = makeChronicleEnvelope() as any;
    env._vtmChronicleExport = false;
    expect(validateChronicleExport(env))
      .toBe('Invalid file: not a VTM chronicle export.');
  });

  it('rejects an unsupported export version', () => {
    const env = makeChronicleEnvelope() as any;
    env.exportVersion = 99;
    expect(validateChronicleExport(env))
      .toBe('Invalid file: unsupported export version (99).');
  });

  it('rejects a missing chronicle object', () => {
    const env: any = { _vtmChronicleExport: true, exportVersion: 1 };
    expect(validateChronicleExport(env))
      .toBe('Invalid file: missing chronicle data.');
  });

  it('rejects a chronicle with no name', () => {
    const env = makeChronicleEnvelope() as any;
    env.chronicle.name = '   ';
    expect(validateChronicleExport(env))
      .toBe('Invalid file: chronicle has no name.');
  });

  it('rejects non-array dependent fields if present', () => {
    const env = makeChronicleEnvelope() as any;
    env.sessions = 'not an array';
    expect(validateChronicleExport(env))
      .toBe('Invalid file: sessions must be an array if present.');
  });
});

describe('importChronicleExport', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns the validation error for an invalid file', () => {
    expect(importChronicleExport({ _vtmExport: true }))
      .toBe('Invalid file: not a VTM chronicle export.');
  });

  it('imports the chronicle with a fresh ID (never reusing the source ID)', () => {
    const env = makeChronicleEnvelope();
    const sourceId = env.chronicle.id;
    const result = importChronicleExport(env);

    expect(typeof result).not.toBe('string');
    const { chronicleId } = result as any;
    expect(chronicleId).not.toBe(sourceId);

    const stored = getChronicles();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(chronicleId);
    expect(stored[0].name).toBe('Imported Chronicle');
  });

  it('does NOT overwrite an existing chronicle with the same source id', () => {
    const existing = saveChronicle(createEmptyChronicle('Survivor'));
    const env = makeChronicleEnvelope({
      chronicle: { id: existing.id, name: 'Intruder' },
    });

    const result = importChronicleExport(env);
    expect(typeof result).not.toBe('string');

    const stored = getChronicles();
    expect(stored).toHaveLength(2);

    // Existing chronicle untouched (same id, same name).
    const survivor = getChronicleById(existing.id)!;
    expect(survivor).toBeDefined();
    expect(survivor.name).toBe('Survivor');

    // Imported chronicle has a different id.
    const intruder = stored.find(c => c.name === 'Intruder')!;
    expect(intruder.id).not.toBe(existing.id);
  });

  it('remaps sessions and locations to the new chronicle id', () => {
    const sourceChrId = crypto.randomUUID();
    const env = makeChronicleEnvelope({
      chronicle: { id: sourceChrId },
      sessions: [{ id: 'old-session', chronicleId: sourceChrId, title: 'S1', summary: '' }],
      locations: [{ id: 'old-location', chronicleId: sourceChrId, name: 'L1' }],
    });

    const result = importChronicleExport(env) as any;
    expect(result.chronicleId).not.toBe(sourceChrId);
    expect(result.sessions).toBe(1);
    expect(result.locations).toBe(1);

    const sessions = getChronicleSessions(result.chronicleId);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].chronicleId).toBe(result.chronicleId);
    expect(sessions[0].id).not.toBe('old-session');

    const locations = getChronicleLocations(result.chronicleId);
    expect(locations).toHaveLength(1);
    expect(locations[0].chronicleId).toBe(result.chronicleId);
  });

  it('keeps relationships only when BOTH endpoints resolve locally; drops others', () => {
    const a = saveCharacter(createEmptyCharacter('V20', 'brujah', 'A'));
    const b = saveCharacter(createEmptyCharacter('V5', 'tremere', 'B'));

    const sourceChrId = crypto.randomUUID();
    const env = makeChronicleEnvelope({
      chronicle: { id: sourceChrId },
      relationships: [
        // both endpoints exist locally → kept
        {
          id: 'r1', chronicleId: sourceChrId,
          sourceCharacterId: a.id, targetCharacterId: b.id,
          relationshipType: 'other', status: 'active',
        },
        // unknown target → dropped
        {
          id: 'r2', chronicleId: sourceChrId,
          sourceCharacterId: a.id, targetCharacterId: 'unknown-char',
          relationshipType: 'other', status: 'active',
        },
        // missing endpoint → dropped
        {
          id: 'r3', chronicleId: sourceChrId,
          sourceCharacterId: '', targetCharacterId: '',
          relationshipType: 'other', status: 'active',
        },
      ],
    });

    const result = importChronicleExport(env) as any;
    expect(result.relationships).toBe(1);
    expect(result.relationshipsDropped).toBe(2);

    const rels = getChronicleRelationships(result.chronicleId);
    expect(rels).toHaveLength(1);
    expect(rels[0].sourceCharacterId).toBe(a.id);
    expect(rels[0].targetCharacterId).toBe(b.id);
    expect(rels[0].chronicleId).toBe(result.chronicleId);
  });

  it('filters unknown character refs out of sessions/locations (no broken tags)', () => {
    const known = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Known'));
    const sourceChrId = crypto.randomUUID();
    const env = makeChronicleEnvelope({
      chronicle: { id: sourceChrId },
      sessions: [{
        id: 's1', chronicleId: sourceChrId, title: 'S', summary: '',
        taggedCharacterIds: [known.id, 'unknown-1', 'unknown-2'],
      }],
      locations: [{
        id: 'l1', chronicleId: sourceChrId, name: 'L',
        linkedCharacterIds: ['unknown-x'],
      }],
    });

    const result = importChronicleExport(env) as any;
    expect(result.sessions).toBe(1);
    expect(result.locations).toBe(1);
    expect(result.characterRefsFiltered).toBe(2); // session + location

    const sessions = getChronicleSessions(result.chronicleId);
    expect(sessions[0].taggedCharacterIds).toEqual([known.id]);

    const locations = getChronicleLocations(result.chronicleId);
    expect(locations[0].linkedCharacterIds).toEqual([]);
  });

  it('does NOT auto-create characters from linkedCharacters summaries', () => {
    expect(getCharacters()).toHaveLength(0);

    const env = makeChronicleEnvelope({
      linkedCharacters: [
        { id: 'phantom-1', name: 'Phantom A', clan: 'brujah', edition: 'V20', characterType: 'player' },
        { id: 'phantom-2', name: 'Phantom B', clan: 'tremere', edition: 'V5', characterType: 'npc' },
      ],
    });
    const result = importChronicleExport(env);
    expect(typeof result).not.toBe('string');

    // Chronicle imported, but no characters were created.
    expect(getChronicles()).toHaveLength(1);
    expect(getCharacters()).toHaveLength(0);
  });

  it('round-trips a built export through buildChronicleExport → importChronicleExport', () => {
    // Set up a chronicle with a session and a relationship between two real chars.
    const chr = saveChronicle(createEmptyChronicle('Source', { setting: 'Berlin' }));
    saveChronicleSession(createEmptyChronicleSession(chr.id));
    saveChronicleLocation(createEmptyChronicleLocation(chr.id));
    const a = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Linker A'));
    const b = saveCharacter(createEmptyCharacter('V20', 'ventrue', 'Linker B'));
    setCharacterChronicle(a.id, chr.id);
    saveChronicleRelationship({
      ...createEmptyChronicleRelationship(chr.id),
      sourceCharacterId: a.id, targetCharacterId: b.id,
    });

    const envelope = buildChronicleExport(chr.id)!;
    const result = importChronicleExport(envelope) as any;
    expect(typeof result).not.toBe('string');
    // Original chronicle untouched + imported as a new distinct row.
    expect(getChronicles()).toHaveLength(2);
    expect(result.chronicleId).not.toBe(chr.id);
    expect(result.sessions).toBe(1);
    expect(result.locations).toBe(1);
    // Relationship endpoints exist locally → preserved.
    expect(result.relationships).toBe(1);
  });
});
