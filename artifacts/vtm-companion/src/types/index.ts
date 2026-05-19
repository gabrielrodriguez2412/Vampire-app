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
  sect: Record<LangCode, string>;
  summary: Record<LangCode, string>;
  weakness: Record<LangCode, string>;
  disciplines: string[];
  icon: string;
  bannerImage: string;
  colorTheme: string;
  lore: Record<LangCode, string>;
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
  category: string;
  shortExplanation: Record<LangCode, string>;
  fullExplanation: Record<LangCode, string>;
  examples: Record<LangCode, string[]>;
  quickNotes: Record<LangCode, string[]>;
  tags: string[];
}

export interface GlossaryEntry {
  id: string;
  term: Record<LangCode, string>;
  definition: Record<LangCode, string>;
  related: string[];
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

export interface BaseCharacter {
  id: string;
  name: string;
  playerName?: string;
  chronicle?: string;
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
  /** 'player' or 'npc'. Defaults to 'player' on load via getCharacters normalization. */
  characterType?: CharacterType;
  /** Inventory items. `getCharacters` normalizes missing/malformed values to `[]`. */
  inventory?: InventoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface V5Character extends BaseCharacter {
  edition: 'V5';
  bloodPotency: number;
  hunger: number;
  humanity: number;
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

export interface ClassicCharacter extends BaseCharacter {
  edition: Exclude<EditionId, 'V5'>;
  generation: number;
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
  humanity: number;
  bloodPool: { current: number, max: number };
  willpower: { current: number, max: number };
  health: number;
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
