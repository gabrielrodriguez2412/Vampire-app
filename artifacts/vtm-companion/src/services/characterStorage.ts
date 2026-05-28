import { Character, EditionId, V5Character, ClassicCharacter, ClassicHealth, CharacterType, InventoryItem, InventoryCategory, CharacterNote, CharacterNoteCategory } from '../types';
import { normalizeEditionId } from '../utils/content';

/** Standard classic / WoD health track length (Bruised … Incapacitated). */
export const CLASSIC_HEALTH_MAX = 7;

const STORAGE_KEY = 'vtm-characters';

const VALID_INVENTORY_CATEGORIES: InventoryCategory[] = [
  'weapon', 'armor', 'tool', 'equipment', 'money', 'other',
  'document', 'vehicle', 'occult', 'personal',
];

const VALID_NOTE_CATEGORIES: CharacterNoteCategory[] = [
  'general', 'backstory', 'goals', 'secrets', 'contacts', 'session', 'other',
];

/**
 * Coerce any value into a valid `CharacterNote[]`.
 *
 * - Array  → keep only entries that look like notes (object with at least one
 *            string field among `title` / `body`), assign a fresh UUID when
 *            missing, normalize unknown categories to `'other'`, fill in
 *            timestamps from whatever's available (or `now`).
 * - Other  → empty array.
 *
 * Pure transformation; does not mutate input. Used by `getCharacters` to
 * normalize storage on read. Callers may pass `legacyNotes` so a non-empty
 * legacy free-text `notes: string` field can seed a single 'general' journal
 * entry when no structured notes exist yet — keeping pre-journal characters
 * useful in the new UI without ever discarding the original text (the
 * legacy `notes` string stays in storage untouched).
 */
export function normalizeCharacterNotes(
  raw: unknown,
  legacyNotes?: unknown
): CharacterNote[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map(x => {
        const titleVal = typeof x.title === 'string' ? x.title : '';
        const bodyVal = typeof x.body === 'string' ? x.body : '';
        // A note must carry at least one of title/body to be kept.
        return { titleVal, bodyVal, x };
      })
      .filter(({ titleVal, bodyVal }) => titleVal.trim() || bodyVal.trim())
      .map(({ titleVal, bodyVal, x }) => {
        const idVal = x.id;
        const id = typeof idVal === 'string' && idVal ? idVal : crypto.randomUUID();
        const catVal = x.category;
        const category: CharacterNoteCategory =
          typeof catVal === 'string' && VALID_NOTE_CATEGORIES.includes(catVal as CharacterNoteCategory)
            ? (catVal as CharacterNoteCategory)
            : 'other';
        const createdVal = x.createdAt;
        const updatedVal = x.updatedAt;
        const nowIso = new Date().toISOString();
        const createdAt = typeof createdVal === 'string' && createdVal ? createdVal : nowIso;
        const updatedAt = typeof updatedVal === 'string' && updatedVal ? updatedVal : createdAt;
        return { id, category, title: titleVal, body: bodyVal, createdAt, updatedAt };
      });
  }

  // No structured notes yet. If the legacy free-text `notes` field has
  // content, seed a single 'general' entry so the journal UI surfaces it.
  // We do NOT clear the legacy field — it stays in storage so older clients
  // and re-imports still see the original text.
  if (typeof legacyNotes === 'string' && legacyNotes.trim()) {
    const nowIso = new Date().toISOString();
    return [{
      id: crypto.randomUUID(),
      category: 'general',
      title: '',
      body: legacyNotes,
      createdAt: nowIso,
      updatedAt: nowIso,
    }];
  }

  return [];
}

/**
 * Coerce any value into a valid `InventoryItem[]`.
 *
 * - Array  → keep only entries that look like items (object with string `name`),
 *            assign a fresh UUID to any missing/empty `id`, drop unknown shapes
 *            of optional fields.
 * - String → wrap as a single "Legacy Notes" item so an old free-text inventory
 *            that may exist in a hand-edited backup isn't silently discarded.
 * - Other  → empty array.
 */
export function normalizeInventory(raw: unknown): InventoryItem[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is Record<string, unknown> =>
        !!x && typeof x === 'object' && typeof (x as Record<string, unknown>).name === 'string'
      )
      .map(x => {
        const idVal = x.id;
        const id = typeof idVal === 'string' && idVal ? idVal : crypto.randomUUID();
        const qtyVal = x.quantity;
        const catVal = x.category;
        const notesVal = x.notes;
        const equippedVal = x.equipped;
        const item: InventoryItem = {
          id,
          name: x.name as string,
        };
        if (typeof qtyVal === 'number' && Number.isFinite(qtyVal)) item.quantity = qtyVal;
        if (typeof catVal === 'string' && VALID_INVENTORY_CATEGORIES.includes(catVal as InventoryCategory)) {
          item.category = catVal as InventoryCategory;
        }
        if (typeof notesVal === 'string') item.notes = notesVal;
        // Equipped is optional — only persist when explicitly true. Tolerates
        // booleans, the strings "true"/"false", and ignores anything else so
        // old data without this field stays untouched.
        if (equippedVal === true || equippedVal === 'true') item.equipped = true;
        return item;
      });
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [{
      id: crypto.randomUUID(),
      name: 'Legacy Notes',
      notes: raw,
    }];
  }
  return [];
}

