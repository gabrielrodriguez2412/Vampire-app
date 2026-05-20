import { describe, it, expect } from 'vitest';
import { ruleEditionLabel, ruleHasNeedsReviewMarker, getRuleCategories, ruleHasCategory } from '../ruleDisplay';
import { filterByEdition } from '../content';
import { rules as realRules } from '../../data/rules';
import { RuleEntry } from '../../types';

const labels = { labelAll: 'All', labelClassic: 'Classic' };

describe('ruleEditionLabel', () => {
  it('returns empty string for empty editions array', () => {
    expect(ruleEditionLabel([], labels)).toBe('');
  });

  it('returns "V5" when only V5 is present', () => {
    expect(ruleEditionLabel(['V5'], labels)).toBe('V5');
  });

  it('returns the classic label only when ALL four classic editions are present', () => {
    expect(ruleEditionLabel(['1ST', '2ND', 'REVISED', 'V20'], labels)).toBe('Classic');
  });

  it('returns the verbatim id when a single non-V5 edition is present', () => {
    expect(ruleEditionLabel(['V20'], labels)).toBe('V20');
    expect(ruleEditionLabel(['REVISED'], labels)).toBe('REVISED');
  });

  it('lists specific ids for a partial classic set (NEVER collapses to "Classic")', () => {
    expect(ruleEditionLabel(['V20', 'REVISED'], labels)).toBe('V20, REVISED');
    expect(ruleEditionLabel(['1ST', '2ND'], labels)).toBe('1ST, 2ND');
  });

  it('lists specific ids when V5 + only some classic editions are present', () => {
    expect(ruleEditionLabel(['V5', 'V20'], labels)).toBe('V5, V20');
    expect(ruleEditionLabel(['V5', '2ND'], labels)).toBe('V5, 2ND');
  });

  it('returns the all label only when V5 + all four classic editions are present', () => {
    expect(ruleEditionLabel(['V5', '1ST', '2ND', 'REVISED', 'V20'], labels)).toBe('All');
  });
});

function makeRule(quickNotes: Record<string, string[]>): RuleEntry {
  return {
    id: 'test',
    editions: ['V5'],
    title: { es: 't', en: 't', pt: '', fr: '', de: '', it: '' },
    category: 'Tiradas',
    shortExplanation: { es: '', en: '', pt: '', fr: '', de: '', it: '' },
    fullExplanation: { es: '', en: '', pt: '', fr: '', de: '', it: '' },
    examples: { es: [], en: [], pt: [], fr: [], de: [], it: [] },
    quickNotes: {
      es: quickNotes.es ?? [],
      en: quickNotes.en ?? [],
      pt: quickNotes.pt ?? [],
      fr: quickNotes.fr ?? [],
      de: quickNotes.de ?? [],
      it: quickNotes.it ?? [],
    },
    tags: [],
  };
}

describe('ruleHasNeedsReviewMarker', () => {
  it('detects English "Needs review" prefix', () => {
    const r = makeRule({ en: ['Needs review: exact threshold'] });
    expect(ruleHasNeedsReviewMarker(r, ['en'])).toBe(true);
  });

  it('detects Spanish "Necesita revisión" prefix', () => {
    const r = makeRule({ es: ['Necesita revisión: tabla por nivel'] });
    expect(ruleHasNeedsReviewMarker(r, ['es'])).toBe(true);
  });

  it('is case insensitive', () => {
    const r = makeRule({ en: ['NEEDS REVIEW: check the book'] });
    expect(ruleHasNeedsReviewMarker(r, ['en'])).toBe(true);
  });

  it('returns false when no marker is present', () => {
    const r = makeRule({ en: ['Quick note', 'Another tip'], es: ['Nota rápida'] });
    expect(ruleHasNeedsReviewMarker(r, ['en', 'es'])).toBe(false);
  });

  it('only flags lines that START with the marker (not arbitrary mentions)', () => {
    const r = makeRule({ en: ['This rule needs review eventually'] });
    expect(ruleHasNeedsReviewMarker(r, ['en'])).toBe(false);
  });

  it('scans all provided langs', () => {
    const r = makeRule({ pt: ['Precisa revisão: detalhe X'] });
    expect(ruleHasNeedsReviewMarker(r, ['en', 'pt'])).toBe(true);
  });
});

