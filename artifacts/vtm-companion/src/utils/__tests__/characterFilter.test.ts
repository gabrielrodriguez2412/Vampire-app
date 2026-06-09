import { describe, it, expect } from 'vitest';
import { sortAndFilterCharacters } from '../characterFilter';
import { Character, CharacterKind, EditionId, CharacterType, CharacterStatus } from '../../types';

// Minimal character fixtures — the helper only reads name, clan, edition,
// characterType, status and updatedAt. Cast to Character to satisfy the call site.
function fixture(props: {
  name: string;
  clan: string;
  edition: EditionId;
  characterType?: CharacterType;
  status?: CharacterStatus;
  updatedAt?: string;
  chronicleId?: string;
  kind?: CharacterKind;
}): Character {
  return {
    id: `id-${props.name}`,
    name: props.name,
    clan: props.clan,
    edition: props.edition,
    characterType: props.characterType,
    status: props.status,
    chronicleId: props.chronicleId,
    kind: props.kind,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: props.updatedAt ?? '2020-01-01T00:00:00.000Z',
  } as unknown as Character;
}

describe('sortAndFilterCharacters', () => {
  describe('sort: updated', () => {
    it('sorts newest first', () => {
      const list = [
        fixture({ name: 'Old', clan: 'brujah', edition: 'V5', updatedAt: '2020-01-01T00:00:00.000Z' }),
        fixture({ name: 'New', clan: 'brujah', edition: 'V5', updatedAt: '2024-06-15T00:00:00.000Z' }),
        fixture({ name: 'Mid', clan: 'brujah', edition: 'V5', updatedAt: '2022-03-10T00:00:00.000Z' }),
      ];
      const result = sortAndFilterCharacters(list, { sortBy: 'updated', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['New', 'Mid', 'Old']);
    });

    it('puts characters with missing/invalid updatedAt at the end', () => {
      const list = [
        fixture({ name: 'Broken', clan: 'brujah', edition: 'V5', updatedAt: 'not-a-date' }),
        fixture({ name: 'Good', clan: 'brujah', edition: 'V5', updatedAt: '2024-01-01T00:00:00.000Z' }),
      ];
      const result = sortAndFilterCharacters(list, { sortBy: 'updated', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['Good', 'Broken']);
    });
  });

  describe('sort: name', () => {
    it('sorts alphabetically (A–Z)', () => {
      const list = [
        fixture({ name: 'Zara', clan: 'brujah', edition: 'V5' }),
        fixture({ name: 'Alice', clan: 'brujah', edition: 'V5' }),
        fixture({ name: 'Marcus', clan: 'brujah', edition: 'V5' }),
      ];
      const result = sortAndFilterCharacters(list, { sortBy: 'name', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['Alice', 'Marcus', 'Zara']);
    });
  });

  describe('sort: clan', () => {
    it('sorts by edition-aware clan display name', () => {
      // V5 names: Brujah, Tremere, Toreador → alphabetical → Brujah, Toreador, Tremere
      const list = [
        fixture({ name: 'C-Tremere', clan: 'tremere', edition: 'V5' }),
        fixture({ name: 'A-Brujah', clan: 'brujah', edition: 'V5' }),
        fixture({ name: 'B-Toreador', clan: 'toreador', edition: 'V5' }),
      ];
      const result = sortAndFilterCharacters(list, { sortBy: 'clan', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['A-Brujah', 'B-Toreador', 'C-Tremere']);
    });
  });

  describe('sort: edition', () => {
    it('sorts by chronological EDITION_LIST order (1ST → 2ND → REVISED → V20 → V5)', () => {
      const list = [
        fixture({ name: 'a', clan: 'brujah', edition: 'V5' }),
        fixture({ name: 'b', clan: 'brujah', edition: '1ST' }),
        fixture({ name: 'c', clan: 'brujah', edition: 'V20' }),
        fixture({ name: 'd', clan: 'brujah', edition: 'REVISED' }),
        fixture({ name: 'e', clan: 'brujah', edition: '2ND' }),
      ];
      const result = sortAndFilterCharacters(list, { sortBy: 'edition', language: 'en' });
      expect(result.map(c => c.edition)).toEqual(['1ST', '2ND', 'REVISED', 'V20', 'V5']);
    });
  });

  describe('sort: type', () => {
    it('puts Player Characters before NPCs, then alphabetical by name', () => {
      const list = [
        fixture({ name: 'Eve', clan: 'brujah', edition: 'V5', characterType: 'npc' }),
        fixture({ name: 'Carol', clan: 'brujah', edition: 'V5', characterType: 'player' }),
        fixture({ name: 'Bob', clan: 'brujah', edition: 'V5', characterType: 'npc' }),
        fixture({ name: 'Alice', clan: 'brujah', edition: 'V5', characterType: 'player' }),
      ];
      const result = sortAndFilterCharacters(list, { sortBy: 'type', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['Alice', 'Carol', 'Bob', 'Eve']);
    });

    it('treats missing characterType as player', () => {
      const list = [
        fixture({ name: 'NPC', clan: 'brujah', edition: 'V5', characterType: 'npc' }),
        fixture({ name: 'Legacy', clan: 'brujah', edition: 'V5' }), // no characterType
      ];
      const result = sortAndFilterCharacters(list, { sortBy: 'type', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['Legacy', 'NPC']);
    });
  });

  describe('filters', () => {
    const list = [
      fixture({ name: 'PC-V5-Brujah', clan: 'brujah', edition: 'V5', characterType: 'player' }),
      fixture({ name: 'NPC-V5-Tremere', clan: 'tremere', edition: 'V5', characterType: 'npc' }),
      fixture({ name: 'PC-V20-Brujah', clan: 'brujah', edition: 'V20', characterType: 'player' }),
      fixture({ name: 'NPC-V20-Toreador', clan: 'toreador', edition: 'V20', characterType: 'npc' }),
    ];

    it('filterType="player" keeps only PCs', () => {
      const result = sortAndFilterCharacters(list, { sortBy: 'name', filterType: 'player', language: 'en' });
      expect(result.map(c => c.name).sort()).toEqual(['PC-V20-Brujah', 'PC-V5-Brujah']);
    });

    it('filterType="npc" keeps only NPCs', () => {
      const result = sortAndFilterCharacters(list, { sortBy: 'name', filterType: 'npc', language: 'en' });
      expect(result.map(c => c.name).sort()).toEqual(['NPC-V20-Toreador', 'NPC-V5-Tremere']);
    });

    it('filterType="all" keeps everything', () => {
      const result = sortAndFilterCharacters(list, { sortBy: 'name', filterType: 'all', language: 'en' });
      expect(result).toHaveLength(4);
    });

    it('filterEdition narrows by edition id', () => {
      const result = sortAndFilterCharacters(list, { sortBy: 'name', filterEdition: 'V5', language: 'en' });
      expect(result.every(c => c.edition === 'V5')).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('filterClan narrows by clan id (stable internal id, not display name)', () => {
      const result = sortAndFilterCharacters(list, { sortBy: 'name', filterClan: 'brujah', language: 'en' });
      expect(result.every(c => c.clan === 'brujah')).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('combines all three filters', () => {
      const result = sortAndFilterCharacters(list, {
        sortBy: 'name',
        filterType: 'player',
        filterEdition: 'V20',
        filterClan: 'brujah',
        language: 'en',
      });
      expect(result.map(c => c.name)).toEqual(['PC-V20-Brujah']);
    });

    it('returns an empty array when nothing matches', () => {
      const result = sortAndFilterCharacters(list, {
        sortBy: 'name',
        filterEdition: 'V5',
        filterClan: 'toreador', // V5 + toreador not present in fixture
        language: 'en',
      });
      expect(result).toEqual([]);
    });
  });

  describe('filterChronicle', () => {
    const list = [
      fixture({ name: 'Linked-A', clan: 'brujah', edition: 'V5', chronicleId: 'chr-1' }),
      fixture({ name: 'Linked-B', clan: 'brujah', edition: 'V5', chronicleId: 'chr-2' }),
      fixture({ name: 'Unassigned', clan: 'brujah', edition: 'V5' }), // no chronicleId
      fixture({ name: 'Dangling', clan: 'brujah', edition: 'V5', chronicleId: 'chr-deleted' }),
    ];

    it('"all" keeps every character', () => {
      const r = sortAndFilterCharacters(list, { sortBy: 'name', filterChronicle: 'all', language: 'en' });
      expect(r).toHaveLength(4);
    });

    it('filters to a specific chronicle id', () => {
      const r = sortAndFilterCharacters(list, { sortBy: 'name', filterChronicle: 'chr-1', language: 'en' });
      expect(r.map(c => c.name)).toEqual(['Linked-A']);
    });

    it('"unassigned" includes characters with no chronicleId', () => {
      const r = sortAndFilterCharacters(list, { sortBy: 'name', filterChronicle: 'unassigned', language: 'en' });
      // Without validChronicleIds the dangling link is still considered assigned;
      // only the truly-unassigned character matches.
      expect(r.map(c => c.name)).toEqual(['Unassigned']);
    });

    it('"unassigned" + validChronicleIds treats dangling links as unassigned', () => {
      const validIds = new Set(['chr-1', 'chr-2']);
      const r = sortAndFilterCharacters(list, {
        sortBy: 'name',
        filterChronicle: 'unassigned',
        validChronicleIds: validIds,
        language: 'en',
      });
      expect(r.map(c => c.name).sort()).toEqual(['Dangling', 'Unassigned']);
    });

    it('specific id + validChronicleIds still resolves dangling correctly', () => {
      const validIds = new Set(['chr-1', 'chr-2']);
      const r = sortAndFilterCharacters(list, {
        sortBy: 'name',
        filterChronicle: 'chr-deleted',
        validChronicleIds: validIds,
        language: 'en',
      });
      // No character is *validly* linked to chr-deleted any more.
      expect(r).toEqual([]);
    });
  });

  describe('filter: status (archive)', () => {
    const list = () => [
      fixture({ name: 'ActiveA', clan: 'brujah', edition: 'V5', status: 'active' }),
      fixture({ name: 'ArchivedB', clan: 'brujah', edition: 'V5', status: 'archived' }),
      fixture({ name: 'LegacyNoStatus', clan: 'brujah', edition: 'V5' }), // undefined → active
    ];

    it('defaults to no status filtering (filterStatus omitted)', () => {
      const result = sortAndFilterCharacters(list(), { sortBy: 'name', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['ActiveA', 'ArchivedB', 'LegacyNoStatus']);
    });

    it("'all' keeps both active and archived", () => {
      const result = sortAndFilterCharacters(list(), { sortBy: 'name', filterStatus: 'all', language: 'en' });
      expect(result).toHaveLength(3);
    });

    it("'active' keeps active and status-less (legacy) characters only", () => {
      const result = sortAndFilterCharacters(list(), { sortBy: 'name', filterStatus: 'active', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['ActiveA', 'LegacyNoStatus']);
    });

    it("'archived' keeps archived characters only", () => {
      const result = sortAndFilterCharacters(list(), { sortBy: 'name', filterStatus: 'archived', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['ArchivedB']);
    });

    it('combines with other filters (archived + NPC)', () => {
      const mixed = [
        fixture({ name: 'ArchPC', clan: 'brujah', edition: 'V5', status: 'archived', characterType: 'player' }),
        fixture({ name: 'ArchNPC', clan: 'brujah', edition: 'V5', status: 'archived', characterType: 'npc' }),
        fixture({ name: 'ActiveNPC', clan: 'brujah', edition: 'V5', status: 'active', characterType: 'npc' }),
      ];
      const result = sortAndFilterCharacters(mixed, { sortBy: 'name', filterStatus: 'archived', filterType: 'npc', language: 'en' });
      expect(result.map(c => c.name)).toEqual(['ArchNPC']);
    });
  });

  describe('purity and edge cases', () => {
    it('does not mutate the input array', () => {
      const list = [
        fixture({ name: 'B', clan: 'brujah', edition: 'V5' }),
        fixture({ name: 'A', clan: 'brujah', edition: 'V5' }),
      ];
      const before = list.map(c => c.name);
      sortAndFilterCharacters(list, { sortBy: 'name', language: 'en' });
      expect(list.map(c => c.name)).toEqual(before);
    });

    it('returns an empty array for empty input', () => {
      expect(sortAndFilterCharacters([], { sortBy: 'updated', language: 'en' })).toEqual([]);
    });
  });

  describe('filter: kind (Batch BA)', () => {
    function mixedRoster(): Character[] {
      return [
        fixture({ name: 'V-vampire', clan: 'brujah', edition: 'V5', kind: 'vampire' }),
        fixture({ name: 'V-legacy', clan: 'tremere', edition: 'V20' /* no kind */ }),
        fixture({ name: 'H-mortal', clan: '', edition: 'V5', kind: 'human' }),
        fixture({ name: 'G-bound', clan: 'tremere', edition: 'V20', kind: 'ghoul' }),
        fixture({ name: 'G-unbound', clan: '', edition: 'V5', kind: 'ghoul' }),
      ];
    }

    it("'all' returns every character regardless of kind", () => {
      const result = sortAndFilterCharacters(mixedRoster(), {
        sortBy: 'name', language: 'en', filterKind: 'all',
      });
      expect(result.map(c => c.name).sort()).toEqual(
        ['G-bound', 'G-unbound', 'H-mortal', 'V-legacy', 'V-vampire']
      );
    });

    it("'vampire' includes legacy characters with missing kind", () => {
      const result = sortAndFilterCharacters(mixedRoster(), {
        sortBy: 'name', language: 'en', filterKind: 'vampire',
      });
      expect(result.map(c => c.name).sort()).toEqual(['V-legacy', 'V-vampire']);
    });

    it("'human' returns only humans", () => {
      const result = sortAndFilterCharacters(mixedRoster(), {
        sortBy: 'name', language: 'en', filterKind: 'human',
      });
      expect(result.map(c => c.name)).toEqual(['H-mortal']);
    });

    it("'ghoul' returns only ghouls regardless of regnant clan presence", () => {
      const result = sortAndFilterCharacters(mixedRoster(), {
        sortBy: 'name', language: 'en', filterKind: 'ghoul',
      });
      expect(result.map(c => c.name).sort()).toEqual(['G-bound', 'G-unbound']);
    });

    it('combines with filterEdition / filterClan / filterType (intersection semantics)', () => {
      const roster = [
        fixture({ name: 'V20 vampire tremere', clan: 'tremere', edition: 'V20', kind: 'vampire' }),
        fixture({ name: 'V20 ghoul tremere',   clan: 'tremere', edition: 'V20', kind: 'ghoul' }),
        fixture({ name: 'V5 ghoul tremere',    clan: 'tremere', edition: 'V5',  kind: 'ghoul' }),
        fixture({ name: 'V5 ghoul brujah',     clan: 'brujah',  edition: 'V5',  kind: 'ghoul' }),
      ];

      // Filter to V5 ghouls with clan tremere → exactly one match.
      const result = sortAndFilterCharacters(roster, {
        sortBy: 'name', language: 'en',
        filterKind: 'ghoul', filterEdition: 'V5', filterClan: 'tremere',
      });
      expect(result.map(c => c.name)).toEqual(['V5 ghoul tremere']);
    });

    it('treats an unrecognized stored kind value as vampire', () => {
      const odd = fixture({ name: 'odd', clan: 'brujah', edition: 'V20' });
      (odd as unknown as { kind: string }).kind = 'werewolf';

      const vampiresOnly = sortAndFilterCharacters([odd], {
        sortBy: 'name', language: 'en', filterKind: 'vampire',
      });
      expect(vampiresOnly.map(c => c.name)).toEqual(['odd']);

      const humansOnly = sortAndFilterCharacters([odd], {
        sortBy: 'name', language: 'en', filterKind: 'human',
      });
      expect(humansOnly).toEqual([]);
    });
  });
});