/**
 * Coerce any value into a valid `ClassicHealth` ({bashing, lethal, aggravated, max}).
 *
 * - Number → legacy shape: a plain, untyped damage count. We treat it as
 *            `bashing` (the least-severe type) so an automatic migration never
 *            escalates a saved character's wound severity. Fully reversible —
 *            the player can re-mark boxes to the correct type with a click.
 * - Object → read numeric fields, clamp to non-negative integers, default the
 *            track length to 7, and trim any total overflow least-severe-first.
 * - Other  → an empty 7-box track.
 *
 * Pure transformation; safe to call on untrusted storage on read.
 */
export function normalizeClassicHealth(raw: unknown): ClassicHealth {
  const toInt = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.max(0, Math.floor(raw));
    return {
      bashing: Math.min(n, CLASSIC_HEALTH_MAX),
      lethal: 0,
      aggravated: 0,
      max: CLASSIC_HEALTH_MAX,
    };
  }

  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const max = toInt(o.max) || CLASSIC_HEALTH_MAX;
    let bashing = toInt(o.bashing);
    let lethal = toInt(o.lethal);
    let aggravated = toInt(o.aggravated);

    // Constrain total to the track length, dropping least-severe damage first.
    let overflow = bashing + lethal + aggravated - max;
    if (overflow > 0) {
      const cutB = Math.min(bashing, overflow); bashing -= cutB; overflow -= cutB;
      const cutL = Math.min(lethal, overflow); lethal -= cutL; overflow -= cutL;
      const cutA = Math.min(aggravated, overflow); aggravated -= cutA;
    }
    return { bashing, lethal, aggravated, max };
  }

  return { bashing: 0, lethal: 0, aggravated: 0, max: CLASSIC_HEALTH_MAX };
}

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
      // Normalize chronicleId: keep only non-empty strings. Missing/blank/non-string
      // values are dropped (set to undefined) so the field stays optional and the
      // UI treats them uniformly as "unassigned".
      const chronicleIdRaw = c?.chronicleId;
      const normalizedChronicleId =
        typeof chronicleIdRaw === 'string' && chronicleIdRaw.trim()
          ? chronicleIdRaw
          : undefined;

      // Construct a safe base
      const base = {
        ...c,
        id: typeof c?.id === 'string' ? c.id : crypto.randomUUID(),
        name: typeof c?.name === 'string' ? c.name : 'Unnamed',
        clan: typeof c?.clan === 'string' ? c.clan : 'brujah',
        edition,
        // Default unknown/missing/garbage characterType to 'player' so legacy
        // saved characters (and any malformed entries) load safely.
        characterType: (c?.characterType === 'npc' ? 'npc' : 'player') as CharacterType,
        // Normalize inventory to a valid InventoryItem[]; tolerates missing field,
        // legacy free-text strings, or malformed arrays.
        inventory: normalizeInventory(c?.inventory),
        // Normalize structured journal entries; seeds a single 'general' entry
        // from the legacy free-text `notes` string when no journal exists yet.
        characterNotes: normalizeCharacterNotes(c?.characterNotes, c?.notes),
        chronicleId: normalizedChronicleId,
        createdAt: typeof c?.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
        updatedAt: typeof c?.updatedAt === 'string' ? c.updatedAt : new Date().toISOString(),
      };
      if (!normalizedChronicleId) delete (base as Record<string, unknown>).chronicleId;

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
          health: normalizeClassicHealth(base.health),
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
    characterType: 'player' as CharacterType,
    inventory: [] as InventoryItem[],
    characterNotes: [] as CharacterNote[],
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
      health: { bashing: 0, lethal: 0, aggravated: 0, max: CLASSIC_HEALTH_MAX },
      bloodPool: { current: 10, max: 10 },
      willpower: { current: 5, max: 5 },
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      abilities: {},
      backgrounds: {},
    } as ClassicCharacter;
  }
}

/** Update a character's `characterType` ('player' | 'npc'). Returns the updated character,
 *  or null if the character doesn't exist. Any value other than 'npc' is coerced to 'player'. */
