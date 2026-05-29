/**
 * @vitest-environment jsdom
 *
 * Batch AF — bulk character JSON export (selected subset, one file).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildCharacterBulkExport,
  CHARACTER_BULK_EXPORT_VERSION,
} from '../characterBulkExport';
import { createEmptyCharacter, saveCharacter } from '../characterStorage';

beforeEach(() => window.localStorage.clear());

function seedThree() {
  const a = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Aria'));
  const b = saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bea'));
  const c = saveCharacter(createEmptyCharacter('V20', 'ventrue', 'Cyrus'));
  return { a, b, c };
}

describe('buildCharacterBulkExport', () => {
  it('returns null when no ids are supplied', () => {
    expect(buildCharacterBulkExport([])).toBeNull();
  });

  it('returns null when none of the supplied ids resolve to a stored character', () => {
    seedThree();
    expect(buildCharacterBulkExport(['nope-1', 'nope-2'])).toBeNull();
  });

  it('produces a versioned envelope with only the selected characters', () => {
    const { a, c } = seedThree();
    const exp = buildCharacterBulkExport([a.id, c.id])!;

    expect(exp).not.toBeNull();
    expect(exp._vtmCharacterBulkExport).toBe(true);
    expect(exp.exportVersion).toBe(CHARACTER_BULK_EXPORT_VERSION);
    expect(typeof exp.exportedAt).toBe('string');
    expect(exp.count).toBe(2);
    expect(exp.characters).toHaveLength(2);

    const names = exp.characters.map(ch => ch.name).sort();
    expect(names).toEqual(['Aria', 'Cyrus']);
  });

  it('excludes unselected characters (cross-selection isolation)', () => {
    const { a, b } = seedThree();
    const exp = buildCharacterBulkExport([a.id])!;
    expect(exp.characters).toHaveLength(1);
    expect(exp.characters[0].name).toBe('Aria');
    expect(exp.characters.find(ch => ch.id === b.id)).toBeUndefined();
  });

  it('ignores unknown ids mixed in with valid ones', () => {
    const { b } = seedThree();
    const exp = buildCharacterBulkExport([b.id, 'unknown-x', 'unknown-y'])!;
    expect(exp.count).toBe(1);
    expect(exp.characters[0].name).toBe('Bea');
  });

  it('does not include chronicles or unrelated app-backup data', () => {
    const { a } = seedThree();
    const exp = buildCharacterBulkExport([a.id])!;
    // Envelope keys are character-only.
    expect(Object.keys(exp).sort()).toEqual(
      ['_vtmCharacterBulkExport', 'characters', 'count', 'exportVersion', 'exportedAt'].sort()
    );
    expect((exp as any).chronicles).toBeUndefined();
    expect((exp as any).chronicleSessions).toBeUndefined();
    expect((exp as any).chronicleLocations).toBeUndefined();
    expect((exp as any).chronicleRelationships).toBeUndefined();
  });
});
