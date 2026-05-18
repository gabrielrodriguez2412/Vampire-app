import { ChronicleLocation, ChronicleLocationCategory } from '../types';

const STORAGE_KEY = 'vtm-chronicle-locations';

const VALID_CATEGORIES: ChronicleLocationCategory[] = [
  'haven',
  'elysium',
  'domain',
  'business',
  'street',
  'neighborhood',
  'enemy_base',
  'other',
];

/** Coerce any value into a valid `ChronicleLocationCategory`. Unknown/missing
 *  values fall back to `'other'`. */
export function normalizeLocationCategory(raw: unknown): ChronicleLocationCategory {
  return typeof raw === 'string' && (VALID_CATEGORIES as string[]).includes(raw)
    ? (raw as ChronicleLocationCategory)
    : 'other';
}

/**
 * Read every location from localStorage, normalizing legacy/corrupted entries.
 * Pure: never writes. Entries missing a usable `chronicleId` are dropped
 * (they would be orphans anyway and cannot be displayed).
 */
export function getAllChronicleLocations(): ChronicleLocation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const out: ChronicleLocation[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== 'object') continue;
      const chronicleId = typeof raw.chronicleId === 'string' && raw.chronicleId.trim()
        ? raw.chronicleId
        : null;
      if (!chronicleId) continue;

      const id = typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID();
      const name = typeof raw.name === 'string' && raw.name.trim()
        ? raw.name
        : 'Untitled Location';

      const loc: ChronicleLocation = {
        id,
        chronicleId,
        name,
        category: normalizeLocationCategory(raw.category),
        linkedCharacterIds: Array.isArray(raw.linkedCharacterIds)
          ? raw.linkedCharacterIds.filter((x: unknown): x is string => typeof x === 'string' && !!x)
          : [],
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
      };

      if (typeof raw.description === 'string' && raw.description.trim()) {
        loc.description = raw.description;
      }
      if (typeof raw.district === 'string' && raw.district.trim()) {
        loc.district = raw.district;
      }
      if (typeof raw.notes === 'string' && raw.notes.trim()) {
        loc.notes = raw.notes;
      }

      out.push(loc);
    }
    return out;
  } catch (e) {
    console.error('Failed to parse chronicle locations', e);
    return [];
  }
}

/** Return all locations for one Chronicle, sorted alphabetically by name. */
export function getChronicleLocations(chronicleId: string): ChronicleLocation[] {
  if (!chronicleId) return [];
  const locs = getAllChronicleLocations().filter(l => l.chronicleId === chronicleId);
  locs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return locs;
}

export function getChronicleLocationById(id: string): ChronicleLocation | undefined {
  return getAllChronicleLocations().find(l => l.id === id);
}

export function clearChronicleLocationStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Build a new ChronicleLocation scaffold attached to `chronicleId`. Does NOT
 * persist — pair with `saveChronicleLocation` to write.
 */
export function createEmptyChronicleLocation(chronicleId: string): ChronicleLocation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    chronicleId,
    name: 'Untitled Location',
    category: 'other',
    linkedCharacterIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Upsert a location. Returns the persisted record with a refreshed `updatedAt`. */
export function saveChronicleLocation(loc: ChronicleLocation): ChronicleLocation {
  const all = getAllChronicleLocations();
  const index = all.findIndex(l => l.id === loc.id);
  const toSave: ChronicleLocation = {
    ...loc,
    name: loc.name?.trim() || 'Untitled Location',
    category: normalizeLocationCategory(loc.category),
    linkedCharacterIds: Array.isArray(loc.linkedCharacterIds)
      ? loc.linkedCharacterIds.filter(x => typeof x === 'string' && !!x)
      : [],
    updatedAt: new Date().toISOString(),
  };
  if (index >= 0) {
    all[index] = toSave;
  } else {
    all.push(toSave);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return toSave;
}

/**
 * Patch editable fields on an existing location. Pass an empty string to
 * clear an optional field (description/district/notes); pass `undefined`
 * to leave unchanged. A blank/whitespace name is ignored (cannot clear).
 */
export function updateChronicleLocation(
  id: string,
  updates: {
    name?: string;
    category?: ChronicleLocationCategory;
    description?: string;
    district?: string;
    notes?: string;
    linkedCharacterIds?: string[];
  }
): ChronicleLocation | null {
  const all = getAllChronicleLocations();
  const index = all.findIndex(l => l.id === id);
  if (index < 0) return null;

  const current = all[index];
  const next: ChronicleLocation = { ...current, updatedAt: new Date().toISOString() };

  if (updates.name !== undefined) {
    const t = updates.name.trim();
    if (t) next.name = t;
  }
  if (updates.category !== undefined) {
    next.category = normalizeLocationCategory(updates.category);
  }
  if (updates.description !== undefined) {
    const t = updates.description.trim();
    if (t) next.description = t;
    else delete next.description;
  }
  if (updates.district !== undefined) {
    const t = updates.district.trim();
    if (t) next.district = t;
    else delete next.district;
  }
  if (updates.notes !== undefined) {
    const t = updates.notes.trim();
    if (t) next.notes = t;
    else delete next.notes;
  }
  if (updates.linkedCharacterIds !== undefined) {
    next.linkedCharacterIds = Array.isArray(updates.linkedCharacterIds)
      ? updates.linkedCharacterIds.filter(x => typeof x === 'string' && !!x)
      : [];
  }

  all[index] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return next;
}

export function deleteChronicleLocation(id: string): void {
  const all = getAllChronicleLocations();
  const filtered = all.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** Remove every location tied to `chronicleId`. Used when a Chronicle is
 *  deleted to prevent permanent orphan accumulation. Safe no-op if none exist. */
export function deleteChronicleLocationsForChronicle(chronicleId: string): number {
  if (!chronicleId) return 0;
  const all = getAllChronicleLocations();
  const filtered = all.filter(l => l.chronicleId !== chronicleId);
  const removed = all.length - filtered.length;
  if (removed > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return removed;
}