export function setCharacterType(id: string, type: CharacterType): Character | null {
  const chars = getCharacters();
  const index = chars.findIndex(c => c.id === id);
  if (index < 0) return null;

  const normalized: CharacterType = type === 'npc' ? 'npc' : 'player';
  const updated = {
    ...chars[index],
    characterType: normalized,
    updatedAt: new Date().toISOString(),
  } as Character;
  chars[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
  return updated;
}

/**
 * Set or clear the `chronicleId` link on a character. Pass `null` (or any
 * non-string) to clear. Pure persistence: this function does NOT verify the
 * chronicle exists — callers can rely on UI to filter dangling ids. Returns
 * the updated character, or null if the character is not found.
 */
export function setCharacterChronicle(
  id: string,
  chronicleId: string | null | undefined
): Character | null {
  const chars = getCharacters();
  const index = chars.findIndex(c => c.id === id);
  if (index < 0) return null;

  const next = { ...chars[index], updatedAt: new Date().toISOString() } as Character;
  if (typeof chronicleId === 'string' && chronicleId.trim()) {
    next.chronicleId = chronicleId;
  } else {
    delete (next as { chronicleId?: string }).chronicleId;
  }
  chars[index] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
  return next;
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

// --- Full library backup (all characters in one file) ---

export const BACKUP_VERSION = 1;

export interface CharacterBackup {
  _vtmBackup: true;
  backupVersion: number;
  exportedAt: string;
  characters: Record<string, any>[];
}

/** Build a backup envelope containing every character currently in storage.
 *  Pure with respect to storage: does NOT write or mutate. */
export function buildCharacterBackup(): CharacterBackup {
  const chars = getCharacters();
  return {
    _vtmBackup: true,
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    // Deep clone so subsequent mutations to the returned object don't touch storage
    characters: chars.map(c => JSON.parse(JSON.stringify(c))),
  };
}

/** Trigger a browser download of all characters as a single JSON backup. */
export function downloadCharacterBackup(): boolean {
  const backup = buildCharacterBackup();

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  a.download = `vtm-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/** Validate that raw parsed JSON looks like a valid backup. Returns error message or null. */
export function validateCharacterBackup(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid file: not a JSON object.';
  if (data._vtmBackup !== true) return 'Invalid file: not a VTM character backup.';
  if (typeof data.backupVersion !== 'number') return 'Invalid file: missing backup version.';
  if (!Array.isArray(data.characters)) return 'Invalid file: missing characters list.';

  for (let i = 0; i < data.characters.length; i++) {
    const c = data.characters[i];
    if (!c || typeof c !== 'object') return `Invalid character at index ${i}: not an object.`;
    if (typeof c.name !== 'string' || !c.name.trim()) return `Invalid character at index ${i}: missing name.`;
    if (typeof c.edition !== 'string') return `Invalid character at index ${i}: missing edition.`;
    if (typeof c.clan !== 'string') return `Invalid character at index ${i}: missing clan.`;
  }

  return null;
}

/**
 * Import every character from a validated backup envelope. Each imported
 * character gets a fresh UUID and current timestamps so existing characters
 * are never overwritten. Names that conflict with anything already in
 * storage (or with another newly-imported character) get an " Imported"
 * suffix, escalating to " Imported 2", " Imported 3", etc., as needed.
 *
 * Returns `{ imported, renamed }` on success, or an error message string
 * on validation failure. Performs a single localStorage write so the
 * operation is atomic from the app's perspective.
 */
export function importCharacterBackup(
  data: any
): { imported: number; renamed: number } | string {
  const error = validateCharacterBackup(data);
  if (error) return error;

  const existing = getCharacters();
  const takenNames = new Set(existing.map(c => c.name));
  const now = new Date().toISOString();

  let renamedCount = 0;
  const toAdd = (data.characters as Record<string, any>[]).map(raw => {
    // Shallow clone so we don't mutate the caller's data
    const charData: Record<string, any> = { ...raw };

    // Always assign a new unique ID — never reuse the backup's ID
    charData.id = crypto.randomUUID();
    charData.createdAt = now;
    charData.updatedAt = now;

    // Resolve name conflicts against both existing characters and earlier
    // entries in this same backup that we've already taken.
    const originalName = String(charData.name);
    if (takenNames.has(originalName)) {
      let candidate = `${originalName} Imported`;
      if (takenNames.has(candidate)) {
        let n = 2;
        while (takenNames.has(`${originalName} Imported ${n}`)) n++;
        candidate = `${originalName} Imported ${n}`;
      }
      charData.name = candidate;
      renamedCount++;
    }

    takenNames.add(String(charData.name));
    return charData;
  });

  const merged = [...existing, ...toAdd];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

  return { imported: toAdd.length, renamed: renamedCount };
}
