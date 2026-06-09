/**
 * Batch AQ — random character-creation inspiration helpers, phase 1.
 *
 * Non-mechanical inspiration only: names, one-line concepts, sensory
 * appearance notes, behavioural hooks, and short edition-flavoured
 * prompts for the V5 Ambition / Desire / Predator-style and the
 * classic Nature / Demeanor-style identity fields.
 *
 * Everything here is original short content authored for this app —
 * no rulebook tables, no official Archetype or Predator Type names,
 * no copyrighted text. The prompts are deliberately broad and
 * gothic-flavoured so players can riff on them in their own concept
 * fields rather than copy them verbatim.
 *
 * The module is pure — every helper accepts an optional `rng` so tests
 * can drive the picker deterministically without touching Math.random.
 */
import { EditionId } from "../types";

export type GeneratorField =
  | 'name'
  | 'concept'
  | 'appearance'
  | 'personality'
  | 'ambition'
  | 'desire'
  | 'predator'
  | 'nature'
  | 'demeanor';

// ---------------------------------------------------------------------------
// Pools — short, original, gothic. Keep entries terse and evocative; the
// prompts are meant to spark a concept, not script it.
// ---------------------------------------------------------------------------

const NAMES: readonly string[] = [
  "Adela Voss",
  "Beatrice Hennig",
  "Cassian Reyes",
  "Damir Kraneck",
  "Eliska Marek",
  "Halil Kaya",
  "Inez Rovilescu",
  "Jonas Aldred",
  "Kira Solberg",
  "Lucien Aubertin",
  "Mateusz Stark",
  "Naomi Kirschbaum",
  "Otto Vance",
  "Pilar Mendéz",
  "Renata Halász",
  "Sergei Vlachos",
  "Tomas Berga",
  "Yara Constanin",
  "Zofia Wendel",
];

const CONCEPTS: readonly string[] = [
  "Disgraced surgeon",
  "Cold-eyed librarian",
  "Burned-out crime reporter",
  "Late-shift paramedic",
  "Bartender with a long memory",
  "Anonymous gallery curator",
  "Night-court translator",
  "Defrocked seminarian",
  "Mortuary photographer",
  "Subway-line conductor",
  "Estate-sale appraiser",
  "Retired stage magician",
  "Punk-club bouncer",
  "Public-defender investigator",
  "Reluctant fixer",
  "Junior funeral director",
];

const APPEARANCES: readonly string[] = [
  "Always slightly underdressed for the weather",
  "Pale knuckles, perpetually clenched",
  "An old burn scar across the jaw",
  "Eyes too steady, like still water",
  "Hair pulled tight enough to ache",
  "Hands that smell faintly of antiseptic",
  "A single piece of expensive jewellery that doesn't match anything else",
  "Threadbare collar on an otherwise immaculate coat",
  "Walks with a deliberate, measured stride",
  "Never quite warm to the touch",
  "Wears a watch that doesn't run",
  "Looks fed even when they aren't",
];

const PERSONALITIES: readonly string[] = [
  "Counts every doorway they pass",
  "Refuses to look in mirrors after midnight",
  "Answers questions with another question",
  "Apologises to inanimate objects",
  "Remembers names but pretends not to",
  "Pockets small things that aren't theirs",
  "Catalogues exits without thinking",
  "Trusts dogs faster than people",
  "Speaks softer when angry",
  "Keeps a list of debts in a worn notebook",
  "Always knows what time it is, never carries a phone",
  "Laughs a half-beat too late",
];

const V5_AMBITIONS: readonly string[] = [
  "Buy back the family estate, brick by brick",
  "Identify the sire who turned me, and decide what to do about it",
  "Outlive every living relative without their notice",
  "Earn a seat at a table I was never invited to",
  "Find the one person I left behind, intact",
  "Build a small empire of small favours",
  "Make the city remember a name nobody knows",
  "Burn down what I used to belong to",
];

const V5_DESIRES: readonly string[] = [
  "A safe place to feed tonight",
  "An answer from someone who refuses to reply",
  "Five undisturbed minutes alone",
  "A clean exit from a conversation that's already gone wrong",
  "A favour I can call in by dawn",
  "An old habit, just for tonight",
  "A single honest sentence from anyone",
  "Proof that someone is still looking",
];

