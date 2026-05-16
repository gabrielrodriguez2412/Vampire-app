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
    return parsed
      .filter((c: any) => c && typeof c === 'object')
      .map((c: any) => {
      const edition = normalizeEditionId(c.edition);
      // Construct a safe base
      const base = {
        ...c,
        id: typeof c?.id === 'string' ? c.id : crypto.randomUUID(),
        name: typeof c?.name === 'string' ? c.name : 'Unnamed',
        clan: typeof c?.clan === 'string' ? c.clan : 'brujah',
        edition,
        createdAt: typeof c?.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
        updatedAt: typeof c?.updatedAt === 'string' ? c.updatedAt : new Date().toISOString(),
      };

      // Provide fallback for deeply nested structs
      if (edition === 'V5') {
        return {
          ...base,
          attributes: typeof base.attributes === 'object' && base.attributes !== null ? base.attributes : {},
          skills: typeof base.skills === 'object' && base.skills !== null ? base.skills : {},
          disciplines: typeof base.disciplines === 'object' && base.disciplines !== null ? base.disciplines : {},
          health: typeof base.health === 'object' && base.health !== null ? base.health : { damage: 0, aggravated: 0, max: 5 },
          willpower: typeof base.willpower === 'object' && base.willpower !== null ? base.willpower : { damage: 0, aggravated: 0, max: 5 },
          bloodPotency: typeof base.bloodPotency === 'number' ? base.bloodPotency : 1,
          hunger: typeof base.hunger === 'number' ? base.hunger : 1,
          humanity: typeof base.humanity === 'number' ? base.humanity : 7,
        } as V5Character;
      } else {
        return {
          ...base,
          attributes: typeof base.attributes === 'object' && base.attributes !== null ? base.attributes : {},
          abilities: typeof base.abilities === 'object' && base.abilities !== null ? base.abilities : {},
          disciplines: typeof base.disciplines === 'object' && base.disciplines !== null ? base.disciplines : {},
          backgrounds: typeof base.backgrounds === 'object' && base.backgrounds !== null ? base.backgrounds : {},
          virtues: typeof base.virtues === 'object' && base.virtues !== null ? base.virtues : { conscience: 1, selfControl: 1, courage: 1 },
          bloodPool: typeof base.bloodPool === 'object' && base.bloodPool !== null ? base.bloodPool : { current: 10, max: 10 },
          willpower: typeof base.willpower === 'object' && base.willpower !== null ? base.willpower : { current: 5, max: 5 },
          health: typeof base.health === 'number' ? base.health : 0,
          generation: typeof base.generation === 'number' ? base.generation : 13,
          humanity: typeof base.humanity === 'number' ? base.humanity : 7,
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

export function clearCharacterStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
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

/** Rename a character. Returns the updated character, or null if name is blank or character not found. */
export function renameCharacter(id: string, newName: string): Character | null {
  const trimmed = newName.trim();
  if (!trimmed) return null;

  const chars = getCharacters();
  const index = chars.findIndex(c => c.id === id);
  if (index < 0) return null;

  const updated = { ...chars[index], name: trimmed, updatedAt: new Date().toISOString() } as Character;
  chars[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
  return updated;
}

/** Duplicate a character with a new unique ID and "(Copy)" suffix on the name. */
export function duplicateCharacter(id: string): Character | null {
  const chars = getCharacters();
  const source = chars.find(c => c.id === id);
  if (!source) return null;

  // Deep clone all data to avoid shared references
  const cloned = JSON.parse(JSON.stringify(source)) as Character;
  cloned.id = crypto.randomUUID();
  cloned.name = `${source.name} Copy`;
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();

  chars.push(cloned);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
  return cloned;
}

// --- Export / Import ---

export const EXPORT_VERSION = 1;

export interface CharacterExport {
  _vtmExport: true;
  exportVersion: number;
  exportedAt: string;
  character: Record<string, any>;
}

/** Build an export envelope for a character. Does NOT trigger download. */
export function buildCharacterExport(id: string): CharacterExport | null {
  const char = getCharacterById(id);
  if (!char) return null;

  return {
    _vtmExport: true,
    exportVersion: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    character: JSON.parse(JSON.stringify(char)),
  };
}

/** Trigger a browser download of the character as a JSON file. */
export function downloadCharacterExport(id: string): boolean {
  const exportData = buildCharacterExport(id);
  if (!exportData) return false;

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  // Sanitize filename: keep alphanumerics, dashes, underscores, spaces
  const safeName = exportData.character.name?.replace(/[^a-zA-Z0-9_\- ]/g, '') || 'character';
  a.download = `vtm-${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/** Validate that raw parsed JSON looks like a valid character export. Returns error message or null. */
export function validateCharacterExport(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid file: not a JSON object.';
  if (data._vtmExport !== true) return 'Invalid file: not a VTM character export.';
  if (typeof data.exportVersion !== 'number') return 'Invalid file: missing export version.';
  if (!data.character || typeof data.character !== 'object') return 'Invalid file: missing character data.';

  const char = data.character;
  if (typeof char.name !== 'string' || !char.name.trim()) return 'Invalid file: character has no name.';
  if (typeof char.edition !== 'string') return 'Invalid file: character has no edition.';
  if (typeof char.clan !== 'string') return 'Invalid file: character has no clan.';

  return null; // valid
}

/** Import a character from a validated export object. Always creates a new character (new ID).
 *  Appends " Imported" to the name if there's a name conflict.
 *  Returns the imported character, or an error string. */
export function importCharacter(data: any): Character | string {
  const error = validateCharacterExport(data);
  if (error) return error;

  const charData = data.character as Record<string, any>;

  // Assign a new unique ID — never reuse the exported ID
  charData.id = crypto.randomUUID();
  charData.createdAt = new Date().toISOString();
  charData.updatedAt = new Date().toISOString();

  // Check for name conflict
  const existingChars = getCharacters();
  const nameExists = existingChars.some(c => c.name === charData.name);
  if (nameExists) {
    charData.name = `${charData.name} Imported`;
  }

  // Save through the normal path — saveCharacter will persist it,
  // and getCharacters normalizes it on next load (providing all fallback fields)
  const saved = saveCharacter(charData as Character);
  return saved;
}
