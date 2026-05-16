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

export interface BaseCharacter {
  id: string;
  name: string;
  playerName?: string;
  chronicle?: string;
  concept?: string;
  edition: EditionId;
  clan: string;
  sire?: string;
  sect?: string;
  notes?: string;
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