// Original short flavour for V5's Predator-style identity field. These
// are setting-flavour prompts — they intentionally do not name or
// paraphrase any official Predator Type, and they do not encode any
// mechanical rule. Players are expected to translate them into the
// vocabulary their table actually uses.
const V5_PREDATOR_PROMPTS: readonly string[] = [
  "Hunts in late-night clinics",
  "Skims tourists at the train station",
  "Trades favours for veins",
  "Prefers willing companions",
  "Walks the long way home with a steady pulse beside them",
  "Knows which bartenders pour the heaviest after midnight",
  "Returns to the same alley twice a week, never three times",
  "Keeps a contact list of the unmissable",
];

// Original short flavour for classic Nature / Demeanor — single-line
// behavioural sketches. NOT the official V20 Archetype names, NOT the
// official Archetype rules text.
const CLASSIC_NATURES: readonly string[] = [
  "Quietly observant",
  "Hungry for approval",
  "Restless under praise",
  "Patient until cornered",
  "Loyal in private, prickly in public",
  "Calmer the worse things get",
  "Stubborn about small things",
  "Forgiving but never forgetful",
];

const CLASSIC_DEMEANORS: readonly string[] = [
  "Flippant under pressure",
  "Polished and unreadable",
  "Warm at a distance, distant up close",
  "Brisk, with an undertone of kindness",
  "Tired but unfailingly polite",
  "Watchful, smiling on purpose",
  "Earnest enough to be disarming",
  "Casually elegant, casually rude",
];

// ---------------------------------------------------------------------------
// Public picker helpers. Every function accepts an optional `rng`
// argument so tests can pin the output deterministically.
// ---------------------------------------------------------------------------

/** Pick one entry from `pool` using `rng` (defaults to Math.random). */
export function pickRandom<T>(pool: readonly T[], rng: () => number = Math.random): T {
  if (pool.length === 0) {
    throw new Error('pickRandom: pool is empty');
  }
  const idx = Math.floor(rng() * pool.length) % pool.length;
  return pool[idx];
}

/** Pool that backs each field for the active edition. */
export function poolFor(field: GeneratorField, edition: EditionId): readonly string[] {
  switch (field) {
    case 'name': return NAMES;
    case 'concept': return CONCEPTS;
    case 'appearance': return APPEARANCES;
    case 'personality': return PERSONALITIES;
    case 'ambition': return edition === 'V5' ? V5_AMBITIONS : [];
    case 'desire': return edition === 'V5' ? V5_DESIRES : [];
    case 'predator': return edition === 'V5' ? V5_PREDATOR_PROMPTS : [];
    case 'nature': return edition === 'V5' ? [] : CLASSIC_NATURES;
    case 'demeanor': return edition === 'V5' ? [] : CLASSIC_DEMEANORS;
  }
}

/**
 * Return whether a given inspiration field is available for the given
 * edition. The UI uses this to decide whether to render the per-field
 * suggestion button — V5 sheets don't expose Nature/Demeanor, classic
 * sheets don't expose Ambition/Desire/Predator.
 */
export function isFieldAvailable(field: GeneratorField, edition: EditionId): boolean {
  return poolFor(field, edition).length > 0;
}

/** Generate a single suggestion for the given field + edition. */
export function generateSuggestion(
  field: GeneratorField,
  edition: EditionId,
  rng: () => number = Math.random,
): string {
  const pool = poolFor(field, edition);
  if (pool.length === 0) return '';
  return pickRandom(pool, rng);
}

/**
 * Generate a full inspiration bundle. Used by the create form's
 * "Inspiration" panel to refresh the appearance + personality prompts
 * in one click. Returns an object — each field is independently picked.
 */
export interface InspirationBundle {
  appearance: string;
  personality: string;
}

export function generateInspirationBundle(
  rng: () => number = Math.random,
): InspirationBundle {
  return {
    appearance: pickRandom(APPEARANCES, rng),
    personality: pickRandom(PERSONALITIES, rng),
  };
}
