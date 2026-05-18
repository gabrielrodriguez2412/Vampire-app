import { ChronicleSession } from '../types';

const STORAGE_KEY = 'vtm-chronicle-sessions';

/**
 * Read every session from localStorage, normalizing legacy/corrupted entries.
 * Pure: never writes. Entries missing a usable `chronicleId` are dropped
 * (they would be orphans anyway and cannot be displayed).
 */
export function getAllChronicleSessions(): ChronicleSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    const out: ChronicleSession[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== 'object') continue;
      const chronicleId = typeof raw.chronicleId === 'string' && raw.chronicleId.trim()
        ? raw.chronicleId
        : null;
      if (!chronicleId) continue; // orphan-by-construction; drop

      const id = typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID();
      const title = typeof raw.title === 'string' && raw.title.trim()
        ? raw.title
        : 'Untitled Session';

      const session: ChronicleSession = {
        id,
        chronicleId,
        title,
        taggedCharacterIds: Array.isArray(raw.taggedCharacterIds)
          ? raw.taggedCharacterIds.filter((x: unknown): x is string => typeof x === 'string' && !!x)
          : [],
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
      };

      if (typeof raw.summary === 'string' && raw.summary.trim()) {
        session.summary = raw.summary;
      }
      if (typeof raw.sessionDate === 'string' && raw.sessionDate.trim()) {
        session.sessionDate = raw.sessionDate;
      }

      out.push(session);
    }
    return out;
  } catch (e) {
    console.error('Failed to parse chronicle sessions', e);
    return [];
  }
}

/** Return all sessions for one Chronicle, sorted newest-first by sessionDate
 *  then by updatedAt as a tiebreaker. */
export function getChronicleSessions(chronicleId: string): ChronicleSession[] {
  if (!chronicleId) return [];
  const sessions = getAllChronicleSessions().filter(s => s.chronicleId === chronicleId);
  sessions.sort((a, b) => {
    // Newer dates first; sessions without a date sink to the bottom.
    const da = a.sessionDate ? Date.parse(a.sessionDate) : NaN;
    const db = b.sessionDate ? Date.parse(b.sessionDate) : NaN;
    const aHas = Number.isFinite(da);
    const bHas = Number.isFinite(db);
    if (aHas && bHas && da !== db) return db - da;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0);
  });
  return sessions;
}

export function getChronicleSessionById(id: string): ChronicleSession | undefined {
  return getAllChronicleSessions().find(s => s.id === id);
}

export function clearChronicleSessionStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Build a new ChronicleSession scaffold attached to `chronicleId`. Does NOT
 * persist — pair with `saveChronicleSession` to write.
 */
export function createEmptyChronicleSession(chronicleId: string): ChronicleSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    chronicleId,
    title: 'Untitled Session',
    taggedCharacterIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Upsert a session. Returns the persisted record with a refreshed `updatedAt`. */
export function saveChronicleSession(session: ChronicleSession): ChronicleSession {
  const all = getAllChronicleSessions();
  const index = all.findIndex(s => s.id === session.id);
  const toSave: ChronicleSession = {
    ...session,
    title: session.title?.trim() || 'Untitled Session',
    taggedCharacterIds: Array.isArray(session.taggedCharacterIds)
      ? session.taggedCharacterIds.filter(x => typeof x === 'string' && !!x)
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
 * Patch editable fields on an existing session. Pass an empty string to
 * clear an optional field (summary / sessionDate); pass `undefined` to leave
 * unchanged. A blank/whitespace title is ignored (cannot clear).
 */
export function updateChronicleSession(
  id: string,
  updates: {
    title?: string;
    summary?: string;
    sessionDate?: string;
    taggedCharacterIds?: string[];
  }
): ChronicleSession | null {
  const all = getAllChronicleSessions();
  const index = all.findIndex(s => s.id === id);
  if (index < 0) return null;

  const current = all[index];
  const next: ChronicleSession = { ...current, updatedAt: new Date().toISOString() };

  if (updates.title !== undefined) {
    const t = updates.title.trim();
    if (t) next.title = t;
  }
  if (updates.summary !== undefined) {
    const t = updates.summary.trim();
    if (t) next.summary = t;
    else delete next.summary;
  }
  if (updates.sessionDate !== undefined) {
    const t = updates.sessionDate.trim();
    if (t) next.sessionDate = t;
    else delete next.sessionDate;
  }
  if (updates.taggedCharacterIds !== undefined) {
    next.taggedCharacterIds = Array.isArray(updates.taggedCharacterIds)
      ? updates.taggedCharacterIds.filter(x => typeof x === 'string' && !!x)
      : [];
  }

  all[index] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return next;
}

export function deleteChronicleSession(id: string): void {
  const all = getAllChronicleSessions();
  const filtered = all.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** Remove every session tied to `chronicleId`. Used when a Chronicle is
 *  deleted to prevent permanent orphan accumulation. Safe no-op if none exist. */
export function deleteChronicleSessionsForChronicle(chronicleId: string): number {
  if (!chronicleId) return 0;
  const all = getAllChronicleSessions();
  const filtered = all.filter(s => s.chronicleId !== chronicleId);
  const removed = all.length - filtered.length;
  if (removed > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  return removed;
}
