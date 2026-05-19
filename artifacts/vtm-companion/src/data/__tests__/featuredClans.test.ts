import { describe, it, expect } from 'vitest';
import { clans } from '../clans';
import { FEATURED_CLAN_IDS } from '../featuredClans';

const clanIds = new Set(clans.map(c => c.id));

describe('FEATURED_CLAN_IDS (home dashboard clan strip)', () => {
  it('every featured id resolves to a real clan in clans.ts', () => {
    // Regression: an earlier version listed V5 alt-name slugs
    // (`banu_haqim`, `hecata`, `ministry`) that never matched any
    // canonical clan id, so three of the thirteen featured clans
    // silently dropped out of the home strip.
    for (const id of FEATURED_CLAN_IDS) {
      expect(clanIds.has(id), `featured clan id "${id}" not found in clans.ts`).toBe(true);
    }
  });

  it('has no duplicate ids', () => {
    const set = new Set(FEATURED_CLAN_IDS);
    expect(set.size).toBe(FEATURED_CLAN_IDS.length);
  });
});
