/**
 * Batch AQ — random character-creation generator data + pure helpers.
 *
 * Drives the pickers with a seeded rng so suggestions are deterministic
 * in tests. Pins which fields are available per edition, which pool
 * each language uses, the immediate-repeat prevention, and the
 * "no rulebook phrases" content guard.
 */
import { describe, it, expect } from 'vitest';
import {
  pickRandom,
  poolFor,
  isFieldAvailable,
  generateSuggestion,
  generateInspirationBundle,
  GeneratorField,
} from '../characterGenerator';

describe('pickRandom (Batch AQ)', () => {
  it('returns the entry at the rng-determined index', () => {
    const pool = ['a', 'b', 'c', 'd'];
    expect(pickRandom(pool, () => 0)).toBe('a');
    expect(pickRandom(pool, () => 0.4)).toBe('b');
    expect(pickRandom(pool, () => 0.6)).toBe('c');
    expect(pickRandom(pool, () => 0.99)).toBe('d');
  });

  it('throws on an empty pool', () => {
    expect(() => pickRandom([], () => 0)).toThrow();
  });

  it('avoids returning lastValue when an alternative exists', () => {
    const pool = ['a', 'b', 'c'];
    // With lastValue='a', the candidate pool becomes ['b','c']. rng=0 ⇒ first.
    expect(pickRandom(pool, () => 0, 'a')).toBe('b');
    // rng near 1 hits the last candidate.
    expect(pickRandom(pool, () => 0.99, 'a')).toBe('c');
  });

  it('falls back to the only entry when the pool size is 1 (no alternative)', () => {
    expect(pickRandom(['only'], () => 0, 'only')).toBe('only');
  });
});

