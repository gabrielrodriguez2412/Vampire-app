export type EditionId = '1ST' | '2ND' | 'REVISED' | 'V20' | 'V5';
export type LangCode = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it';

export interface Edition {
  id: EditionId;
  name: string;
  shortName: string;
  year: number;
}

export interface Language {
  code: LangCode;
  name: string;
  nativeName: string;
  flag: string;
}

export interface ClanEntry {
  id: string;
  name: Record<LangCode, string>;
  alternateNames?: Partial<Record<EditionId, Record<LangCode, string>>>;
  editionAvailability: EditionId[];
  /**
   * Default ("classic-era") sect/affiliation label. Used when no
   * `sectByEdition` override is set for the active edition. Kept as a
   * single multilingual record so it can be filled gradually.
   */
  sect: Record<LangCode, string>;
  /**
   * Optional per-edition sect overrides. Use this when a clan's
   * affiliation shifts meaningfully between editions — for example,
   * Lasombra reading as Sabbat in classic editions but joining the
   * Camarilla in V5, or Banu Haqim diverging from the Assamites'
   * Independent stance once they joined the Camarilla.
   *
   * `getClanSect()` in `utils/content.ts` resolves the right label:
   * override first, fall back to `sect`.
   */
  sectByEdition?: Partial<Record<EditionId, Record<LangCode, string>>>;
  summary: Record<LangCode, string>;
  /**
   * Optional per-edition summary overrides (Batch T).
   *
   * Use when the short clan summary actually needs different wording
   * between editions — most clans don't, since the short pitch is the
   * same. When present, `getLocalizedClanSummary(clan, edition, lang)`
   * prefers the override; otherwise it falls back to the flat
   * `summary` field above. Editions not listed here always use the
   * flat field.
   */
  summaryByEdition?: Partial<Record<EditionId, Record<LangCode, string>>>;
  weakness: Record<LangCode, string>;
  /**
   * Optional per-edition weakness/bane overrides (Batch T).
   *
   * Several clans had their weakness paragraph baked as "In earlier
   * editions, X. In V5, Y." — useful as encyclopaedia copy, painful
   * inside the clan detail page when the user has explicitly picked
   * one edition. Populate this map to give each edition its own
   * stand-alone text; the flat `weakness` field stays populated as
   * the default for unspecified editions and as the search-index
   * source of truth.
   */
  weaknessByEdition?: Partial<Record<EditionId, Record<LangCode, string>>>;
  /**
   * Union of every discipline this clan can have across all editions.
   * Used as the default list when no edition-specific override exists,
   * and as the source for cross-references (search index, validation,
   * discipline-page `clansWhoUse` consistency).
   *
   * The visible per-edition list is resolved through
   * `getClanDisciplinesForEdition(clan, edition)` in `utils/content.ts`,
   * which prefers `disciplinesByEdition[edition]` when populated and
   * otherwise falls back to this flat list (filtered by each
   * discipline's own `editions`).
   */
  disciplines: string[];
  /**
   * Optional per-edition discipline overrides (Batch S).
   *
   * Use this when a clan's discipline trio actually CHANGES between
   * editions in ways the natural discipline.editions filter can't
   * express — e.g., Giovanni → Hecata swapping Dominate / Potence (V20)
   * for Auspex / Fortitude (V5); Tzimisce swapping Auspex (V20) for
   * Dominate (V5); Ravnos losing Fortitude in V5; Salubri carrying
   * Dominate in V5 and Valeren in V20; Ministry losing Protean in V20.
   *
   * Each entry lists ONLY the discipline ids that should appear for
   * that edition — replacing (not extending) the default `disciplines`
   * list for that edition. Edition keys not present here fall back to
   * the default. See `getClanDisciplinesForEdition` for resolution.
   */
  disciplinesByEdition?: Partial<Record<EditionId, string[]>>;
  icon: string;
  bannerImage: string;
  colorTheme: string;
  lore: Record<LangCode, string>;
  /**
   * Optional per-edition lore overrides (Batch T).
   *
   * The base `lore` paragraph often slipped into "X in earlier
   * editions, Y in modern nights" prose so the encyclopaedia entry
   * could cover both eras. On the clan detail page that read as a
   * leak (V20 readers seeing V5 framing and vice versa). Populating
   * this map gives each edition its own stand-alone narrative; the
   * flat field stays as the default and the search-index source.
   */
  loreByEdition?: Partial<Record<EditionId, Record<LangCode, string>>>;
  playableStatus: Partial<Record<EditionId, boolean>>;
  sourceEdition: EditionId;
}

