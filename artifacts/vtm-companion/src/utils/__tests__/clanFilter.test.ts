import { describe, it, expect } from 'vitest';
import { applyClanFilters, getActiveSectTokens } from '../clanFilter';
import { clans } from '../../data/clans';
import { getClanDisplayName, getClanSect } from '../content';
import type { ClanEntry, EditionId, LangCode } from '../../types';

/**
 * Filter helpers backing the Clans page browse UI. The page wires these
 * to a search input, a sort toggle, and a row of sect filter chips.
 * If these helpers regress the UI silently breaks the most common
 * mobile QA paths (typing a clan name to skip the long scroll).
 */
const ALL_EDITIONS: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20', 'V5'];

describe('applyClanFilters', () => {
  const base = {
    clans,
    lang: 'en' as LangCode,
    search: '',
    sortKey: 'default' as const,
    sectFilter: 'all' as const,
  };

  it('respects the active edition (only edition-available clans appear)', () => {
    for (const edition of ALL_EDITIONS) {
      const result = applyClanFilters({ ...base, edition });
      for (const clan of result) {
        expect(
          clan.editionAvailability.includes(edition),
          `${clan.id} should not appear in ${edition}`,
        ).toBe(true);
      }
    }
  });

  it('search by clan name (case-insensitive, partial)', () => {
    const result = applyClanFilters({ ...base, edition: 'V5', search: 'bruj' });
    expect(result.some(c => c.id === 'brujah'), 'brujah should match "bruj"').toBe(true);
    // Non-matching clans should be filtered out.
    expect(result.every(c => c.id !== 'malkavian')).toBe(true);
  });

  it('search by V5 alternate clan name (Banu Haqim) when V5 is selected', () => {
    const result = applyClanFilters({ ...base, edition: 'V5', search: 'banu' });
    expect(result.some(c => c.id === 'assamite'), 'Banu Haqim should match "banu" in V5').toBe(true);
  });

  it('search by discipline id and name', () => {
    const byId = applyClanFilters({ ...base, edition: 'V5', search: 'auspex' });
    expect(byId.length).toBeGreaterThan(0);
    for (const clan of byId) {
      expect(
        clan.disciplines.some(d => d.includes('auspex')),
        `${clan.id} was returned for "auspex" search but has none`,
      ).toBe(true);
    }
  });

  it('search by sect label matches in the active language and in English', () => {
    // English search on a Spanish session — players sometimes type the
    // canonical EN sect name even when the UI is in another locale.
    const onSpanish = applyClanFilters({
      ...base,
      edition: 'V5',
      lang: 'es' as LangCode,
      search: 'camarilla',
    });
    expect(onSpanish.length).toBeGreaterThan(0);

    // Spanish search on a Spanish session.
    const inSpanish = applyClanFilters({
      ...base,
      edition: 'V5',
      lang: 'es' as LangCode,
      search: 'anarq',
    });
    expect(inSpanish.length).toBeGreaterThan(0);
  });

  it('sect filter hides non-matching clans', () => {
    const camarillaOnly = applyClanFilters({ ...base, edition: 'V20', sectFilter: 'camarilla' });
    expect(camarillaOnly.length).toBeGreaterThan(0);
    for (const clan of camarillaOnly) {
      const sectEn = (getClanSect(clan, 'V20', 'en') || '').toLowerCase();
      expect(
        sectEn.includes('camarilla'),
        `${clan.id} returned by camarilla filter but sect reads "${sectEn}"`,
      ).toBe(true);
    }
  });

  it('alpha sort orders results by display name in the active language', () => {
    const alpha = applyClanFilters({ ...base, edition: 'V5', sortKey: 'alpha' });
    const names = alpha.map(c => getClanDisplayName(c, 'V5', 'en'));
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('default sort preserves the data-file order (within the filtered set)', () => {
    const def = applyClanFilters({ ...base, edition: 'V5', sortKey: 'default' });
    const indices = def.map(c => clans.findIndex(d => d.id === c.id));
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });

  it('returns an empty list when the search matches nothing', () => {
    const result = applyClanFilters({ ...base, edition: 'V5', search: 'xyzzy-not-a-clan' });
    expect(result.length).toBe(0);
  });
});

describe('getActiveSectTokens', () => {
  it("always offers 'all' as the leftmost chip", () => {
    for (const edition of ALL_EDITIONS) {
      const tokens = getActiveSectTokens(clans, edition);
      expect(tokens[0]).toBe('all');
    }
  });

  it('only offers sect tokens that have at least one clan in this edition', () => {
    for (const edition of ALL_EDITIONS) {
      const tokens = getActiveSectTokens(clans, edition);
      for (const token of tokens) {
        if (token === 'all') continue;
        const visibleInEdition = clans.filter(c => c.editionAvailability.includes(edition));
        const matches = visibleInEdition.some(c => {
          const sectEn = (getClanSect(c, edition, 'en') || '').toLowerCase();
          return sectEn.includes(token);
        });
        expect(matches, `${edition}: token "${token}" was offered but no clan matches it`).toBe(true);
      }
    }
  });
});

describe('clan sect (edition-aware) — applied by getClanSect via the page', () => {
  // Spot-check the explicit V5 reassignments. Test by id rather than by
  // index so a future reordering of clans.ts doesn't break the suite.
  const find = (id: string): ClanEntry => {
    const c = clans.find(x => x.id === id);
    if (!c) throw new Error(`Test setup: clan id "${id}" not present in data`);
    return c;
  };

  it('Lasombra reads as Camarilla in V5 and Sabbat/Camarilla in V20', () => {
    expect((getClanSect(find('lasombra'), 'V5', 'en') || '').toLowerCase()).toBe('camarilla');
    expect((getClanSect(find('lasombra'), 'V20', 'en') || '').toLowerCase()).toContain('sabbat');
  });

  it('Banu Haqim (assamite) reads as Camarilla in V5', () => {
    expect((getClanSect(find('assamite'), 'V5', 'en') || '').toLowerCase()).toBe('camarilla');
  });

  it('The Ministry (followers_of_set) reads as Anarch in V5', () => {
    expect((getClanSect(find('followers_of_set'), 'V5', 'en') || '').toLowerCase()).toBe('anarch');
  });

  it('Caitiff and Thin-Bloods read as Unaligned in V5', () => {
    expect((getClanSect(find('caitiff'), 'V5', 'en') || '').toLowerCase()).toBe('unaligned');
    expect((getClanSect(find('thin_blood'), 'V5', 'en') || '').toLowerCase()).toBe('unaligned');
  });

  it('the Spanish label tracks the English label for the V5 overrides', () => {
    expect(getClanSect(find('caitiff'), 'V5', 'es')).toBe('Sin facción');
    expect(getClanSect(find('lasombra'), 'V5', 'es')).toBe('Camarilla');
    expect(getClanSect(find('followers_of_set'), 'V5', 'es')).toBe('Anarquista');
  });
});
