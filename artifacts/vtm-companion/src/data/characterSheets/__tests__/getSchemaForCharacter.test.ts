/**
 * Batch AY (Phase 2) — Human / Ghoul basic sheet schemas + the kind-aware
 * `getSchemaForCharacter` selector.
 *
 * Locks in the Phase 2 invariants:
 *   1. Vampire characters (and legacy characters with `kind` absent) still
 *      route to the existing V5 / classic vampire schemas, unchanged.
 *   2. Human / Ghoul characters route to dedicated Phase 2 mortal schemas.
 *   3. Phase 2 human and ghoul schemas DO NOT carry vampire-only fields
 *      (Hunger, Blood Potency, Blood Pool, Generation, Predator Type,
 *      Disciplines, Sire, Resonance, Touchstones, Convictions).
 *   4. Phase 2 mortal schemas DO carry the universal Storyteller fields
 *      a sheet needs to be useful: Health and Willpower trackers, the
 *      edition-appropriate attribute/skill grid, identity, journal,
 *      inventory.
 *   5. Classic-edition mortals keep the Virtues section because Virtues
 *      are general Storyteller-system traits, not vampire-only.
 *
 * Schema audits are pure data — no React, no jsdom — so they ride along
 * with the rest of the unit-test pass at near-zero cost.
 */
import { describe, it, expect } from 'vitest';
import { getSchemaForCharacter, getSchemaForEdition } from '../editions';
import { v5Schema } from '../v5';
import { classicSchema } from '../classic';
import { humanV5Schema, humanClassicSchema } from '../human';
import { ghoulV5Schema, ghoulClassicSchema } from '../ghoul';
import type { Character } from '@/types';

function ids(schema: { sections: { fields: { id: string }[] }[] }): string[] {
  return schema.sections.flatMap(s => s.fields.map(f => f.id));
}

// Stub builders — every test below only ever reads `kind` and `edition`
// on the character, so the rest of the shape can stay as `any` casts.
function stub(kind: Character['kind'], edition: Character['edition']): Pick<Character, 'kind' | 'edition'> {
  return { kind, edition } as Pick<Character, 'kind' | 'edition'>;
}

describe('Batch AY — getSchemaForCharacter routing', () => {
  it('returns v5Schema for a V5 vampire', () => {
    expect(getSchemaForCharacter(stub('vampire', 'V5'))).toBe(v5Schema);
  });

  it('returns classicSchema for a V20 vampire', () => {
    expect(getSchemaForCharacter(stub('vampire', 'V20'))).toBe(classicSchema);
  });

  it('returns classicSchema for a Revised vampire', () => {
    expect(getSchemaForCharacter(stub('vampire', 'REVISED'))).toBe(classicSchema);
  });

  it('returns v5Schema when kind is undefined / legacy (default to vampire)', () => {
    // Critical backward-compat path: a saved character that pre-dates
    // Batch AX has no `kind` field on disk; the storage normalizer
    // injects `vampire` on read, but the selector must also tolerate a
    // bare `undefined` defensively.
    expect(getSchemaForCharacter(stub(undefined, 'V5'))).toBe(v5Schema);
    expect(getSchemaForCharacter(stub(undefined, 'V20'))).toBe(classicSchema);
  });

  it('returns the human V5 schema for a V5 human', () => {
    expect(getSchemaForCharacter(stub('human', 'V5'))).toBe(humanV5Schema);
  });

  it('returns the human classic schema for a V20 / Revised / 2ND / 1ST human', () => {
    for (const edition of ['V20', 'REVISED', '2ND', '1ST'] as const) {
      expect(getSchemaForCharacter(stub('human', edition))).toBe(humanClassicSchema);
    }
  });

  it('returns the ghoul V5 schema for a V5 ghoul', () => {
    expect(getSchemaForCharacter(stub('ghoul', 'V5'))).toBe(ghoulV5Schema);
  });

  it('returns the ghoul classic schema for a V20 / Revised / 2ND / 1ST ghoul', () => {
    for (const edition of ['V20', 'REVISED', '2ND', '1ST'] as const) {
      expect(getSchemaForCharacter(stub('ghoul', edition))).toBe(ghoulClassicSchema);
    }
  });

  it('keeps `getSchemaForEdition` working unchanged for vampires (backward compat)', () => {
    expect(getSchemaForEdition('V5')).toBe(v5Schema);
    expect(getSchemaForEdition('V20')).toBe(classicSchema);
    expect(getSchemaForEdition('REVISED')).toBe(classicSchema);
  });
});