export interface DisciplineEntry {
  id: string;
  editions: EditionId[];
  name: string;
  type: Record<LangCode, string>;
  description: Record<LangCode, string>;
  powers: {
    name: string;
    level: number;
    description: Record<LangCode, string>;
    tacticalUse: Record<LangCode, string>;
  }[];
  narrativeUses: Record<LangCode, string[]>;
  clansWhoUse: string[];
  isSubdiscipline?: boolean;
  parentDiscipline?: string;
  /**
   * Optional grouped sections for blood-magic style systems that don't fit
   * the flat 1–5 powers list — Thaumaturgy / Necromancy paths and rituals,
   * Blood Sorcery rituals, Oblivion ceremonies, Thin-Blood Alchemy formulae.
   * Backwards-compatible: omitted on disciplines that only use `powers`.
   */
  specialSystems?: DisciplineSpecialSection[];
}

export type DisciplineSpecialKind = 'paths' | 'rituals' | 'ceremonies' | 'formulae' | 'other';

/**
 * A grouped block of special items inside a discipline. A discipline may
 * have several sections (e.g., Thaumaturgy has both paths AND rituals).
 */
export interface DisciplineSpecialSection {
  id: string;
  kind: DisciplineSpecialKind;
  title: Record<LangCode, string>;
  /** Optional short framing sentence shown above the item list. */
  description?: Record<LangCode, string>;
  /** Marks the whole section as needing manual content review. */
  needsReview?: boolean;
  items: DisciplineSpecialItem[];
}

export interface DisciplineSpecialItem {
  id: string;
  name: string;
  /** Optional dot/level for items that are level-gated (paths, formulae). */
  level?: number;
  summary: Record<LangCode, string>;
  /** Per-item needs-review flag for individual placeholder entries. */
  needsReview?: boolean;
}

export interface RuleEntry {
  id: string;
  editions: EditionId[];
  title: Record<LangCode, string>;
  /**
   * Primary category. Kept for back-compat: older callers read this single
   * field. When `categories` is present, treat it as authoritative and use
   * this only as a fallback / `categories[0]`.
   */
  category: string;
  /**
   * Optional multi-category list. When present, the rule belongs to every
   * listed category (e.g. a frenzy entry that lives in both "Beast" and
   * "Combat"). When omitted, treat as `[category]`.
   */
  categories?: string[];
  shortExplanation: Record<LangCode, string>;
  fullExplanation: Record<LangCode, string>;
  examples: Record<LangCode, string[]>;
  quickNotes: Record<LangCode, string[]>;
  tags: string[];
}

/**
 * Edition-scope tag for glossary entries (and roleplay tips). Most entries
 * apply to every edition (`null`). Some concepts (Hunger as a die mechanic,
 * Predator Type, Touchstones, Blood Potency, Resonance) are V5-specific.
 * A few (Blood Pool spending, classic Paths of Enlightenment) belong to the
 * older editions. The UI surfaces this as a small badge so players know
 * when an entry is *not* universal.
 */
export type EditionScope = 'v5' | 'classic' | null;

export interface GlossaryEntry {
  id: string;
  term: Record<LangCode, string>;
  definition: Record<LangCode, string>;
  related: string[];
  /** Optional edition-scope tag. Omit or set to null when the term is universal. */
  edition?: EditionScope;
}

/**
 * A discipline entry can be either:
 *   - a plain number (legacy shape — just the dot rating), or
 *   - an object with `rating` and an optional `powers` list (when the character knows specific powers).
 * Stored data may use either form interchangeably; readers should tolerate both.
 */
export type DisciplineValue = number | { rating: number; powers?: string[] };

/**
 * Tag identifying whether a character is a Player Character or a Storyteller's NPC.
 * Optional on the type so legacy characters loaded from storage still satisfy `Character`;
 * `getCharacters` normalizes missing values to `'player'`.
 */
export type CharacterType = 'player' | 'npc';

/**
 * Batch AX — coarse character "kind" discriminator, orthogonal to both
 * `edition` and `characterType`. Phase 1 only introduces the data model
 * and creation option; sheet rendering still uses the existing vampire
 * schemas for every kind. Future phases will route schemas through
 * `kind` as well.
 *
 * Defaults to `'vampire'` on read for any legacy or missing/invalid value
 * — see `normalizeCharacterKind` in `services/characterStorage.ts`. This
 * means every character saved before this batch loads identically.
 */
