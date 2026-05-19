import {
  Character, Chronicle, ChronicleSession, ChronicleLocation, ChronicleRelationship,
} from '../types';
import {
  getCharacters, saveCharacter,
} from './characterStorage';
import {
  getChronicles, saveChronicle,
} from './chronicleStorage';
import {
  getAllChronicleSessions, saveChronicleSession,
} from './chronicleSessionStorage';
import {
  getAllChronicleLocations, saveChronicleLocation,
} from './chronicleLocationStorage';
import {
  getAllChronicleRelationships, saveChronicleRelationship,
} from './chronicleRelationshipStorage';

/**
 * App-wide backup format. Includes every locally-stored data type so the
 * user can fully restore on another device without losing chronicles,
 * sessions, locations, or relationships.
 *
 * Versioning notes:
 *   v1 — character-only backup (`buildCharacterBackup` in characterStorage.ts).
 *   v2 — this envelope. Adds chronicles, sessions, locations, relationships,
 *        plus metadata (`app`, `createdAt`, `counts`).
 *
 * The v1 envelope discriminator (`_vtmBackup: true`) is intentionally
 * unchanged so old backups still round-trip through `importCharacterBackup`.
 * The new envelope uses `_vtmAppBackup: true` so the importer can route by
 * shape.
 */
export const APP_BACKUP_VERSION = 2;

export interface AppBackupCounts {
  characters: number;
  chronicles: number;
  chronicleSessions: number;
  chronicleLocations: number;
  chronicleRelationships: number;
}

