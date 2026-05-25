import { describe, it, expect } from 'vitest';
import { isEditionInScope } from '../content';
import type { EditionId } from '../../types';

/**
 * `isEditionInScope` is the gate that decides whether an entry tagged
 * with an `EditionScope` should appear when the user has a given
 * `EditionId` selected. It backs both the Roleplay and Glossary pages,
 * so a regression here would visibly leak V5-only content into V20
 * (the original Batch B QA bug).
 */
const CLASSIC_EDITIONS: EditionId[] = ['V20', 'REVISED', '2ND', '1ST'];

describe('isEditionInScope', () => {
  it('universal scope (null / undefined) is visible on every edition', () => {
    for (const ed of ['V5', ...CLASSIC_EDITIONS] as EditionId[]) {
      expect(isEditionInScope(null, ed)).toBe(true);
      expect(isEditionInScope(undefined, ed)).toBe(true);
    }
  });

  it('v5 scope is visible only on V5', () => {
    expect(isEditionInScope('v5', 'V5')).toBe(true);
    for (const ed of CLASSIC_EDITIONS) {
      expect(isEditionInScope('v5', ed)).toBe(false);
    }
  });

  it('classic scope is visible on every classic edition and hidden on V5', () => {
    expect(isEditionInScope('classic', 'V5')).toBe(false);
    for (const ed of CLASSIC_EDITIONS) {
      expect(isEditionInScope('classic', ed)).toBe(true);
    }
  });
});