export type CharacterKind = 'vampire' | 'human' | 'ghoul';

/**
 * Coarse categories used to tag inventory items.
 *
 * Phase 2 (Inventory specialization) added: `document`, `vehicle`, `occult`,
 * `personal`. The original 6 categories (weapon, armor, tool, equipment,
 * money, other) are preserved for backward compatibility — existing saved
 * inventories with those values keep working unchanged.
 */
export type InventoryCategory =
  | 'weapon' | 'armor' | 'tool' | 'equipment' | 'money' | 'other'
  | 'document' | 'vehicle' | 'occult' | 'personal';

/** A single inventory entry on a character. */
export interface InventoryItem {
  id: string;
  name: string;
  quantity?: number;
  category?: InventoryCategory;
  notes?: string;
  /** Whether the item is currently equipped / carried. Optional, backward-compatible. */
  equipped?: boolean;
}

/**
 * Categories used to tag character journal entries. Unknown / legacy values
 * are normalized to `'other'` by `normalizeCharacterNotes`.
 */
export type CharacterNoteCategory =
  | 'general'
  | 'backstory'
  | 'goals'
  | 'secrets'
  | 'contacts'
  | 'session'
  | 'other';

/**
 * One journal entry on a character. Stored as an array on `BaseCharacter`
 * under `characterNotes`. The legacy free-text `notes: string` field is kept
 * untouched for backward compatibility — `normalizeCharacterNotes` seeds a
 * single 'general' entry from it when no structured notes exist, but never
 * deletes it.
 */