export interface AppBackup {
  _vtmAppBackup: true;
  app: 'vtm-companion';
  backupVersion: number;
  createdAt: string;
  counts: AppBackupCounts;
  characters: Record<string, any>[];
  chronicles: Record<string, any>[];
  chronicleSessions: Record<string, any>[];
  chronicleLocations: Record<string, any>[];
  chronicleRelationships: Record<string, any>[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Build a v2 app backup snapshot. Pure with respect to storage: never
 * writes or mutates any localStorage key.
 */
export function buildAppBackup(): AppBackup {
  const characters = getCharacters();
  const chronicles = getChronicles();
  const sessions = getAllChronicleSessions();
  const locations = getAllChronicleLocations();
  const relationships = getAllChronicleRelationships();

  return {
    _vtmAppBackup: true,
    app: 'vtm-companion',
    backupVersion: APP_BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    counts: {
      characters: characters.length,
      chronicles: chronicles.length,
      chronicleSessions: sessions.length,
      chronicleLocations: locations.length,
      chronicleRelationships: relationships.length,
    },
    characters: characters.map(clone),
    chronicles: chronicles.map(clone),
    chronicleSessions: sessions.map(clone),
    chronicleLocations: locations.map(clone),
    chronicleRelationships: relationships.map(clone),
  };
}

/** Trigger a browser download of the v2 app backup as a JSON file. */
export function downloadAppBackup(): boolean {
  const backup = buildAppBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const ts = new Date().toISOString().slice(0, 10);
  a.download = `vtm-companion-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/** Returns true if `data` looks like a v2 app backup envelope. */
export function isAppBackupV2(data: any): boolean {
  return !!data
    && typeof data === 'object'
    && data._vtmAppBackup === true
    && typeof data.backupVersion === 'number';
}

/**
 * Validate the shape of a v2 app backup. Returns null on success or a
 * human-readable error message. Tolerates a missing `counts` block (older
 * v2 backups may not have one).
 */
export function validateAppBackup(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid file: not a JSON object.';
  if (data._vtmAppBackup !== true) return 'Invalid file: not a VTM Companion app backup.';
  if (typeof data.backupVersion !== 'number') return 'Invalid file: missing backup version.';

  // Required arrays. We allow them to be empty but they must be arrays so
  // we can iterate them safely.
  const requiredArrays: (keyof AppBackup)[] = [
    'characters', 'chronicles', 'chronicleSessions', 'chronicleLocations', 'chronicleRelationships',
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray((data as any)[key])) {
      return `Invalid file: missing or invalid ${String(key)} list.`;
    }
  }
  return null;
}

export interface AppBackupImportResult {
  importedCounts: AppBackupCounts;
  /** Number of characters whose name had to be suffixed to avoid a collision. */
  renamedCharacters: number;
}

/**
 * Import a v2 app backup additively. NEVER overwrites or deletes any
 * existing local data.
 *
 * Internal references inside the backup (chronicleId on every dependent
 * row, the character-id arrays on sessions and locations, the source/
 * target character ids on relationships) are rewritten to point at the
 * NEW ids assigned to the imported chronicles and characters, so a
 * round-trip backup→restore preserves every link.
 *
 * Returns counts on success, or a human-readable error string.
 */
export function importAppBackup(data: any): AppBackupImportResult | string {
  const error = validateAppBackup(data);
  if (error) return error;

  const now = new Date().toISOString();

  // ---- Step 1: chronicles. Build a chronicleIdRemap (old id → new id). ----
  const chronicleIdRemap = new Map<string, string>();
  const importedChronicleCount = (data.chronicles as Record<string, any>[]).reduce((n, raw) => {
    if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !raw.name.trim()) return n;
    const oldId = typeof raw.id === 'string' && raw.id ? raw.id : '';
    const newId = crypto.randomUUID();
    if (oldId) chronicleIdRemap.set(oldId, newId);
    const next: any = { ...raw, id: newId, createdAt: now, updatedAt: now };
    saveChronicle(next as Chronicle);
    return n + 1;
  }, 0);

  // ---- Step 2: characters. Build a characterIdMap (old id → new id) and
  // handle name collisions inline (mirrors importCharacterBackup but exposes
  // the id mapping so we can apply it to dependent rows below). ----
  const characterIdMap = new Map<string, string>();
  const existingCharacterNames = new Set(getCharacters().map(c => c.name));
  let renamedCharacters = 0;
  const importedCharacterCount = (data.characters as Record<string, any>[]).reduce((n, raw) => {
    if (!raw || typeof raw !== 'object' || typeof raw.name !== 'string' || !raw.name.trim()) return n;
    const oldId = typeof raw.id === 'string' && raw.id ? raw.id : '';
    const newId = crypto.randomUUID();
    if (oldId) characterIdMap.set(oldId, newId);

    // Resolve name conflict — escalate suffix until unique.
    const originalName = String(raw.name);
    let resolvedName = originalName;
    if (existingCharacterNames.has(originalName)) {
      let candidate = `${originalName} Imported`;
      if (existingCharacterNames.has(candidate)) {
        let i = 2;
        while (existingCharacterNames.has(`${originalName} Imported ${i}`)) i++;
        candidate = `${originalName} Imported ${i}`;
      }
      resolvedName = candidate;
      renamedCharacters++;
    }
    existingCharacterNames.add(resolvedName);

    // chronicleId on the character — remap to the new chronicle id when the
    // chronicle was also in the backup; otherwise keep the original (it may
    // match a chronicle that already exists locally).
    const oldChrId = typeof raw.chronicleId === 'string' ? raw.chronicleId : '';
    const newChrId = oldChrId && chronicleIdRemap.has(oldChrId)
      ? chronicleIdRemap.get(oldChrId)
      : (oldChrId || undefined);

    const next: any = {
      ...raw,
      id: newId,
      name: resolvedName,
      createdAt: now,
      updatedAt: now,
    };
    if (newChrId) next.chronicleId = newChrId;
    else delete next.chronicleId;
    saveCharacter(next as Character);
    return n + 1;
  }, 0);

  // ---- Step 3: dependent rows. Remap chronicleId AND every character-id
  // reference (taggedCharacterIds / linkedCharacterIds / source-target). ----
  const remapChronicleRef = (raw: Record<string, any>): string | null => {
    const oldId = typeof raw.chronicleId === 'string' ? raw.chronicleId : '';
    if (!oldId) return null;
    return chronicleIdRemap.get(oldId) ?? null;
  };

  /** Map an old character id → the remapped id when it was in the backup,
   *  otherwise keep the original (it may already exist locally). */
  const remapCharacterRef = (oldId: unknown): string | null => {
    if (typeof oldId !== 'string' || !oldId) return null;
    return characterIdMap.get(oldId) ?? oldId;
  };
  const remapCharacterArray = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    for (const id of arr) {
      const next = remapCharacterRef(id);
      if (next) out.push(next);
    }
    return out;
  };

  const importedSessions = (data.chronicleSessions as Record<string, any>[]).reduce((n, raw) => {
    if (!raw || typeof raw !== 'object') return n;
    const newChrId = remapChronicleRef(raw);
    if (!newChrId) return n;
    const next: any = {
      ...raw,
      id: crypto.randomUUID(),
      chronicleId: newChrId,
      taggedCharacterIds: remapCharacterArray(raw.taggedCharacterIds),
      createdAt: now,
      updatedAt: now,
    };
    saveChronicleSession(next as ChronicleSession);
    return n + 1;
  }, 0);

  const importedLocations = (data.chronicleLocations as Record<string, any>[]).reduce((n, raw) => {
    if (!raw || typeof raw !== 'object') return n;
    const newChrId = remapChronicleRef(raw);
    if (!newChrId) return n;
    const next: any = {
      ...raw,
      id: crypto.randomUUID(),
      chronicleId: newChrId,
      linkedCharacterIds: remapCharacterArray(raw.linkedCharacterIds),
      createdAt: now,
      updatedAt: now,
    };
    saveChronicleLocation(next as ChronicleLocation);
    return n + 1;
  }, 0);

  const importedRelationships = (data.chronicleRelationships as Record<string, any>[]).reduce((n, raw) => {
    if (!raw || typeof raw !== 'object') return n;
    const newChrId = remapChronicleRef(raw);
    if (!newChrId) return n;
    const sourceId = remapCharacterRef(raw.sourceCharacterId);
    const targetId = remapCharacterRef(raw.targetCharacterId);
    if (!sourceId || !targetId) return n;
    const next: any = {
      ...raw,
      id: crypto.randomUUID(),
      chronicleId: newChrId,
      sourceCharacterId: sourceId,
      targetCharacterId: targetId,
      createdAt: now,
      updatedAt: now,
    };
    saveChronicleRelationship(next as ChronicleRelationship);
    return n + 1;
  }, 0);

  return {
    importedCounts: {
      characters: importedCharacterCount,
      chronicles: importedChronicleCount,
      chronicleSessions: importedSessions,
      chronicleLocations: importedLocations,
      chronicleRelationships: importedRelationships,
    },
    renamedCharacters,
  };
}