describe('poolFor + isFieldAvailable — edition gating (Batch AQ)', () => {
  it('V5: name / concept / appearance / personality are available in EN and ES', () => {
    for (const field of ['name', 'concept', 'appearance', 'personality'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V5', 'en')).toBe(true);
      expect(isFieldAvailable(field, 'V5', 'es')).toBe(true);
      expect(poolFor(field, 'V5', 'en').length).toBeGreaterThan(0);
      expect(poolFor(field, 'V5', 'es').length).toBeGreaterThan(0);
    }
  });

  it('V5: ambition / desire / predator are available in EN and ES; nature / demeanor are not', () => {
    for (const field of ['ambition', 'desire', 'predator'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V5', 'en')).toBe(true);
      expect(isFieldAvailable(field, 'V5', 'es')).toBe(true);
    }
    for (const field of ['nature', 'demeanor'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V5', 'en')).toBe(false);
      expect(isFieldAvailable(field, 'V5', 'es')).toBe(false);
    }
  });

  it('V20/classic: nature / demeanor in EN and ES; ambition / desire / predator are not', () => {
    for (const field of ['nature', 'demeanor'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V20', 'en')).toBe(true);
      expect(isFieldAvailable(field, 'V20', 'es')).toBe(true);
    }
    for (const field of ['ambition', 'desire', 'predator'] as GeneratorField[]) {
      expect(isFieldAvailable(field, 'V20', 'en')).toBe(false);
      expect(isFieldAvailable(field, 'V20', 'es')).toBe(false);
    }
  });

  it('every classic edition (V20, REVISED, 2ND, 1ST) gates V5-only fields the same way', () => {
    for (const ed of ['V20', 'REVISED', '2ND', '1ST'] as const) {
      expect(isFieldAvailable('ambition', ed, 'en')).toBe(false);
      expect(isFieldAvailable('predator', ed, 'en')).toBe(false);
      expect(isFieldAvailable('nature', ed, 'en')).toBe(true);
    }
  });

  it('unknown languages (pt / fr / de / it) fall back to the EN pool', () => {
    const en = poolFor('name', 'V5', 'en');
    expect(poolFor('name', 'V5', 'pt')).toBe(en);
    expect(poolFor('name', 'V5', 'fr')).toBe(en);
    expect(poolFor('name', 'V5', 'de')).toBe(en);
    expect(poolFor('name', 'V5', 'it')).toBe(en);
  });
});

describe('pool sizes are large enough to feel varied (Batch AQ review polish)', () => {
  // The first generator drop was too repetitive in normal use. These
  // floors guarantee future edits stay above the threshold we promised.
  it('names pool has at least 40 entries per language', () => {
    expect(poolFor('name', 'V5', 'en').length).toBeGreaterThanOrEqual(40);
    expect(poolFor('name', 'V5', 'es').length).toBeGreaterThanOrEqual(40);
  });
  it('concepts pool has at least 30 entries per language', () => {
    expect(poolFor('concept', 'V5', 'en').length).toBeGreaterThanOrEqual(30);
    expect(poolFor('concept', 'V5', 'es').length).toBeGreaterThanOrEqual(30);
  });
  it('appearance and personality pools have at least 25 entries per language', () => {
    for (const field of ['appearance', 'personality'] as GeneratorField[]) {
      expect(poolFor(field, 'V5', 'en').length).toBeGreaterThanOrEqual(25);
      expect(poolFor(field, 'V5', 'es').length).toBeGreaterThanOrEqual(25);
    }
  });
  it('V5 ambition / desire / predator pools have at least 15 entries per language', () => {
    for (const field of ['ambition', 'desire', 'predator'] as GeneratorField[]) {
      expect(poolFor(field, 'V5', 'en').length).toBeGreaterThanOrEqual(15);
      expect(poolFor(field, 'V5', 'es').length).toBeGreaterThanOrEqual(15);
    }
  });
  it('classic nature / demeanor pools have at least 15 entries per language', () => {
    for (const field of ['nature', 'demeanor'] as GeneratorField[]) {
      expect(poolFor(field, 'V20', 'en').length).toBeGreaterThanOrEqual(15);
      expect(poolFor(field, 'V20', 'es').length).toBeGreaterThanOrEqual(15);
    }
  });
});

describe('generateSuggestion (Batch AQ)', () => {
  it('returns a non-empty string when the field is available', () => {
    expect(generateSuggestion('name', 'V5', 'en', () => 0).length).toBeGreaterThan(0);
    expect(generateSuggestion('concept', 'V20', 'en', () => 0.5).length).toBeGreaterThan(0);
  });

  it("returns '' when the field is not available for the edition", () => {
    expect(generateSuggestion('ambition', 'V20', 'en', () => 0)).toBe('');
    expect(generateSuggestion('nature', 'V5', 'en', () => 0)).toBe('');
  });

  it('respects lang: ES picks from the Spanish pool, EN picks from the English pool', () => {
    const enSample = generateSuggestion('concept', 'V5', 'en', () => 0);
    const esSample = generateSuggestion('concept', 'V5', 'es', () => 0);
    // Both are non-empty and come from the right side of the pool.
    expect(poolFor('concept', 'V5', 'en')).toContain(enSample);
    expect(poolFor('concept', 'V5', 'es')).toContain(esSample);
    expect(poolFor('concept', 'V5', 'en')).not.toContain(esSample);
    expect(poolFor('concept', 'V5', 'es')).not.toContain(enSample);
  });

  it('avoids producing the same string as `lastValue` for the same field', () => {
    const first = generateSuggestion('name', 'V5', 'en', () => 0);
    const second = generateSuggestion('name', 'V5', 'en', () => 0, first);
    // Same seed and pool, but the first entry is now excluded.
    expect(second).not.toBe(first);
  });

  it('every classic edition routes through the same language-specific pools', () => {
    for (const ed of ['V20', 'REVISED', '2ND', '1ST'] as const) {
      const en = generateSuggestion('nature', ed, 'en', () => 0);
      const es = generateSuggestion('nature', ed, 'es', () => 0);
      expect(poolFor('nature', ed, 'en')).toContain(en);
      expect(poolFor('nature', ed, 'es')).toContain(es);
    }
  });
});

describe('generateInspirationBundle (Batch AQ)', () => {
  it('returns both an appearance and a personality string in the active language', () => {
    const en = generateInspirationBundle('en', () => 0);
    const es = generateInspirationBundle('es', () => 0);
    expect(poolFor('appearance', 'V5', 'en')).toContain(en.appearance);
    expect(poolFor('personality', 'V5', 'en')).toContain(en.personality);
    expect(poolFor('appearance', 'V5', 'es')).toContain(es.appearance);
    expect(poolFor('personality', 'V5', 'es')).toContain(es.personality);
  });

  it('avoids returning the exact same pair as `lastBundle`', () => {
    const first = generateInspirationBundle('en', () => 0);
    const second = generateInspirationBundle('en', () => 0, first);
    expect(second.appearance).not.toBe(first.appearance);
    expect(second.personality).not.toBe(first.personality);
  });
});

describe('original-content guard — every pool in every language (Batch AQ)', () => {
  // Defence-in-depth: the prompts must be original short content
  // authored for the app, NOT verbatim official rulebook strings. We
  // pin a few characteristic phrases the published V20 / V5 books use
  // and confirm none of them leak through any pool, in either language.
  const RULEBOOK_PHRASES = [
    'Architect', 'Bon Vivant', 'Conformist', 'Director', 'Loner',
    'Survivor', 'Trickster', 'Visionary', 'Caregiver',
    'Alleycat', 'Bagger', 'Cleaver', 'Farmer', 'Osiris',
    'Sandman', 'Scene Queen', 'Siren', 'Consensualist', 'Roadside Killer',
    // Spanish equivalents of the same published Archetype / Predator
    // Type names, picked because those are exactly the strings a
    // future contributor could accidentally paste from a translated
    // rulebook.
    'Arquitecto', 'Bonvivant', 'Conformista', 'Director', 'Solitario',
    'Superviviente', 'Embaucador', 'Visionario', 'Cuidador',
    'Gatocallejero', 'Saqueador', 'Carnicero', 'Granjero',
  ];

  it('no entry is verbatim equal to a published Archetype / Predator Type name', () => {
    // We check exact equality (case-insensitive, trimmed) rather than
    // substring containment because several published Archetype names
    // are normal dictionary words ("Director", "Survivor", "Visionary",
    // ...) that show up in legitimate prose entries. The realistic
    // licensing risk is a contributor pasting an entire table row as
    // a literal entry, which exact-match catches without false
    // positives.
    const normalized = new Set(RULEBOOK_PHRASES.map(p => p.toLowerCase().trim()));
    const fields: GeneratorField[] = [
      'name', 'concept', 'appearance', 'personality',
      'ambition', 'desire', 'predator', 'nature', 'demeanor',
    ];
    const editions = ['V5', 'V20'] as const;
    const langs = ['en', 'es'] as const;
    const kinds = ['vampire', 'human', 'ghoul'] as const;
    const allPools = fields.flatMap(field =>
      editions.flatMap(ed =>
        langs.flatMap(lang =>
          // Batch BC — also audit the kind-aware pools (vampire / human
          // / ghoul) so the ghoul supplement entries cannot leak
          // copyrighted strings either.
          kinds.map(kind => poolFor(field, ed, lang, kind)),
        ),
      ),
    );
    for (const pool of allPools) {
      for (const entry of pool) {
        expect(normalized.has(entry.toLowerCase().trim())).toBe(false);
      }
    }
  });
});

describe('Batch BC — kind-aware pools', () => {
  it('vampire keeps the V5 ambition / desire / predator pools', () => {
    for (const lang of ['en', 'es'] as const) {
      expect(isFieldAvailable('ambition', 'V5', lang, 'vampire')).toBe(true);
      expect(isFieldAvailable('desire',   'V5', lang, 'vampire')).toBe(true);
      expect(isFieldAvailable('predator', 'V5', lang, 'vampire')).toBe(true);
      expect(poolFor('ambition', 'V5', lang, 'vampire').length).toBeGreaterThan(0);
    }
  });

  it('human has no ambition / desire / predator suggestions on V5 OR classic', () => {
    const langs = ['en', 'es'] as const;
    const editions = ['V5', 'V20', 'REVISED', '2ND', '1ST'] as const;
    for (const lang of langs) {
      for (const ed of editions) {
        expect(isFieldAvailable('ambition', ed, lang, 'human')).toBe(false);
        expect(isFieldAvailable('desire',   ed, lang, 'human')).toBe(false);
        expect(isFieldAvailable('predator', ed, lang, 'human')).toBe(false);
        expect(generateSuggestion('ambition', ed, lang, () => 0.5, undefined, 'human')).toBe('');
        expect(generateSuggestion('predator', ed, lang, () => 0.5, undefined, 'human')).toBe('');
      }
    }
  });

  it('ghoul has no ambition / desire / predator suggestions either', () => {
    for (const lang of ['en', 'es'] as const) {
      for (const ed of ['V5', 'V20'] as const) {
        expect(isFieldAvailable('predator', ed, lang, 'ghoul')).toBe(false);
        expect(isFieldAvailable('ambition', ed, lang, 'ghoul')).toBe(false);
        expect(isFieldAvailable('desire',   ed, lang, 'ghoul')).toBe(false);
      }
    }
  });

  it('human keeps name / concept / appearance / personality available in EN and ES', () => {
    for (const lang of ['en', 'es'] as const) {
      for (const field of ['name', 'concept', 'appearance', 'personality'] as const) {
        expect(isFieldAvailable(field, 'V5', lang, 'human')).toBe(true);
        expect(isFieldAvailable(field, 'V20', lang, 'human')).toBe(true);
      }
    }
  });

  it('ghoul concept and personality pools are strict supersets of the vampire/human base pools', () => {
    for (const lang of ['en', 'es'] as const) {
      const baseConcept = poolFor('concept', 'V5', lang, 'vampire');
      const ghoulConcept = poolFor('concept', 'V5', lang, 'ghoul');
      // The ghoul pool contains every base entry...
      for (const entry of baseConcept) {
        expect(ghoulConcept).toContain(entry);
      }
      // ...plus at least one ghoul-flavored entry.
      expect(ghoulConcept.length).toBeGreaterThan(baseConcept.length);

      const basePers = poolFor('personality', 'V5', lang, 'vampire');
      const ghoulPers = poolFor('personality', 'V5', lang, 'ghoul');
      for (const entry of basePers) {
        expect(ghoulPers).toContain(entry);
      }
      expect(ghoulPers.length).toBeGreaterThan(basePers.length);
    }
  });

  it('ghoul-flavored entries lean into servitor / dependent themes (English)', () => {
    // Spot-check that at least one ghoul-supplemental entry is present
    // in each lang's concept / personality pool. We don't pin the
    // exact wording — only that the ghoul pool truly differs from the
    // base mortal pool.
    const ghoulConcept = poolFor('concept', 'V5', 'en', 'ghoul');
    const baseConcept = poolFor('concept', 'V5', 'en', 'vampire');
    const extra = ghoulConcept.filter(e => !baseConcept.includes(e));
    expect(extra.length).toBeGreaterThanOrEqual(8);

    const ghoulPers = poolFor('personality', 'V5', 'en', 'ghoul');
    const basePers = poolFor('personality', 'V5', 'en', 'vampire');
    const extraPers = ghoulPers.filter(e => !basePers.includes(e));
    expect(extraPers.length).toBeGreaterThanOrEqual(8);
  });

  it('human suggestions do not include any vampire-only ambition / desire / predator text', () => {
    // If a vampire-only field returns '' for a mortal, then the actual
    // generated string can never come from the V5 vampire pool. This
    // test is the contractual proof of that.
    const vampireAmbitions = poolFor('ambition', 'V5', 'en', 'vampire');
    for (let i = 0; i < 50; i++) {
      const v = generateSuggestion('ambition', 'V5', 'en', () => i / 50, undefined, 'human');
      expect(v).toBe('');
      expect(vampireAmbitions).not.toContain(v); // double-defence
    }
  });

  it('default kind (omitted) preserves pre-BC vampire behaviour for every call shape', () => {
    // Ensures the backward-compat default — every existing 3- / 4- /
    // 5-arg call site still routes to the vampire pool.
    expect(poolFor('ambition', 'V5', 'en')).toEqual(poolFor('ambition', 'V5', 'en', 'vampire'));
    expect(isFieldAvailable('predator', 'V5', 'en')).toBe(true);
    const v = generateSuggestion('predator', 'V5', 'en', () => 0.123);
    expect(v).not.toBe('');
    expect(poolFor('predator', 'V5', 'en')).toContain(v);
  });

  it('generateInspirationBundle pulls ghoul-flavored personality for kind="ghoul"', () => {
    // Drive the rng so the picked indices land inside the ghoul
    // supplement (the supplement sits at the end of the merged pool).
    const ghoulPers = poolFor('personality', 'V5', 'en', 'ghoul');
    const basePers = poolFor('personality', 'V5', 'en', 'vampire');
    const ghoulOnly = ghoulPers.filter(e => !basePers.includes(e));
    // rng→1 hits the last entry, which is in the supplement.
    const bundle = generateInspirationBundle('en', () => 0.999, undefined, 'ghoul');
    expect(ghoulOnly).toContain(bundle.personality);
  });
});