export interface CharacterNote {
  id: string;
  category: CharacterNoteCategory;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Character lifecycle status. Mirrors `ChronicleStatus`. Optional and
 * backward-compatible: characters saved before this field existed simply omit
 * it, and `getCharacters` normalizes a missing/unknown value to 'active'.
 */
export type CharacterStatus = 'active' | 'archived';

export interface BaseCharacter {
  id: string;
  name: string;
  playerName?: string;
  chronicle?: string;
  /** 'active' or 'archived'. Defaults to 'active' on load via getCharacters normalization. */
  status?: CharacterStatus;
  /**
   * Optional link to a Chronicle's `id`. Legacy characters and characters
   * created before this field was introduced will not have it; `getCharacters`
   * normalizes missing/blank values to `undefined`. A Chronicle's deletion
   * leaves dangling ids — the UI must tolerate ids that no longer resolve.
   */
  chronicleId?: string;
  concept?: string;
  edition: EditionId;
  clan: string;
  sire?: string;
  sect?: string;
  notes?: string;
  /**
   * Structured journal entries. Optional and backward-compatible — characters
   * saved before this field existed simply omit it. `getCharacters` normalizes
   * missing/malformed values to `[]` (or seeds a single entry from a non-empty
   * legacy `notes` string if no structured notes exist yet).
   */
  characterNotes?: CharacterNote[];
  /** 'player' or 'npc'. Defaults to 'player' on load via getCharacters normalization. */
  characterType?: CharacterType;
  /**
   * Batch AX — 'vampire' | 'human' | 'ghoul'. Optional and backward-compatible:
   * a character saved before this batch is missing the field and is
   * normalized to `'vampire'` on load. Phase 1 does NOT change sheet
   * rendering by kind — humans and ghouls render with the existing
   * vampire-shaped sheet plus a visible Kind label.
   */
  kind?: CharacterKind;
  /**
   * Batch BE-1 — opt-in morality tracker visibility for Human / Ghoul
   * sheets. Defaults to `false` (or absent → treated as `false`). When
   * `true` and `kind` is `'human'` or `'ghoul'`, the sheet exposes the
   * existing optional `humanity` field as a Humanity / Path dots-10
   * tracker. Has no effect when `kind === 'vampire'` — vampire sheets
   * always show Humanity per their schemas, regardless of this flag.
   * Additive and backward-compatible: legacy characters that lack the
   * field continue to render exactly as before.
   */
  trackMorality?: boolean;
  /**
   * Batch BG — opt-in Vitae tracker visibility for classic-edition
   * Ghoul sheets. Defaults to `false` (or absent → treated as `false`).
   * When `true` and `kind === 'ghoul'` and `edition !== 'V5'`, the
   * sheet exposes the existing optional `bloodPool` field as a "Vitae"
   * tracker (labelled distinctly from the vampire's "Blood Pool" but
   * reusing the same `ClassicPoolTracker` visual). Has no effect on
   * vampires (their Blood Pool is schema-driven), on humans (no vitae,
   * ever), or on V5 ghouls (deferred per the BF audit §3). Independent
   * of `trackMorality` — a ghoul can opt into either, both, or neither.
   * Additive and backward-compatible.
   */
  trackVitae?: boolean;
  /**
   * Batch BI-1 — opt-in Powers section visibility for classic-edition
   * Ghoul sheets. Defaults to `false` (or absent → treated as `false`).
   * When `true` and `kind === 'ghoul'` and `edition !== 'V5'`, the
   * sheet exposes the existing `disciplines` map under a distinct
   * "Powers" section header that uses a constrained variant of the
   * existing DisciplineList UI (no "Add all suggested" bulk action).
   * Has no effect on vampires (their Disciplines is schema-driven), on
   * humans (no powers, ever), or on V5 ghouls (deferred per the BI
   * audit). Independent of `trackMorality` and `trackVitae`. The flag
   * controls visibility only — enabling does NOT seed any data,
   * disabling does NOT erase the `disciplines` map. Additive and
   * backward-compatible.
   */
  trackGhoulPowers?: boolean;
  /**
   * Batch BJ — per-character dismissal flags for the inline dormant-data
   * prompts. Each flag suppresses the matching prompt on future Edit-Mode
   * opens without touching the underlying dormant value: a user who
   * dismisses can still opt-in later via the existing toggle, and the
   * data on disk is preserved verbatim either way. Independent of the
   * matching `track*` flag (a character may be dismissed-and-not-tracking,
   * tracking-without-dismissal, etc.). Additive and backward-compatible.
   */
  dismissedDormantMoralityPrompt?: boolean;
  dismissedDormantVitaePrompt?: boolean;
  dismissedDormantPowersPrompt?: boolean;
  /** Inventory items. `getCharacters` normalizes missing/malformed values to `[]`. */
  inventory?: InventoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface V5Character extends BaseCharacter {
  edition: 'V5';
  /**
   * Batch BA — vampire-only V5 traits. Made optional so newly created
   * humans / ghouls (kind !== 'vampire') no longer carry seeded defaults
   * that surface in print. Existing saved V5 vampires keep all three
   * fields exactly as before — `getCharacters` only injects the legacy
   * defaults (1 / 1 / 7) when the underlying character is a vampire.
   * Readers should treat `undefined` as "trait not applicable to this
   * character" rather than "zero".
   */
  bloodPotency?: number;
  hunger?: number;
  humanity?: number;
  /**
   * Batch AV — Generation is shown as a basic-info field on the V5 sheet.
   * Kept optional (and intentionally NOT defaulted to 13 like the classic
   * character) so existing V5 characters without it keep loading without a
   * forced value being injected on read. Blood Potency is the V5 power tier
   * — Generation here is purely informational and does not influence Blood
   * Potency, Blood Pool max, or any other mechanic.
   */
  generation?: number;
  ambition?: string;
  desire?: string;
  predatorType?: string;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  disciplines: Record<string, DisciplineValue>;
  advantages?: string;
  flaws?: string;
  touchstones?: string;
  convictions?: string;
  resonance?: string;
  health: { damage: number, aggravated: number, max: number };
  willpower: { damage: number, aggravated: number, max: number };
  experience: number;
}

/**
 * Classic / World-of-Darkness health track. Unlike V5 (superficial/aggravated),
 * classic editions distinguish three damage types across a fixed 7-level track.
 * Replaces the legacy `health: number` shape; `normalizeClassicHealth` migrates
 * old saved characters (a plain damage count becomes `bashing`).
 */
export interface ClassicHealth {
  bashing: number;
  lethal: number;
  aggravated: number;
  max: number;
}

export interface ClassicCharacter extends BaseCharacter {
  edition: Exclude<EditionId, 'V5'>;
  /**
   * Batch BA — `generation`, `humanity`, and `bloodPool` are vampire-only
   * traits on classic editions. They are now optional so newly created
   * humans / ghouls do not carry seeded defaults that surface in print.
   * Saved classic vampires keep their existing shape: `getCharacters`
   * still injects the legacy defaults (13 / 7 / 10-10) but only when
   * the underlying character is a vampire. Readers should treat
   * `undefined` as "trait not applicable" rather than "zero".
   */
  generation?: number;
  nature?: string;
  demeanor?: string;
  attributes: Record<string, number>;
  abilities: Record<string, number>;
  disciplines: Record<string, DisciplineValue>;
  backgrounds: Record<string, number>;
  virtues: {
    conscience: number;
    selfControl: number;
    courage: number;
  };
  humanity?: number;
  bloodPool?: { current: number, max: number };
  willpower: { current: number, max: number };
  health: ClassicHealth;
  merits?: string;
  flaws?: string;
  experience: number;
}

export type Character = V5Character | ClassicCharacter;

/** Chronicle lifecycle status. `getChronicles` normalizes missing/unknown to 'active'. */
export type ChronicleStatus = 'active' | 'archived';

/**
 * A Storyteller's Chronicle — top-level container for a campaign. Stored
 * separately from characters (own localStorage key, own service). Future
 * features (sessions, NPC linking, etc.) will attach to a Chronicle id.
 */
export interface Chronicle {
  id: string;
  name: string;
  description?: string;
  /** Free-text setting / city / region. */
  setting?: string;
  /** Optional edition for filtering & display. */
  edition?: EditionId;
  status: ChronicleStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Optional advanced log fields on a ChronicleSession. Everything inside is
 * optional and may be omitted entirely. `normalizeSessionDetails` in the
 * session storage service collapses empty groups back to `undefined` so
 * minimal storage stays minimal.
 *
 * - `keyEvents`: short bullet-style milestones from the session.
 * - `unresolvedQuestions`: open threads the table still needs to answer.
 * - `rewards`: free-text XP / boons / loot summary.
 * - `nextHooks`: free-text setup for next session.
 *
 * Strings are kept as plain text; arrays hold one entry per item.
 */
export interface ChronicleSessionDetails {
  keyEvents?: string[];
  unresolvedQuestions?: string[];
  rewards?: string;
  nextHooks?: string;
}

/**
 * A single session summary attached to a Chronicle. Sessions are stored in
 * their own localStorage bucket (own service) and reference characters by
 * id only — never embed full character objects. Orphan sessions (whose
 * `chronicleId` no longer resolves) are filtered by readers; same for
 * `taggedCharacterIds` whose targets have been deleted.
 */
export interface ChronicleSession {
  id: string;
  chronicleId: string;
  title: string;
  summary?: string;
  /** ISO date string (YYYY-MM-DD or full ISO). Optional, user-supplied. */
  sessionDate?: string;
  taggedCharacterIds: string[];
  /**
   * Optional advanced detail group. Backward-compatible — sessions saved
   * before this field existed simply omit it. Empty groups are dropped on
   * normalization so storage stays minimal.
   */
  details?: ChronicleSessionDetails;
  createdAt: string;
  updatedAt: string;
}

/**
 * Coarse category for a Chronicle Location. Unknown / legacy values are
 * normalized to `'other'` by `getChronicleLocations`.
 */
export type ChronicleLocationCategory =
  | 'haven'
  | 'elysium'
  | 'domain'
  | 'business'
  | 'street'
  | 'neighborhood'
  | 'enemy_base'
  | 'other';

/**
 * A point of interest inside a Chronicle (haven, Elysium, nightclub, etc.).
 * Stored in its own localStorage bucket. References characters by id only;
 * never embeds full character objects. Orphan locations (whose `chronicleId`
 * no longer resolves) are filtered by readers.
 */
export interface ChronicleLocation {
  id: string;
  chronicleId: string;
  name: string;
  category: ChronicleLocationCategory;
  description?: string;
  /** Free-text district / neighborhood / region tag. */
  district?: string;
  notes?: string;
  linkedCharacterIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Coarse relationship kind. `'other'` is the safe default for unknown /
 * legacy values (normalized by `getChronicleRelationships`).
 */
export type ChronicleRelationshipType =
  | 'ally'
  | 'enemy'
  | 'sire'
  | 'childe'
  | 'rival'
  | 'contact'
  | 'mawla'
  | 'touchstone'
  | 'coterie_mate'
  | 'other';

/** Relationship lifecycle status. Default `'active'`. */
export type ChronicleRelationshipStatus = 'active' | 'broken' | 'unknown' | 'secret';

/**
 * A directed relationship between two characters inside a Chronicle
 * (`source → target`). Stored in its own localStorage bucket. References
 * characters by id only; never embeds full character objects. Orphan
 * relationships (whose `chronicleId`, `sourceCharacterId`, or
 * `targetCharacterId` is missing) are filtered by readers.
 */
export interface ChronicleRelationship {
  id: string;
  chronicleId: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  relationshipType: ChronicleRelationshipType;
  status: ChronicleRelationshipStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
