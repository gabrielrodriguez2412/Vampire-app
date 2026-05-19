import { describe, it, expect } from 'vitest';
import { rules } from '../rules';
import { EDITION_LIST } from '../editions';

const editionIds = new Set(EDITION_LIST.map(e => e.id));

describe('rules data', () => {
  it('has unique ids', () => {
    const ids = rules.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every rule declares at least one edition and all are known', () => {
    for (const r of rules) {
      expect(r.editions.length, `${r.id} should declare editions`).toBeGreaterThan(0);
      for (const ed of r.editions) {
        expect(editionIds.has(ed), `${r.id} references unknown edition ${ed}`).toBe(true);
      }
    }
  });

  it('every rule has a non-empty english title and short explanation', () => {
    for (const r of rules) {
      expect((r.title.en || '').trim().length, `${r.id} missing English title`).toBeGreaterThan(0);
      expect(
        (r.shortExplanation.en || '').trim().length,
        `${r.id} missing English short explanation`
      ).toBeGreaterThan(0);
    }
  });

  // Phase 1 quick-reference expansion: these ids must continue to exist
  // because the Home dashboard deep-links into them
  // (`/compendium/reglas/combat-overview`, `/compendium/reglas/humanity-loss`)
  // and the audit doc references the rest. If a future refactor renames any
  // of them, update the Home tiles and this list together.
  it('exposes the quick-reference rule ids the Home page deep-links to', () => {
    const ids = new Set(rules.map(r => r.id));
    const required = [
      'combat-overview',
      'humanity-loss',
      'blood-potency',
      'experience',
      'conditions',
      'storyteller-notes',
    ];
    for (const id of required) {
      expect(ids.has(id), `Required quick-reference id "${id}" missing from rules data`).toBe(true);
    }
  });

  it('every rule has a non-empty category string', () => {
    for (const r of rules) {
      expect(r.category.trim().length, `${r.id} has empty category`).toBeGreaterThan(0);
    }
  });
});
