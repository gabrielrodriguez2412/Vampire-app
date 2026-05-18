import { describe, it, expect } from 'vitest';
import { disciplines } from '../disciplines';
import { clans } from '../clans';
import { EDITION_LIST } from '../editions';

const editionIds = new Set(EDITION_LIST.map(e => e.id));
const disciplineIds = new Set(disciplines.map(d => d.id));
const clanIds = new Set(clans.map(c => c.id));

describe('disciplines data', () => {
  it('has unique ids', () => {
    const ids = disciplines.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every discipline declares at least one edition and all editions are known', () => {
    for (const d of disciplines) {
      expect(d.editions.length, `${d.id} should declare at least one edition`).toBeGreaterThan(0);
      for (const ed of d.editions) {
        expect(editionIds.has(ed), `${d.id} references unknown edition ${ed}`).toBe(true);
      }
    }
  });

  it('every clan referenced in clansWhoUse exists', () => {
    for (const d of disciplines) {
      for (const cId of d.clansWhoUse) {
        expect(clanIds.has(cId), `${d.id}.clansWhoUse has unknown clan ${cId}`).toBe(true);
      }
    }
  });

  it('every power has level 1-5', () => {
    for (const d of disciplines) {
      for (const p of d.powers) {
        expect(p.level, `${d.id}.${p.name} level out of 1-5`).toBeGreaterThanOrEqual(1);
        expect(p.level, `${d.id}.${p.name} level out of 1-5`).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('clan -> discipline consistency', () => {
  // Forward direction: every discipline a clan claims must exist in the
  // disciplines table AND must list the clan back in clansWhoUse. This is the
  // direction that drives the UI (clan pages, character creation suggestions),
  // so drift here breaks user-facing flows.
  it('every clan discipline resolves to a known discipline that lists the clan', () => {
    for (const clan of clans) {
      for (const dId of clan.disciplines) {
        const d = disciplines.find(x => x.id === dId);
        expect(d, `Clan ${clan.id} references unknown discipline ${dId}`).toBeDefined();
        expect(
          d!.clansWhoUse.includes(clan.id),
          `Discipline ${dId} is missing clan ${clan.id} in clansWhoUse`
        ).toBe(true);
      }
    }
  });

  it('no duplicate clan ids in any discipline.clansWhoUse', () => {
    for (const d of disciplines) {
      expect(
        new Set(d.clansWhoUse).size,
        `${d.id}.clansWhoUse has duplicates`
      ).toBe(d.clansWhoUse.length);
    }
  });
});