describe('getRuleCategories', () => {
  it('falls back to the legacy [category] when categories is missing', () => {
    expect(getRuleCategories({ category: 'Combate' })).toEqual(['Combate']);
  });

  it('uses categories when present and non-empty', () => {
    expect(getRuleCategories({ category: 'Bestia', categories: ['Bestia', 'Combate'] }))
      .toEqual(['Bestia', 'Combate']);
  });

  it('falls back when categories is present but empty', () => {
    expect(getRuleCategories({ category: 'Sangre', categories: [] }))
      .toEqual(['Sangre']);
  });

  it('drops empty / non-string entries', () => {
    expect(getRuleCategories({ category: 'X', categories: ['X', '', '  '] as string[] }))
      .toEqual(['X']);
  });
});

describe('ruleHasCategory', () => {
  it('matches against the multi-category list', () => {
    const rule = { category: 'Bestia', categories: ['Bestia', 'Combate'] };
    expect(ruleHasCategory(rule, 'Bestia')).toBe(true);
    expect(ruleHasCategory(rule, 'Combate')).toBe(true);
    expect(ruleHasCategory(rule, 'Hambre')).toBe(false);
  });

  it('falls back to legacy single category when categories is missing', () => {
    const rule = { category: 'Combate' };
    expect(ruleHasCategory(rule, 'Combate')).toBe(true);
    expect(ruleHasCategory(rule, 'Bestia')).toBe(false);
  });

  it('returns false for an empty category query', () => {
    expect(ruleHasCategory({ category: 'X' }, '')).toBe(false);
  });
});

// Regression coverage: edition-specific rules must not bleed across editions
// after the Phase 2 retag. Uses the real `rules` data so any future drift
// (e.g. someone tagging a V5-only rule as `["1ST", ..., "V5"]` again) will
// break this test.
describe('rules data: edition isolation', () => {
  it('V5 mode never surfaces classic-only rules (e.g. blood-pool, humanity-classic, healing-classic, willpower-classic)', () => {
    const v5Rules = filterByEdition(realRules, 'V5');
    const ids = v5Rules.map(r => r.id);
    expect(ids).not.toContain('blood-pool');
    expect(ids).not.toContain('humanity-classic');
    expect(ids).not.toContain('healing-classic');
    expect(ids).not.toContain('willpower-classic');
  });

  it('V20 mode never surfaces V5-only rules (e.g. hunger-dice, rouse-check, healing-v5, willpower, humanity-loss)', () => {
    const v20Rules = filterByEdition(realRules, 'V20');
    const ids = v20Rules.map(r => r.id);
    expect(ids).not.toContain('hunger-dice');
    expect(ids).not.toContain('rouse-check');
    expect(ids).not.toContain('healing-v5');
    expect(ids).not.toContain('willpower'); // V5-specific (Hunger-aware) Willpower
    expect(ids).not.toContain('humanity-loss'); // V5-specific Convictions/Stains framing
    expect(ids).not.toContain('blood-potency');
    expect(ids).not.toContain('superficial-damage');
    expect(ids).not.toContain('resonance');
    expect(ids).not.toContain('conditions');
  });

  it('classic-only entries (blood-pool, healing-classic, humanity-classic, willpower-classic) cover every classic edition', () => {
    const classicOnly = ['blood-pool', 'healing-classic', 'humanity-classic', 'willpower-classic'];
    for (const id of classicOnly) {
      const rule = realRules.find(r => r.id === id);
      expect(rule, `${id} should exist`).toBeTruthy();
      expect(rule!.editions).toEqual(['1ST', '2ND', 'REVISED', 'V20']);
      expect(rule!.editions).not.toContain('V5');
    }
  });

  it('every retagged V5 rule actually lists V5 in editions', () => {
    const v5Only = ['hunger-dice', 'rouse-check', 'healing-v5', 'willpower', 'humanity-loss', 'blood-potency', 'superficial-damage', 'resonance', 'conditions'];
    for (const id of v5Only) {
      const rule = realRules.find(r => r.id === id);
      expect(rule, `${id} should exist`).toBeTruthy();
      expect(rule!.editions).toContain('V5');
    }
  });
});
