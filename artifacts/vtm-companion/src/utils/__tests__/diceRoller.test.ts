import { describe, it, expect } from 'vitest';
import { rollDice, evaluateV5Roll, rollClassicDice, evaluateClassicRoll, DieValue } from '../diceRoller';

function makeRoll(normal: number[], hunger: number[]) {
  return { normal: normal as DieValue[], hunger: hunger as DieValue[] };
}

describe('rollDice', () => {
  it('splits pool into normal + hunger dice', () => {
    const seq = [0, 0, 0, 0, 0]; // every die rolls a 1
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const result = rollDice(5, 2, rng);
    expect(result.normal).toHaveLength(3);
    expect(result.hunger).toHaveLength(2);
  });

  it('clamps hunger to pool size', () => {
    const result = rollDice(3, 99, () => 0.5);
    expect(result.normal).toHaveLength(0);
    expect(result.hunger).toHaveLength(3);
  });

  it('returns empty roll for pool 0', () => {
    const result = rollDice(0, 0, () => 0.5);
    expect(result.normal).toHaveLength(0);
    expect(result.hunger).toHaveLength(0);
  });

  it('produces values in [1, 10]', () => {
    const result = rollDice(50, 10, Math.random);
    [...result.normal, ...result.hunger].forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    });
  });
});

describe('evaluateV5Roll', () => {
  it('counts 6+ as successes', () => {
    const r = evaluateV5Roll(makeRoll([1, 5, 6, 7, 9], []));
    expect(r.successes).toBe(3);
    expect(r.criticalPairs).toBe(0);
    expect(r.messyCritical).toBe(false);
    expect(r.bestialFailure).toBe(false);
  });

  it('awards bonus successes for pairs of 10s', () => {
    // two 10s = 1 pair = 2 base successes + 2 bonus = 4
    const r = evaluateV5Roll(makeRoll([10, 10, 5], []));
    expect(r.criticalPairs).toBe(1);
    expect(r.successes).toBe(4);
  });

  it('two pairs of 10s give two bonuses', () => {
    const r = evaluateV5Roll(makeRoll([10, 10, 10, 10], []));
    expect(r.criticalPairs).toBe(2);
    expect(r.successes).toBe(8);
  });

  it('lone 10 is just one success', () => {
    const r = evaluateV5Roll(makeRoll([10, 5, 5], []));
    expect(r.criticalPairs).toBe(0);
    expect(r.successes).toBe(1);
  });

  it('marks messy critical when a critical pair includes a hunger 10', () => {
    const r = evaluateV5Roll(makeRoll([10], [10]));
    expect(r.criticalPairs).toBe(1);
    expect(r.messyCritical).toBe(true);
  });

  it('does NOT mark messy critical for an all-normal critical', () => {
    const r = evaluateV5Roll(makeRoll([10, 10], [5]));
    expect(r.messyCritical).toBe(false);
  });

  it('marks bestial failure when 0 successes and hunger 1 present', () => {
    const r = evaluateV5Roll(makeRoll([2, 3], [1, 4]));
    expect(r.successes).toBe(0);
    expect(r.bestialFailure).toBe(true);
  });

  it('hunger 1 with successes is NOT bestial failure', () => {
    const r = evaluateV5Roll(makeRoll([6], [1]));
    expect(r.successes).toBe(1);
    expect(r.bestialFailure).toBe(false);
  });

  it('zero successes without hunger 1 is plain failure', () => {
    const r = evaluateV5Roll(makeRoll([2, 3], [4, 5]));
    expect(r.successes).toBe(0);
    expect(r.bestialFailure).toBe(false);
  });

  it('reports pool size', () => {
    const r = evaluateV5Roll(makeRoll([5, 6, 7], [8, 9]));
    expect(r.poolSize).toBe(5);
  });

  it('empty pool yields zero successes and no specials', () => {
    const r = evaluateV5Roll(makeRoll([], []));
    expect(r.successes).toBe(0);
    expect(r.criticalPairs).toBe(0);
    expect(r.messyCritical).toBe(false);
    expect(r.bestialFailure).toBe(false);
    expect(r.poolSize).toBe(0);
  });
});

describe('rollClassicDice', () => {
  it('produces values in [1, 10]', () => {
    const dice = rollClassicDice(40, Math.random);
    dice.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    });
  });

  it('returns empty array for pool 0 or negative', () => {
    expect(rollClassicDice(0, () => 0.5)).toHaveLength(0);
    expect(rollClassicDice(-3, () => 0.5)).toHaveLength(0);
  });

  it('respects pool size', () => {
    expect(rollClassicDice(7, () => 0.5)).toHaveLength(7);
  });
});

describe('evaluateClassicRoll', () => {
  const dice = (...vals: number[]) => vals as DieValue[];

  it('counts dice >= difficulty as successes', () => {
    const r = evaluateClassicRoll(dice(6, 7, 8, 9, 10), 6);
    expect(r.rawSuccesses).toBe(5);
    expect(r.successes).toBe(5);
  });

  it('1s cancel successes one-for-one', () => {
    const r = evaluateClassicRoll(dice(7, 8, 1, 1), 6);
    expect(r.rawSuccesses).toBe(2);
    expect(r.ones).toBe(2);
    expect(r.netSuccesses).toBe(0);
  });

  it('net successes are clamped to zero, not negative', () => {
    const r = evaluateClassicRoll(dice(6, 1, 1, 1), 6);
    expect(r.netSuccesses).toBe(0);
  });

  it('botch: zero raw successes AND at least one 1', () => {
    const r = evaluateClassicRoll(dice(2, 3, 4, 1), 6);
    expect(r.rawSuccesses).toBe(0);
    expect(r.botch).toBe(true);
  });

  it('not a botch: zero successes but no 1s', () => {
    const r = evaluateClassicRoll(dice(2, 3, 4, 5), 6);
    expect(r.botch).toBe(false);
  });

  it('not a botch: has at least one success', () => {
    const r = evaluateClassicRoll(dice(7, 1, 1, 1), 6);
    expect(r.rawSuccesses).toBe(1);
    expect(r.botch).toBe(false);
  });

  it('clamps difficulty below 2', () => {
    const r = evaluateClassicRoll(dice(2, 5, 7), 0);
    expect(r.difficulty).toBe(2);
    expect(r.rawSuccesses).toBe(3);
  });

  it('clamps difficulty above 10', () => {
    const r = evaluateClassicRoll(dice(9, 10), 99);
    expect(r.difficulty).toBe(10);
    expect(r.rawSuccesses).toBe(1);
  });

  it('handles empty pool', () => {
    const r = evaluateClassicRoll([], 6);
    expect(r.poolSize).toBe(0);
    expect(r.successes).toBe(0);
    expect(r.botch).toBe(false);
  });
});
