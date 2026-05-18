import { Chronicle, ChronicleStatus, EditionId } from '../types';
import { normalizeEditionId } from '../utils/content';

const STORAGE_KEY = 'vtm-chronicles';

/** Coerce any value to a valid ChronicleStatus. Unknown values default to 'active'. */
export function normalizeChronicleStatus(raw: unknown): ChronicleStatus {
  return raw === 'archived' ? 'archived' : 'active';
}

/**
 * Read all chronicles from localStorage. Defensively normalizes corrupted or
 * legacy entries: missing fields get safe defaults, unknown statuses become
 * 'active', unknown editions are coerced via `normalizeEditionId`.
 */
export function getChronicles(): Chronicle[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((c: any) => c && typeof c === 'object')
      .map((c: any) => {
        const id = typeof c.id === 'string' && c.id ? c.id : crypto.randomUUID();
        const name = typeof c.name === 'string' && c.name.trim()
          ? c.name
          : 'Untitled Chronicle';
        const status = normalizeChronicleStatus(c.status);
        const createdAt = typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString();
        const updatedAt = typeof c.updatedAt === 'string' ? c.updatedAt : new Date().toISOString();

        const chr: Chronicle = { id, name, status, createdAt, updatedAt };

        if (typeof c.description === 'string' && c.description.trim()) {
          chr.description = c.description;
        }
        if (typeof c.setting === 'string' && c.setting.trim()) {
          chr.setting = c.setting;
        }
        if (typeof c.edition === 'string') {
          // normalizeEditionId returns a valid EditionId for any input
          chr.edition = normalizeEditionId(c.edition) as EditionId;
        }

        return chr;
      });
  } catch (e) {
    console.error('Failed to parse chronicles', e);
    return [];
  }
}

export function getChronicleById(id: string): Chronicle | undefined {
  return getChronicles().find(c => c.id === id);
}

export function clearChronicleStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Upsert a chronicle. Returns the persisted record (with refreshed `updatedAt`). */
export function saveChronicle(chr: Chronicle): Chronicle {
  const chrs = getChronicles();
  const index = chrs.findIndex(c => c.id === chr.id);
  const toSave: Chronicle = { ...chr, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    chrs[index] = toSave;
  } else {
    chrs.push(toSave);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chrs));
  return toSave;
}

/**
 * Create a new Chronicle object with safe defaults. Does NOT persist —
 * pair with `saveChronicle` to write.
 */
export function createEmptyChronicle(
  name: string,
  opts: { description?: string; setting?: string; edition?: EditionId } = {}
): Chronicle {
  const now = new Date().toISOString();
  const chr: Chronicle = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled Chronicle',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  const desc = opts.description?.trim();
  const setting = opts.setting?.trim();
  if (desc) chr.description = desc;
  if (setting) chr.setting = setting;
  if (opts.edition) chr.edition = opts.edition;
  return chr;
}

/** Rename a chronicle. Returns the updated record, or null if blank name or not found. */
export function renameChronicle(id: string, newName: string): Chronicle | null {
  const trimmed = newName.trim();
  if (!trimmed) return null;
  const chrs = getChronicles();
  const index = chrs.findIndex(c => c.id === id);
  if (index < 0) return null;
  const updated: Chronicle = { ...chrs[index], name: trimmed, updatedAt: new Date().toISOString() };
  chrs[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chrs));
  return updated;
}

/**
 * Patch editable fields. Pass an empty string to clear an optional field
 * (description/setting); pass `undefined` to leave it unchanged. Name cannot
 * be cleared — a blank/whitespace value is ignored.
 */
export function updateChronicle(
  id: string,
  updates: {
    name?: string;
    description?: string;
    setting?: string;
    edition?: EditionId | null;
  }
): Chronicle | null {
  const chrs = getChronicles();
  const index = chrs.findIndex(c => c.id === id);
  if (index < 0) return null;

  const current = chrs[index];
  const next: Chronicle = { ...current, updatedAt: new Date().toISOString() };

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (trimmed) next.name = trimmed;
  }
  if (updates.description !== undefined) {
    const t = updates.description.trim();
    if (t) next.description = t;
    else delete next.description;
  }
  if (updates.setting !== undefined) {
    const t = updates.setting.trim();
    if (t) next.setting = t;
    else delete next.setting;
  }
  if (updates.edition !== undefined) {
    if (updates.edition) next.edition = updates.edition;
    else delete next.edition;
  }

  chrs[index] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chrs));
  return next;
}

/** Toggle archive state. Returns null if the chronicle wasn't found. */
export function setChronicleStatus(id: string, status: ChronicleStatus): Chronicle | null {
  const chrs = getChronicles();
  const index = chrs.findIndex(c => c.id === id);
  if (index < 0) return null;
  const normalized = normalizeChronicleStatus(status);
  const updated: Chronicle = { ...chrs[index], status: normalized, updatedAt: new Date().toISOString() };
  chrs[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chrs));
  return updated;
}

export function deleteChronicle(id: string): void {
  const chrs = getChronicles();
  const filtered = chrs.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
