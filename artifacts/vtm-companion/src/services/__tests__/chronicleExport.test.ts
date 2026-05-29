/**
 * @vitest-environment jsdom
 *
 * Batch AE — single-chronicle JSON export.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { buildChronicleExport, CHRONICLE_EXPORT_VERSION } from '../chronicleExport';
import { createEmptyChronicle, saveChronicle } from '../chronicleStorage';
import { createEmptyChronicleSession, saveChronicleSession } from '../chronicleSessionStorage';
import { createEmptyChronicleLocation, saveChronicleLocation } from '../chronicleLocationStorage';
import { createEmptyChronicleRelationship, saveChronicleRelationship } from '../chronicleRelationshipStorage';
import { createEmptyCharacter, saveCharacter, setCharacterChronicle } from '../characterStorage';

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
