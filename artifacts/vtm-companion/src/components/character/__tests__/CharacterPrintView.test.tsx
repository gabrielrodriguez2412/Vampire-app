import { describe, it, expect } from 'vitest';
import { dotsString } from '../CharacterPrintView';

describe('dotsString', () => {
  it('renders filled dots up to the rating, then empty dots up to max', () => {
    expect(dotsString(3, 5)).toBe('● ● ● ○ ○');
  });

  it('returns all empty dots when rating is 0', () => {
    expect(dotsString(0, 5)).toBe('○ ○ ○ ○ ○');
  });

  it('returns all filled dots when rating equals max', () => {
    expect(dotsString(5, 5)).toBe('● ● ● ● ●');
  });

  it('clamps ratings above max', () => {
    expect(dotsString(7, 5)).toBe('● ● ● ● ●');
  });

  it('clamps negative ratings to zero', () => {
    expect(dotsString(-2, 5)).toBe('○ ○ ○ ○ ○');
  });

  it('truncates fractional ratings (floor)', () => {
    expect(dotsString(2.7, 5)).toBe('● ● ○ ○ ○');
  });

  it('supports custom max values (e.g. 10 for humanity)', () => {
    expect(dotsString(7, 10)).toBe('● ● ● ● ● ● ● ○ ○ ○');
  });

  it('returns an empty string when max is 0', () => {
    expect(dotsString(0, 0)).toBe('');
    expect(dotsString(3, 0)).toBe('');
  });
});
