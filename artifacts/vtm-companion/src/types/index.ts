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

export interface Character {
  id: string;
  name: string;
  clan: string;
  concept: string;
  edition: EditionId;
  generation?: number;
  bloodPotency?: number;
  humanity: number;
  hunger?: number;
  attributes: {
    strength: number; dexterity: number; stamina: number;
    charisma: number; manipulation: number; composure: number;
    intelligence: number; wits: number; resolve: number;
  };
  createdAt: string;
}
