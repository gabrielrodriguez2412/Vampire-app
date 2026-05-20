import { describe, it, expect } from 'vitest';
import {
  makeFavoriteKey,
  parseFavoriteKey,
  resolveFavoriteTargets,
} from '../favorites';

describe('makeFavoriteKey / parseFavoriteKey', () => {
  it('returns bare id for clans/disciplines/rules (back-compat)', () => {
    expect(makeFavoriteKey('clan', 'brujah')).toBe('brujah');
    expect(makeFavoriteKey('discipline', 'celerity')).toBe('celerity');
    expect(makeFavoriteKey('rule', 'rule-frenzy')).toBe('rule-frenzy');
  });

  it('namespaces character/chronicle/tool keys', () => {
    expect(makeFavoriteKey('character', 'abc-123')).toBe('character:abc-123');
    expect(makeFavoriteKey('chronicle', 'xyz')).toBe('chronicle:xyz');
    expect(makeFavoriteKey('tool', 'dice')).toBe('tool:dice');
  });

  it('returns empty string for empty target id', () => {
    expect(makeFavoriteKey('character', '')).toBe('');
  });

  it('parses namespaced keys', () => {
    expect(parseFavoriteKey('character:abc-123')).toEqual({ type: 'character', targetId: 'abc-123' });
    expect(parseFavoriteKey('chronicle:xyz')).toEqual({ type: 'chronicle', targetId: 'xyz' });
    expect(parseFavoriteKey('tool:dice')).toEqual({ type: 'tool', targetId: 'dice' });
  });

  it('preserves colons inside the target id', () => {
    expect(parseFavoriteKey('character:foo:bar')).toEqual({ type: 'character', targetId: 'foo:bar' });
  });

  it('returns null for non-namespaced keys', () => {
    expect(parseFavoriteKey('brujah')).toBeNull();
    expect(parseFavoriteKey('celerity')).toBeNull();
    expect(parseFavoriteKey('')).toBeNull();
  });

  it('returns null for unknown namespace prefixes', () => {
    expect(parseFavoriteKey('foo:bar')).toBeNull();
  });

  it('returns null when prefix is present but target id is empty', () => {
    expect(parseFavoriteKey('character:')).toBeNull();
  });
});

describe('resolveFavoriteTargets', () => {
  const datasets = {
    clans: [{ id: 'brujah' }, { id: 'tremere' }],
    disciplines: [{ id: 'celerity' }, { id: 'auspex' }],
    rules: [{ id: 'rule-frenzy' }],
    characters: [{ id: 'char-1' }, { id: 'char-2' }],
    chronicles: [{ id: 'chr-1' }],
  };

  it('buckets raw and namespaced keys correctly', () => {
    const favs = {
      'brujah': true,
      'celerity': true,
      'rule-frenzy': true,
      'character:char-1': true,
      'chronicle:chr-1': true,
    };
    const result = resolveFavoriteTargets(favs, datasets);
    expect(result.clans.map(c => c.id)).toEqual(['brujah']);
    expect(result.disciplines.map(d => d.id)).toEqual(['celerity']);
    expect(result.rules.map(r => r.id)).toEqual(['rule-frenzy']);
    expect(result.characters.map(c => c.id)).toEqual(['char-1']);
    expect(result.chronicles.map(c => c.id)).toEqual(['chr-1']);
    expect(result.total).toBe(5);
    expect(result.missingKeys).toEqual([]);
  });

  it('preserves dataset order even if user favorited in reverse', () => {
    const favs = { 'tremere': true, 'brujah': true };
    const result = resolveFavoriteTargets(favs, datasets);
    expect(result.clans.map(c => c.id)).toEqual(['brujah', 'tremere']);
  });

  it('drops favorites whose targets no longer exist and reports them', () => {
    const favs = {
      'character:gone-uuid': true,
      'chronicle:also-gone': true,
      'unknown-clan-id': true,
      'brujah': true,
    };
    const result = resolveFavoriteTargets(favs, datasets);
    expect(result.clans.map(c => c.id)).toEqual(['brujah']);
    expect(result.characters).toEqual([]);
    expect(result.chronicles).toEqual([]);
    expect(result.total).toBe(1);
    expect(result.missingKeys.sort()).toEqual(
      ['character:gone-uuid', 'chronicle:also-gone', 'unknown-clan-id'].sort(),
    );
  });

  it('ignores entries whose value is false', () => {
    const favs = { 'brujah': true, 'tremere': false };
    const result = resolveFavoriteTargets(favs, datasets);
    expect(result.clans.map(c => c.id)).toEqual(['brujah']);
  });

  it('returns empty buckets for an empty favorites map', () => {
    const result = resolveFavoriteTargets({}, datasets);
    expect(result.total).toBe(0);
    expect(result.clans).toEqual([]);
    expect(result.missingKeys).toEqual([]);
  });
});