describe('Batch AY — Human schemas omit vampire-only fields', () => {
  const VAMPIRE_ONLY = [
    'bloodPotency',
    'hunger',
    'predatorType',
    'resonance',
    'touchstones',
    'convictions',
    'sire',
    'generation',
    'bloodPool',
    'disciplines',
    'ambition',
    'desire',
    // Phase 2 intentionally omits the regnant-clan / clan field from
    // mortal sheets — see deferred notes in the schemas.
    'clan',
  ];

  it('humanV5Schema does NOT carry any vampire-only field', () => {
    const have = ids(humanV5Schema);
    for (const id of VAMPIRE_ONLY) {
      expect(have).not.toContain(id);
    }
  });

  it('humanClassicSchema does NOT carry any vampire-only field', () => {
    const have = ids(humanClassicSchema);
    for (const id of VAMPIRE_ONLY) {
      expect(have).not.toContain(id);
    }
  });

  it('humanV5Schema DOES carry the universal V5 fields a sheet needs', () => {
    const have = ids(humanV5Schema);
    expect(have).toContain('name');
    expect(have).toContain('attributes.strength');
    expect(have).toContain('skills.athletics');
    expect(have).toContain('health');
    expect(have).toContain('willpower');
    expect(have).toContain('characterNotes');
    expect(have).toContain('inventory');
  });

  it('humanClassicSchema DOES carry the universal classic fields a sheet needs', () => {
    const have = ids(humanClassicSchema);
    expect(have).toContain('name');
    expect(have).toContain('attributes.strength');
    expect(have).toContain('attributes.appearance'); // classic-only attribute
    expect(have).toContain('abilities.alertness');   // classic abilities (not V5 skills)
    expect(have).toContain('health');
    expect(have).toContain('willpower');
    // Virtues stay — they're general Storyteller-system traits, not
    // vampire-only — so mortals on classic still build them on creation.
    expect(have).toContain('virtues.conscience');
    expect(have).toContain('virtues.selfControl');
    expect(have).toContain('virtues.courage');
  });
});

describe('Batch AY — Ghoul schemas omit vampire-only fields', () => {
  // Phase 2 ghoul schemas mirror human schemas. Same exclusion list,
  // plus an explicit guard that disciplines are NOT in the ghoul sheet
  // (Phase 3 will add a curated ghoul-specific discipline section).
  const VAMPIRE_ONLY = [
    'bloodPotency',
    'hunger',
    'predatorType',
    'resonance',
    'touchstones',
    'convictions',
    'sire',
    'generation',
    'bloodPool',
    'disciplines',
    'ambition',
    'desire',
  ];

  it('ghoulV5Schema does NOT carry any vampire-only field', () => {
    const have = ids(ghoulV5Schema);
    for (const id of VAMPIRE_ONLY) {
      expect(have).not.toContain(id);
    }
  });

  it('ghoulClassicSchema does NOT carry any vampire-only field', () => {
    const have = ids(ghoulClassicSchema);
    for (const id of VAMPIRE_ONLY) {
      expect(have).not.toContain(id);
    }
  });

  it('ghoulV5Schema renders Health + Willpower so play-tracking still works', () => {
    const have = ids(ghoulV5Schema);
    expect(have).toContain('health');
    expect(have).toContain('willpower');
  });

  it('ghoulClassicSchema renders Health + Willpower so play-tracking still works', () => {
    const have = ids(ghoulClassicSchema);
    expect(have).toContain('health');
    expect(have).toContain('willpower');
  });
});

describe('Batch AY — vampire schema regression guards', () => {
  // The audit demands "byte-for-byte" vampire compatibility. Snapshot the
  // existing V5 / classic vampire field sets so a stray edit to v5.ts or
  // classic.ts that drops a vampire-only field shows up here.
  it('v5Schema still carries the canonical V5 vampire fields', () => {
    const have = ids(v5Schema);
    for (const id of [
      'name', 'playerName', 'chronicle', 'concept',
      'ambition', 'desire', 'predatorType', 'sire',
      'attributes.strength', 'skills.athletics',
      'bloodPotency', 'hunger', 'humanity', 'resonance',
      'disciplines',
      'health', 'willpower', 'experience',
      'touchstones', 'convictions', 'advantages', 'flaws',
      'inventory', 'characterNotes',
    ]) {
      expect(have).toContain(id);
    }
  });

  it('classicSchema still carries the canonical classic vampire fields', () => {
    const have = ids(classicSchema);
    for (const id of [
      'name', 'playerName', 'chronicle', 'nature', 'demeanor', 'concept',
      'generation', 'sire',
      'attributes.strength', 'abilities.alertness',
      'virtues.conscience', 'virtues.selfControl', 'virtues.courage',
      'disciplines', 'backgrounds',
      'humanity', 'willpower', 'bloodPool', 'health',
      'merits', 'flaws', 'inventory', 'characterNotes',
    ]) {
      expect(have).toContain(id);
    }
  });
});
