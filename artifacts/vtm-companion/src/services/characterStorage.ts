import { Character, EditionId, V5Character, ClassicCharacter } from '../types';
import { normalizeEditionId } from '../utils/content';

const STORAGE_KEY = 'vtm-characters';

export function getCharacters(): Character[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    
    // Normalize old data structures safely
    return parsed.map((c: any) => {
      const edition = normalizeEditionId(c.edition);
      // Construct a safe base
      const base = {
        ...c,
        id: c.id || crypto.randomUUID(),
        name: c.name || 'Unnamed',
        clan: c.clan || 'brujah',
        edition,
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
      };
      
      // Provide fallback for deeply nested structs
      if (edition === 'V5') {
        return {
          ...base,
          attributes: base.attributes || {},
          skills: base.skills || {},
          disciplines: base.disciplines || {},
          health: base.health || { damage: 0, aggravated: 0, max: 5 },
          willpower: base.willpower || { damage: 0, aggravated: 0, max: 5 },
          bloodPotency: base.bloodPotency ?? 1,
          hunger: base.hunger ?? 1,
          humanity: base.humanity ?? 7,
        } as V5Character;
      } else {
        return {
          ...base,
          attributes: base.attributes || {},
          abilities: base.abilities || {},
          disciplines: base.disciplines || {},
          backgrounds: base.backgrounds || {},
          virtues: base.virtues || { conscience: 1, selfControl: 1, courage: 1 },
          bloodPool: base.bloodPool || { current: 10, max: 10 },
          willpower: base.willpower || { current: 5, max: 5 },
          health: base.health || 0,
          generation: base.generation ?? 13,
          humanity: base.humanity ?? 7,
        } as ClassicCharacter;
      }
    });
  } catch (e) {
    console.error('Failed to parse characters', e);
    return [];
  }
}

export function getCharacterById(id: string): Character | undefined {
  return getCharacters().find(c => c.id === id);
}

export function saveCharacter(char: Character): Character {
  const chars = getCharacters();
  const index = chars.findIndex(c => c.id === char.id);
  
  const toSave = { ...char, updatedAt: new Date().toISOString() } as Character;
  
  if (index >= 0) {
    chars[index] = toSave;
  } else {
    chars.push(toSave);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
  return toSave;
}

export function deleteCharacter(id: string): void {
  const chars = getCharacters();
  const filtered = chars.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function createEmptyCharacter(edition: EditionId, clan: string, name: string): Character {
  const base = {
    id: crypto.randomUUID(),
    name,
    clan,
    edition,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attributes: {},
    disciplines: {},
    experience: 0,
  };

  if (edition === 'V5') {
    return {
      ...base,
      edition: 'V5',
      bloodPotency: 1,
      hunger: 1,
      humanity: 7,
      health: { damage: 0, aggravated: 0, max: 5 },
      willpower: { damage: 0, aggravated: 0, max: 5 },
      skills: {},
    } as V5Character;
  } else {
    return {
      ...base,
      edition: edition as Exclude<EditionId, 'V5'>,
      generation: 13,
      humanity: 7,
      health: 0,
      bloodPool: { current: 10, max: 10 },
      willpower: { current: 5, max: 5 },
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      abilities: {},
      backgrounds: {},
    } as ClassicCharacter;
  }
}
