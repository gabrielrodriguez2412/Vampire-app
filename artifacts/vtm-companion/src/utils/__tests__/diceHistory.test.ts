import { describe, it, expect } from 'vitest';
import {
  recordRoll,
  clearHistory,
  ROLL_HISTORY_MAX,
  RollHistoryEntry,
} from '../diceHistory';

function entry(id: string, summary = `Roll ${id}`): RollHistoryEntry {
  return { id, kind: 'v5', summary, timestamp: 0 };
}

describe('recordRoll (Batch AL)', () => {
  it('prepends new entries (newest at index 0)', () => {
    const first = entry('a');
    const second = entry('b');
    const next = recordRoll([first], second);
    expect(next[0]).toBe(second);
    expect(next[1]).toBe(first);
  });

  it('does not mutate the input array', () => {
    const start: RollHistoryEntry[] = [entry('a')];
    const before = [...start];
    recordRoll(start, entry('b'));
    expect(start).toEqual(before);
  });

  it('caps the list at ROLL_HISTORY_MAX entries (default 10)', () => {
    expect(ROLL_HISTORY_MAX).toBe(10);
    let list: RollHistoryEntry[] = [];
    // Push 15 distinct entries through; only the most recent 10 should remain.
    for (let i = 0; i < 15; i++) list = recordRoll(list, entry(`r-${i}`));
    expect(list.length).toBe(10);
    // The newest entry (r-14) is at the head; the oldest survivor is r-5.
    expect(list[0].id).toBe('r-14');
    expect(list[list.length - 1].id).toBe('r-5');
  });

  it('handles all three roll kinds without coercing the discriminator', () => {
    const v5: RollHistoryEntry = { id: '1', kind: 'v5', summary: 'a', timestamp: 0 };
    const classic: RollHistoryEntry = { id: '2', kind: 'classic', summary: 'b', timestamp: 0 };
    const rouse: RollHistoryEntry = { id: '3', kind: 'rouse', summary: 'c', timestamp: 0 };
    const list = recordRoll(recordRoll(recordRoll([], v5), classic), rouse);
    expect(list.map(e => e.kind)).toEqual(['rouse', 'classic', 'v5']);
  });
});

describe('clearHistory (Batch AL)', () => {
  it('returns an empty array', () => {
    expect(clearHistory()).toEqual([]);
  });
});
