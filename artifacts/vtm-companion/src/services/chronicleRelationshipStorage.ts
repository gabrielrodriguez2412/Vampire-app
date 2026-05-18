import {
  ChronicleRelationship,
  ChronicleRelationshipStatus,
  ChronicleRelationshipType,
} from '../types';

const STORAGE_KEY = 'vtm-chronicle-relationships';

const VALID_TYPES: ChronicleRelationshipType[] = [
  'ally',
  'enemy',
  'sire',
  'childe',
  'rival',
  'contact',
  'mawla',
  'touchstone',
  'coterie_mate',
  'other',
];

const VALID_STATUSES: ChronicleRelationshipStatus[] = [
  'active',
  'broken',
  'unknown',
  'secret',
];

/** Coerce any value into a valid `ChronicleRelationshipType`. Unknown / missing
 *  values fall back to `'other'`. */
export function normalizeRelationshipType(raw: unknown): ChronicleRelationshipType {
  return typeof raw === 'string' && (VALID_TYPES as string[]).includes(raw)
    ? (raw as ChronicleRelationshipType)
    : 'other';
}

/** Coerce any value into a valid `ChronicleRelationshipStatus`. Unknown /
 *  missing values fall back to `'active'`. */
export function normalizeRelationshipStatus(raw: unknown): ChronicleRelationshipStatus {
  return typeof raw === 'string' && (VALID_STATUSES as string[]).includes(raw)
    ? (raw as ChronicleRelationshipStatus)
    : 'active';
}

/**
 * Read every relationship from localStorage, normalizing legacy / corrupted
 * entries. Pure: never writes. Entries missing a usable `chronicleId`,
 * `sourceCharacterId`, or `targetCharacterId` are dropped — they could
 * never display safely.
 */
export function getAllChronicleRelationships(): ChronicleRelationship[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const out: ChronicleRelationship[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== 'object') continue;
      const chronicleId = typeof raw.chronicleId === 'string' && raw.chronicleId.trim()
        ? raw.chronicleId
        : null;
      const sourceCharacterId = typeof raw.sourceCharacterId === 'string' && raw.sourceCharacterId.trim()
        ? raw.sourceCharacterId
        : null;
      const targetCharacterId = typeof raw.targetCharacterId === 'string' && raw.targetCharacterId.trim()
        ? raw.targetCharacterId
        : null;
      if (!chronicleId || !sourceCharacterId || !targetCharacterId) continue;

      const id = typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID();

      const rel: ChronicleRelationship = {
        id,
        chronicleId,
        sourceCharacterId,
        targetCharacterId,
        relationshipType: normalizeRelationshipType(raw.relationshipType),
        status: normalizeRelationshipStatus(raw.status),
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
      };

      if (typeof raw.description === 'string' && raw.description.trim()) {
        rel.description = raw.description;
      }

      out.push(rel);
    }
    return out;
  } catch (e) {
    console.error('Failed to parse chronicle relationships', e);
    return [];
  }
}

/** Return all relationships for one Chronicle, sorted newest-first by
 *  `updatedAt`. */
export function getChronicleRelationships(chronicleId: string): ChronicleRelationship[] {
  if (!chronicleId) return [];
  const rels = getAllChronicleRelationships().filter(r => r.chronicleId === chronicleId);
  rels.sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
  return rels;
}

export function getChronicleRelationshipById(id: string): ChronicleRelationship | undefined {
  return getAllChronicleRelationships().find(r => r.id === id);
}

export function clearChronicleRelationshipStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Build a new ChronicleRelationship scaffold attached to `chronicleId`. The
 * scaffold has empty source/target ids — callers must supply both before
 * `saveChronicleRelationship`, which will reject empty ids.
 */
export function createEmptyChronicleRelationship(chronicleId: string): ChronicleRelationship {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    chronicleId,
    sourceCharacterId: '',
    targetCharacterId: '',
    relationshipType: 'other',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Upsert a relationship. Returns the persisted record with a refreshed
 * `updatedAt`, or `null` if the record is unsavable (missing chronicleId,
 * sourceCharacterId, or targetCharacterId — these can never be cleared).
 */
export function saveChronicleRelationship(
  rel: ChronicleRelationship
): ChronicleRelationship | null {
  const chronicleId = typeof rel.chronicleId === 'string' && rel.chronicleId.trim()
    ? rel.chronicleId
    : null;
  const sourceCharacterId = typeof rel.sourceCharacterId === 'string' && rel.sourceCharacterId.trim()
    ? rel.sourceCharacterId
    : null;
  const targetCharacterId = typeof rel.targetCharacterId === 'string' && rel.targetCharacterId.trim()
    ? rel.targetCharacterId
    : null;
  if (!chronicleId || !sourceCharacterId || !targetCharacterId) return null;

  const all = getAllChronicleRelationships();
  const index = all.findIndex(r => r.id === rel.id);
  const toSave: ChronicleRelationship = {
    ...rel,
    chronicleId,
    sourceCharacterId,
    targetCharacterId,
    relationshipType: normalizeRelationshipType(rel.relationshipType),
    status: normalizeRelationshipStatus(rel.status),
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
 * Patch editable fields on an existing relationship. Pass an empty string to
 * clear `description`; pass `undefined` to leave a field unchanged. Source /
 * target character ids and chronicle id are mutable but cannot be cleared —
 * a blank value is ignored.
 */
export function updateChronicleRelationship(
  id: string,
  updates: {
    sourceCharacterId?: string;
    targetCharacterId?: string;
    relationshipType?: ChronicleRelationshipType;
    status?: ChronicleRelationshipStatus;
    description?: string;
  }
): ChronicleRelationship | null {
  const all = getAllChronicleRelationships();
  const index = all.findIndex(r => r.id === id);
  if (index < 0) return null;

  const current = all[index];
  const next: ChronicleRelationship = { ...current, updatedAt: new Date().toISOString() };

  if (updates.sourceCharacterId !== undefined) {
    const t = updates.sourceCharacterId.trim();
    if (t) next.sourceCharacterId = t;
  }
  if (updates.targetCharacterId !== undefined) {
    const t = updates.targetCharacterId.trim();
    if (t) next.targetCharacterId = t;
  }
  if (updates.relationshipType !== undefined) {
    next.relationshipType = normalizeRelationshipType(updates.relationshipType);
  }
  if (updates.status !== undefined) {
    next.status = normalizeRelationshipStatus(updates.status);
  }
  if (updates.description !== undefined) {
    const t = updates.description.trim();
    if (t) next.description = t;
    else delete next.description;
  }

  all[index] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return next;
}

export function deleteChronicleRelationship(id: string): void {
  const all = getAllChronicleRelationships();
  const filtered = all.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** Remove every relationship tied to `chronicleId`. Used when a Chronicle is
 *  deleted to prevent permanent orphan accumulation. Safe no-op if none exist. */
export function deleteChronicleRelationshipsForChronicle(chronicleId: string): number {
  if (!chronicleId) return 0;
  const all = getAllChronicleRelationships();
  const filtered = all.filter(r => r.chronicleId !== chronicleId);
  const removed = all.length - filtered.length;
  if (removed > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return removed;
}
