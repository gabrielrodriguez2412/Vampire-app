// V5-style dice helpers.
// Pure evaluator + a thin random roller so tests can exercise evaluation
// without depending on randomness.

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface DiceRoll {
  normal: DieValue[];
  hunger: DieValue[];
}

export interface V5RollResult {
  normal: DieValue[];
  hunger: DieValue[];
  /** Total successes including critical bonus. */
  successes: number;
  /** Number of critical pairs (each pair contributes 4 successes total). */
  criticalPairs: number;
  /** Critical pair that includes at least one Hunger 10. */
  messyCritical: boolean;
  /** Zero successes AND at least one Hunger 1. */
  bestialFailure: boolean;
  /** Total dice rolled (normal + hunger). */
  poolSize: number;
}

/**
 * Roll a V5 dice pool. Hunger dice replace normal dice; if hungerDice > poolSize
 * the entire pool is hunger.
 */
export function rollDice(
  poolSize: number,
  hungerDice: number,
  rng: () => number = Math.random,
): DiceRoll {
  const safePool = Math.max(0, Math.floor(poolSize));
  const safeHunger = Math.max(0, Math.min(Math.floor(hungerDice), safePool));
  const normalCount = safePool - safeHunger;

  const rollOne = (): DieValue => (Math.floor(rng() * 10) + 1) as DieValue;
  return {
    normal: Array.from({ length: normalCount }, rollOne),
    hunger: Array.from({ length: safeHunger }, rollOne),
  };
}

/**
 * V5-style evaluation:
 *  - 6+ is a success
 *  - Each pair of 10s adds 2 bonus successes (pair = 4 total)
 *  - Messy Critical: any critical pair when at least one Hunger 10 is present
 *  - Bestial Failure: zero successes and at least one Hunger 1
 *
 * Needs Review: exact pairing rules for messy criticals can vary by table —
 * we use the common interpretation that any Hunger 10 taints any critical.
 */
export function evaluateV5Roll(roll: DiceRoll): V5RollResult {
  const normalTens = roll.normal.filter(d => d === 10).length;
  const hungerTens = roll.hunger.filter(d => d === 10).length;
  const hungerOnes = roll.hunger.filter(d => d === 1).length;

  const baseSuccesses =
    roll.normal.filter(d => d >= 6).length +
    roll.hunger.filter(d => d >= 6).length;

  const totalTens = normalTens + hungerTens;
  const criticalPairs = Math.floor(totalTens / 2);
  const successes = baseSuccesses + criticalPairs * 2;

  return {
    normal: roll.normal,
    hunger: roll.hunger,
    successes,
    criticalPairs,
    messyCritical: criticalPairs > 0 && hungerTens > 0,
    bestialFailure: successes === 0 && hungerOnes > 0,
    poolSize: roll.normal.length + roll.hunger.length,
  };
}

// ---------------------------------------------------------------------------
// Classic d10 (V20 / 2nd / Revised) helpers.
// ---------------------------------------------------------------------------

export interface ClassicRollResult {
  dice: DieValue[];
  /** Total successes counted against difficulty. */
  successes: number;
  /** Net successes after 1s cancel; never below zero. */
  netSuccesses: number;
  /** Number of dice that rolled a 1. */
  ones: number;
  /** Number of dice >= difficulty (before 1s cancel). */
  rawSuccesses: number;
  /** Difficulty used. Clamped to [2, 10]. */
  difficulty: number;
  /** Total dice in the pool. */
  poolSize: number;
  /** True when zero raw successes AND at least one 1 (classic botch). */
  botch: boolean;
}

/**
 * Roll a pool of d10 for classic editions. No hunger dice — pool is flat.
 */
export function rollClassicDice(poolSize: number, rng: () => number = Math.random): DieValue[] {
  const safePool = Math.max(0, Math.floor(poolSize));
  const rollOne = (): DieValue => (Math.floor(rng() * 10) + 1) as DieValue;
  return Array.from({ length: safePool }, rollOne);
}

/**
 * Classic V20-style evaluation:
 *  - Each die >= difficulty is a success.
 *  - Each 1 cancels one success.
 *  - Botch: zero raw successes AND at least one 1.
 *  - Net successes are clamped to >= 0.
 *
 * Needs Review: some editions/specialties count 10s as two successes; this
 * helper does not apply that rule. Treat botch handling beyond the standard
 * V20 reading as table-specific.
 */
export function evaluateClassicRoll(dice: DieValue[], difficulty: number): ClassicRollResult {
  const clampedDifficulty = Math.max(2, Math.min(10, Math.floor(difficulty)));
  const rawSuccesses = dice.filter(d => d >= clampedDifficulty).length;
  const ones = dice.filter(d => d === 1).length;
  const netSuccesses = Math.max(0, rawSuccesses - ones);

  return {
    dice,
    successes: netSuccesses,
    netSuccesses,
    ones,
    rawSuccesses,
    difficulty: clampedDifficulty,
    poolSize: dice.length,
    botch: rawSuccesses === 0 && ones > 0,
  };
}
