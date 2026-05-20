import { describe, it, expect } from 'vitest';
import {
  rankSearchEntries,
  scoreEntry,
  joinSearchableText,
  searchSnippet,
  SearchEntry,
  DEFAULT_SEARCH_LIMIT,
  SEARCH_SNIPPET_MAX,
  buildSearchEntries,
} from '../search';
import type { Character, CharacterNote } from '../../types';

/** Minimal entry factory — only `title` / `description` / `body` /
 *  `subtitle` matter to the ranker; the rest of the shape is filled in
 *  with stable placeholders so test cases stay short. */
function entry(over: Partial<SearchEntry> & { title: string }): SearchEntry {
  return {
    id: over.title.toLowerCase(),
    type: 'clan',
    title: over.title,
    description: over.description ?? '',
    body: over.body,
    subtitle: over.subtitle,
    url: '/x',
    ...over,
  };
}

describe('scoreEntry', () => {
  it('returns the exact-match tier for case-insensitive identical titles', () => {
    expect(scoreEntry(entry({ title: 'Brujah' }), 'brujah')).toBe(0);
    expect(scoreEntry(entry({ title: 'BRUJAH' }), 'brujah')).toBe(0);
  });

  it('returns the starts-with tier for title prefixes', () => {
    expect(scoreEntry(entry({ title: 'Brujah Rebels' }), 'brujah')).toBe(1);
  });

  it('returns the includes tier for substring matches in the title', () => {
    expect(scoreEntry(entry({ title: 'The Brujah Antitribu' }), 'brujah')).toBe(2);
  });

  it('falls through to body/description/subtitle for the lowest tier', () => {
    expect(scoreEntry(entry({ title: 'Whatever', description: 'about brujah' }), 'brujah')).toBe(3);
    expect(scoreEntry(entry({ title: 'Whatever', body: 'their bane is brujah-ish' }), 'brujah')).toBe(3);
    expect(scoreEntry(entry({ title: 'Whatever', subtitle: 'in Brujah chronicle' }), 'brujah')).toBe(3);
  });

  it('returns +Infinity (no match) when nothing matches', () => {
    expect(scoreEntry(entry({ title: 'a', description: 'b', body: 'c' }), 'xyz')).toBe(Number.POSITIVE_INFINITY);
  });

  it('treats an empty query as no-match', () => {
    expect(scoreEntry(entry({ title: 'Brujah' }), '')).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('rankSearchEntries', () => {
  it('returns [] for empty / sub-minimum queries', () => {
    const entries = [entry({ title: 'Brujah' })];
    expect(rankSearchEntries(entries, '')).toEqual([]);
    expect(rankSearchEntries(entries, 'b')).toEqual([]);
  });

  it('orders results by tier (exact → prefix → includes → body)', () => {
    const entries = [
      entry({ title: 'Random body match', body: 'brujah lurks here' }),  // tier 3
      entry({ title: 'The Brujah Antitribu' }),                          // tier 2 (includes)
      entry({ title: 'Brujah Rebels' }),                                 // tier 1 (prefix)
      entry({ title: 'Brujah' }),                                        // tier 0 (exact)
    ];
    const out = rankSearchEntries(entries, 'brujah');
    expect(out.map(r => r.title)).toEqual([
      'Brujah',
      'Brujah Rebels',
      'The Brujah Antitribu',
      'Random body match',
    ]);
  });

  it('is stable within the same tier (input order is the tie-breaker)', () => {
    const entries = [
      entry({ id: 'a', title: 'Brujah Alpha' }),
      entry({ id: 'b', title: 'Brujah Beta' }),
      entry({ id: 'c', title: 'Brujah Gamma' }),
    ];
    const out = rankSearchEntries(entries, 'brujah');
    expect(out.map(r => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('limits to the default cap (30) and honors a custom limit', () => {
    const many: SearchEntry[] = Array.from({ length: 50 }, (_, i) =>
      entry({ id: `e${i}`, title: `Brujah ${i}` }),
    );
    expect(rankSearchEntries(many, 'brujah')).toHaveLength(DEFAULT_SEARCH_LIMIT);
    expect(rankSearchEntries(many, 'brujah', 5)).toHaveLength(5);
  });

  it('is case-insensitive across title, description, body, and subtitle', () => {
    const entries = [
      entry({ title: 'Other', description: 'CONTAINS THE WORD' }),
      entry({ title: 'Other2', body: 'CONTAINS the WORD' }),
      entry({ title: 'Other3', subtitle: 'Contains The Word' }),
    ];
    const out = rankSearchEntries(entries, 'contains the word');
    expect(out).toHaveLength(3);
  });

  it('drops entries with no match at all', () => {
    const entries = [
      entry({ title: 'Brujah' }),
      entry({ title: 'Other', description: 'nope', body: 'nope' }),
    ];
    expect(rankSearchEntries(entries, 'brujah').map(r => r.id)).toEqual(['brujah']);
  });
});

describe('joinSearchableText', () => {
  it('trims, drops empty/non-string parts, and joins with a single space', () => {
    expect(joinSearchableText('  a ', '', undefined, null as unknown as string, 'b  ', '   '))
      .toBe('a b');
  });

  it('returns an empty string when nothing meaningful is given', () => {
    expect(joinSearchableText()).toBe('');
    expect(joinSearchableText('', '   ', undefined)).toBe('');
  });
});

describe('searchSnippet', () => {
  it('returns "" for empty / missing input', () => {
    expect(searchSnippet('')).toBe('');
    expect(searchSnippet(undefined)).toBe('');
    expect(searchSnippet(null)).toBe('');
  });

  it('returns trimmed input verbatim when under the cap', () => {
    expect(searchSnippet('  hello world  ')).toBe('hello world');
  });

  it('truncates and ellipsizes content over the cap', () => {
    const long = 'a'.repeat(SEARCH_SNIPPET_MAX + 50);
    const out = searchSnippet(long);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBe(SEARCH_SNIPPET_MAX + 1); // body + ellipsis
  });
});

// --- buildSearchEntries: journal note indexing ------------------------------

function character(over: Partial<Character> & { id: string; name: string }): Character {
  const base: Character = {
    id: over.id,
    name: over.name,
    clan: over.clan ?? 'brujah',
    edition: over.edition ?? 'V5',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    attributes: {},
    skills: {},
    disciplines: {},
    bloodPotency: 1,
    hunger: 1,
    humanity: 7,
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    experience: 0,
    characterNotes: [],
  } as Character;
  return { ...base, ...over };
}

function note(over: Partial<CharacterNote> & { id: string }): CharacterNote {
  return {
    id: over.id,
    category: over.category ?? 'general',
    title: over.title ?? '',
    body: over.body ?? '',
    createdAt: over.createdAt ?? '2025-01-01T00:00:00.000Z',
    updatedAt: over.updatedAt ?? '2025-01-01T00:00:00.000Z',
  };
}

const emptyInput = {
  edition: 'V5' as const,
  lang: 'en' as const,
  strings: {},
};

describe('buildSearchEntries journal indexing', () => {
  it('emits one entry per non-empty journal note, with type "journal"', () => {
    const characters = [
      character({
        id: 'c1', name: 'Alice',
        characterNotes: [
          note({ id: 'n1', title: 'Found the haven',  body: 'A safehouse in the docks.' }),
          note({ id: 'n2', title: 'Met the Prince',   body: '' }),
          note({ id: 'n3', title: '',                 body: 'I saw a ghoul tonight.' }),
        ],
      }),
    ];
    const entries = buildSearchEntries({ ...emptyInput, characters });
    const journals = entries.filter(e => e.type === 'journal');
    expect(journals).toHaveLength(3);
    expect(journals[0].id).toBe('note:c1:n1');
    expect(journals.every(j => j.subtitle === 'Alice')).toBe(true);
  });

  it('navigates a journal result to the parent character sheet', () => {
    const characters = [
      character({ id: 'cA', name: 'Bob', characterNotes: [note({ id: 'n1', title: 'X' })] }),
    ];
    const [j] = buildSearchEntries({ ...emptyInput, characters }).filter(e => e.type === 'journal');
    expect(j.url).toBe('/personaje');
    expect(j.deepLink?.sessionKeys['vtm-open-character-id']).toBe('cA');
  });

  it('uses a body snippet as the display title when the note title is blank', () => {
    const characters = [
      character({
        id: 'c1', name: 'Alice',
        characterNotes: [note({ id: 'n1', title: '', body: 'I have a secret about the prince.' })],
      }),
    ];
    const [j] = buildSearchEntries({ ...emptyInput, characters }).filter(e => e.type === 'journal');
    expect(j.title).toBe('I have a secret about the prince.');
  });

  it('caps the rendered description at the snippet maximum but keeps full body searchable', () => {
    const longBody = 'a'.repeat(SEARCH_SNIPPET_MAX + 100) + ' needle';
    const characters = [
      character({
        id: 'c1', name: 'Alice',
        characterNotes: [note({ id: 'n1', title: 'Long note', body: longBody })],
      }),
    ];
    const [j] = buildSearchEntries({ ...emptyInput, characters }).filter(e => e.type === 'journal');
    expect(j.description.length).toBeLessThanOrEqual(SEARCH_SNIPPET_MAX + 1);
    // The full body must still be searchable — `body` should include "needle"
    // even though the description was truncated before that word.
    expect(j.body?.includes('needle')).toBe(true);
    // ...and the ranker confirms it as a body-tier match.
    expect(rankSearchEntries([j], 'needle')).toHaveLength(1);
  });

  it('matches by note title (tier 2 includes)', () => {
    const characters = [
      character({
        id: 'c1', name: 'Alice',
        characterNotes: [note({ id: 'n1', title: 'My secret plan', body: '' })],
      }),
    ];
    const entries = buildSearchEntries({ ...emptyInput, characters });
    const matches = rankSearchEntries(entries.filter(e => e.type === 'journal'), 'secret');
    expect(matches).toHaveLength(1);
  });

  it('matches by raw category id (e.g. "secrets")', () => {
    const characters = [
      character({
        id: 'c1', name: 'Alice',
        characterNotes: [note({ id: 'n1', title: 'Whatever', body: 'Body text.', category: 'secrets' })],
      }),
    ];
    const entries = buildSearchEntries({ ...emptyInput, characters });
    const matches = rankSearchEntries(entries.filter(e => e.type === 'journal'), 'secrets');
    expect(matches).toHaveLength(1);
  });

  it('matches by localized category label provided via `strings`', () => {
    const characters = [
      character({
        id: 'c1', name: 'Alice',
        characterNotes: [note({ id: 'n1', title: 'Whatever', body: 'Body text.', category: 'backstory' })],
      }),
    ];
    const entries = buildSearchEntries({
      ...emptyInput,
      strings: { journal_category_backstory: 'Trasfondo' },
      characters,
    });
    const matches = rankSearchEntries(entries.filter(e => e.type === 'journal'), 'trasfondo');
    expect(matches).toHaveLength(1);
  });

  it('drops notes that have neither a title nor a body', () => {
    const characters = [
      character({
        id: 'c1', name: 'Alice',
        characterNotes: [
          note({ id: 'n1', title: '', body: '' }),
          note({ id: 'n2', title: '   ', body: '   ' }),
          note({ id: 'n3', title: 'Keep', body: '' }),
        ],
      }),
    ];
    const entries = buildSearchEntries({ ...emptyInput, characters });
    const journals = entries.filter(e => e.type === 'journal');
    expect(journals.map(j => j.id)).toEqual(['note:c1:n3']);
  });

  it('handles missing / non-array characterNotes safely', () => {
    const characters = [
      character({ id: 'c1', name: 'NoNotes' }),
      // Force a malformed shape past the type system to mirror real-world
      // corrupted localStorage data — should not throw, should not emit.
      character({
        id: 'c2', name: 'BadNotes',
        characterNotes: ('garbage' as unknown) as CharacterNote[],
      }),
    ];
    expect(() => buildSearchEntries({ ...emptyInput, characters })).not.toThrow();
    const entries = buildSearchEntries({ ...emptyInput, characters });
    expect(entries.filter(e => e.type === 'journal')).toEqual([]);
  });

  it('emits a character entry AND a journal entry for the same source character', () => {
    const characters = [
      character({
        id: 'c1', name: 'Bob',
        characterNotes: [note({ id: 'n1', title: 'A note', body: 'Body' })],
      }),
    ];
    const entries = buildSearchEntries({ ...emptyInput, characters });
    expect(entries.filter(e => e.type === 'character')).toHaveLength(1);
    expect(entries.filter(e => e.type === 'journal')).toHaveLength(1);
  });
});
