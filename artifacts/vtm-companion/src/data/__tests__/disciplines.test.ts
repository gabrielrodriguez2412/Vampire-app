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

  // Phase 3: a discipline must surface either a flat powers list OR at least
  // one specialSystems section. Either prevents the silent-empty-array UX
  // problem; the latter is the model for paths/rituals/ceremonies/formulae.
  it('every discipline has at least one power entry or specialSystems section', () => {
    for (const d of disciplines) {
      const hasPowers = d.powers.length > 0;
      const hasSpecial = (d.specialSystems?.length ?? 0) > 0;
      expect(
        hasPowers || hasSpecial,
        `${d.id} has no power entries and no specialSystems sections`
      ).toBe(true);
    }
  });

  // For disciplines that DO use the flat powers list, still require full L1–5
  // coverage. Disciplines that only use specialSystems are exempt because
  // their content is grouped differently (paths, rituals, ceremonies,
  // formulae) and may not span every dot level.
  it('every powers-list discipline covers all five levels (1..5)', () => {
    for (const d of disciplines) {
      if (d.powers.length === 0) continue;
      const levels = new Set(d.powers.map(p => p.level));
      for (const lvl of [1, 2, 3, 4, 5]) {
        expect(levels.has(lvl), `${d.id} missing a power at level ${lvl}`).toBe(true);
      }
    }
  });

  it('every power has a non-empty english description (placeholders allowed)', () => {
    for (const d of disciplines) {
      for (const p of d.powers) {
        expect(
          (p.description.en || '').trim().length,
          `${d.id}.${p.name} missing an English description (use a "Needs review" placeholder if unsure)`
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe('discipline specialSystems shape', () => {
  const KNOWN_KINDS = new Set(['paths', 'rituals', 'ceremonies', 'formulae', 'other']);

  it('section ids are unique across all disciplines', () => {
    const ids: string[] = [];
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) ids.push(s.id);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('item ids are unique within each section', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        const ids = s.items.map(i => i.id);
        expect(
          new Set(ids).size,
          `${d.id}.${s.id} has duplicate item ids`
        ).toBe(ids.length);
      }
    }
  });

  it('every section has a known kind and a non-empty english title', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        expect(KNOWN_KINDS.has(s.kind), `${d.id}.${s.id} unknown kind ${s.kind}`).toBe(true);
        expect(
          (s.title.en || '').trim().length,
          `${d.id}.${s.id} missing English title`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every item has a non-empty english summary and (if level set) level in 1..5', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        for (const item of s.items) {
          expect(
            (item.summary.en || '').trim().length,
            `${d.id}.${s.id}.${item.id} missing English summary`
          ).toBeGreaterThan(0);
          if (typeof item.level === 'number') {
            expect(item.level, `${d.id}.${s.id}.${item.id} level out of 1-5`).toBeGreaterThanOrEqual(1);
            expect(item.level, `${d.id}.${s.id}.${item.id} level out of 1-5`).toBeLessThanOrEqual(5);
          }
        }
      }
    }
  });

  /**
   * Pending-state contract (Batch K).
   *
   * Sections marked `needsReview: true` used to ship fake placeholder
   * items like "Ritual (Level 1) — Needs review" so the accordion
   * would not look empty. Those have been removed in favour of an
   * empty `items: []` list plus a localized `description` that
   * explains the section is pending review. These cases pin that
   * contract:
   *   - placeholder sections carry an empty items array (no fake
   *     entries leak back into the UI),
   *   - their title and description are populated in EN AND ES
   *     (so the disciplines page does not render English under a
   *     Spanish UI),
   *   - the description text differs between EN and ES (catches
   *     copy-paste regressions of the "we lied about translating"
   *     variety).
   */
  it('every needsReview section ships an empty items array', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (s.needsReview) {
          expect(
            s.items.length,
            `${d.id}.${s.id} is needsReview but still has placeholder items — drop them in favour of empty items: []`,
          ).toBe(0);
        }
      }
    }
  });

  it('every needsReview section title is populated in EN AND ES', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (!s.needsReview) continue;
        expect(
          (s.title.en || '').trim().length,
          `${d.id}.${s.id}.title.en is empty`,
        ).toBeGreaterThan(0);
        expect(
          (s.title.es || '').trim().length,
          `${d.id}.${s.id}.title.es is empty (Spanish UI would fall back to EN)`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every needsReview section description is populated in EN AND ES and is not a copy-paste', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (!s.needsReview) continue;
        const desc = s.description;
        expect(
          desc,
          `${d.id}.${s.id} has no description — pending-state copy is required`,
        ).toBeDefined();
        const en = (desc?.en || '').trim();
        const es = (desc?.es || '').trim();
        expect(en.length, `${d.id}.${s.id}.description.en empty`).toBeGreaterThan(0);
        expect(es.length, `${d.id}.${s.id}.description.es empty`).toBeGreaterThan(0);
        expect(
          es,
          `${d.id}.${s.id}.description.es is a verbatim copy of EN — translate it`,
        ).not.toBe(en);
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
