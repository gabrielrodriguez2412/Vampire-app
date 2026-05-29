import {
  Chronicle, ChronicleSession, ChronicleLocation, ChronicleRelationship,
  EditionId, CharacterType,
} from '../types';
import { getChronicleById, saveChronicle } from './chronicleStorage';
import { getChronicleSessions, saveChronicleSession } from './chronicleSessionStorage';
import { getChronicleLocations, saveChronicleLocation } from './chronicleLocationStorage';
import { getChronicleRelationships, saveChronicleRelationship } from './chronicleRelationshipStorage';
import { getCharacters } from './characterStorage';

/**
 * Single-chronicle export.
 *
 * Mirrors the character export envelope (`buildCharacterExport` in
 * characterStorage.ts): a discriminated, versioned wrapper around a deep clone
 * of the data. Bundles the chronicle's own row plus all of its dependent rows
 * (sessions, locations, relationships) and lightweight summaries of the
 * characters linked to it (via `chronicleId`). Full character objects are NOT
 * embedded — characters have their own single export — so a chronicle export
 * stays focused on chronicle data while still recording who was linked.
 */
export const CHRONICLE_EXPORT_VERSION = 1;

export interface ChronicleLinkedCharacterSummary {
  id: string;
  name: string;
  clan: string;
  edition: EditionId;
  characterType: CharacterType;
}

export interface ChronicleExport {
  _vtmChronicleExport: true;
  exportVersion: number;
  exportedAt: string;
  chronicle: Record<string, any>;
  sessions: Record<string, any>[];
  locations: Record<string, any>[];
  relationships: Record<string, any>[];
  linkedCharacters: ChronicleLinkedCharacterSummary[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Build a single-chronicle export envelope. Pure with respect to storage:
 * never writes or mutates. Returns null when the chronicle id doesn't resolve.
 */
export function buildChronicleExport(id: string): ChronicleExport | null {
  const chronicle = getChronicleById(id);
  if (!chronicle) return null;

  const linkedCharacters: ChronicleLinkedCharacterSummary[] = getCharacters()
    .filter(c => c.chronicleId === id)
    .map(c => ({
      id: c.id,
      name: c.name,
      clan: c.clan,
      edition: c.edition,
      characterType: c.characterType === 'npc' ? 'npc' : 'player',
    }));

  return {
    _vtmChronicleExport: true,
    exportVersion: CHRONICLE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    chronicle: clone(chronicle),
    sessions: getChronicleSessions(id).map(clone),
    locations: getChronicleLocations(id).map(clone),
    relationships: getChronicleRelationships(id).map(clone),
    linkedCharacters,
  };
}

/**
 * Trigger a browser download of a single chronicle as JSON. Returns the
 * suggested filename (so a toast can reference it), or null if the chronicle
 * wasn't found.
 */
export function downloadChronicleExport(id: string): string | null {
  const data = buildChronicleExport(id);
  if (!data) return null;

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  // Sanitize filename: keep alphanumerics, dashes, underscores, spaces.
  const safeName =
    (typeof data.chronicle.name === 'string'
      ? data.chronicle.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim()
      : '') || 'chronicle';
  const filename = `chronicle-${safeName}-${ts}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}

// ---------------------------------------------------------------------------
// Import (Batch AH) — accepts a `_vtmChronicleExport` envelope and adds the
// chronicle plus its dependent rows to local storage.
//
// Safety guarantees (mirroring `importCharacterBulkExport` and the v2 app
// backup importer):
//   - Chronicle id is ALWAYS remapped to a fresh UUID, so a duplicate id can
//     never overwrite an existing chronicle — the imported record becomes a
//     distinct row.
//   - Every dependent row (session/location/relationship) is rewritten to
//     point at the new chronicle id, with its own fresh UUID.
//
// Character-reference handling — explicit choice for this batch:
//   - We do NOT auto-create characters from `linkedCharacters` summaries.
//     The model has no place to store unanchored character summaries, and
//     synthesising real characters from summaries would risk corrupting the
//     character storage.
//   - Inside sessions/locations, character-id arrays
//     (`taggedCharacterIds` / `linkedCharacterIds`) are filtered to ids that
//     actually resolve to a locally-stored character. Unknown ids are
//     dropped so the UI never shows "Unknown character" tags from an import.
//   - Relationships REQUIRE valid source AND target character ids. A
//     relationship whose endpoints don't resolve locally is DROPPED rather
//     than imported with broken refs (would render as "Unknown" links).
//   - `linkedCharacters` (the summary array) is informational only and is
//     discarded by the importer — nothing in storage uses it.
// ---------------------------------------------------------------------------

const SUPPORTED_CHRONICLE_IMPORT_VERSIONS: ReadonlySet<number> = new Set([
  CHRONICLE_EXPORT_VERSION,
]);

/** Cheap discriminator check used by the import router to dispatch by shape. */
export function isChronicleExport(data: unknown): boolean {
  return !!data && typeof data === 'object'
    && (data as { _vtmChronicleExport?: unknown })._vtmChronicleExport === true;
}

/** Validate a parsed JSON value as a `_vtmChronicleExport` envelope.
 *  Returns null on success or a human-readable error message. */
export function validateChronicleExport(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid file: not a JSON object.';
  if (data._vtmChronicleExport !== true) {
    return 'Invalid file: not a VTM chronicle export.';
  }
  if (typeof data.exportVersion !== 'number') {
    return 'Invalid file: missing export version.';
  }
  if (!SUPPORTED_CHRONICLE_IMPORT_VERSIONS.has(data.exportVersion)) {
    return `Invalid file: unsupported export version (${data.exportVersion}).`;
  }
  if (!data.chronicle || typeof data.chronicle !== 'object') {
    return 'Invalid file: missing chronicle data.';
  }
  if (typeof data.chronicle.name !== 'string' || !data.chronicle.name.trim()) {
    return 'Invalid file: chronicle has no name.';
  }
  // Optional dependent arrays — when present, must actually be arrays.
  const arrayKeys = ['sessions', 'locations', 'relationships', 'linkedCharacters'] as const;
  for (const key of arrayKeys) {
    if (key in data && !Array.isArray((data as any)[key])) {
      return `Invalid file: ${key} must be an array if present.`;
    }
  }
  return null;
}

export interface ChronicleImportResult {
  /** New id assigned to the imported chronicle. Never equal to the source id. */
  chronicleId: string;
  /** Imported counts (already remapped). */
  sessions: number;
  locations: number;
  relationships: number;
  /** Sessions/locations whose character-id refs were trimmed to local-only ids. */
  characterRefsFiltered: number;
  /** Relationships dropped because endpoints didn't resolve locally. */
  relationshipsDropped: number;
}

/**
 * Import a chronicle export envelope. Validates first, then writes the
 * chronicle and dependent rows additively. Existing rows are never modified.
 * Returns a result object on success or a human-readable error string.
 */
export function importChronicleExport(data: any): ChronicleImportResult | string {
  const error = validateChronicleExport(data);
  if (error) return error;

  const now = new Date().toISOString();

  // 1. Chronicle — assign a fresh UUID so a duplicate source id never
  //    overwrites an existing chronicle.
  const rawChr = data.chronicle as Record<string, any>;
  const newChronicleId = crypto.randomUUID();
  const next: Chronicle = {
    ...(rawChr as Chronicle),
    id: newChronicleId,
    createdAt: now,
    updatedAt: now,
  };
  saveChronicle(next);

  // 2. Local character ids — used to filter dangling refs and drop broken
  //    relationships without ever auto-creating characters.
  const localCharIds = new Set(getCharacters().map(c => c.id));

  let characterRefsFiltered = 0;
  let relationshipsDropped = 0;

  // 3. Sessions — remap chronicleId + id, filter tagged refs.
  const sessions = Array.isArray(data.sessions) ? (data.sessions as any[]) : [];
  let sessionCount = 0;
  for (const raw of sessions) {
    if (!raw || typeof raw !== 'object') continue;
    const taggedRaw = Array.isArray(raw.taggedCharacterIds) ? raw.taggedCharacterIds : [];
    const tagged = taggedRaw.filter((id: any): id is string =>
      typeof id === 'string' && localCharIds.has(id));
    if (tagged.length !== taggedRaw.length) characterRefsFiltered++;
    const row: ChronicleSession = {
      ...raw,
      id: crypto.randomUUID(),
      chronicleId: newChronicleId,
      taggedCharacterIds: tagged,
      createdAt: now,
      updatedAt: now,
    };
    saveChronicleSession(row);
    sessionCount++;
  }

  // 4. Locations — same shape as sessions (different ref-array name).
  const locations = Array.isArray(data.locations) ? (data.locations as any[]) : [];
  let locationCount = 0;
  for (const raw of locations) {
    if (!raw || typeof raw !== 'object') continue;
    const linkedRaw = Array.isArray(raw.linkedCharacterIds) ? raw.linkedCharacterIds : [];
    const linked = linkedRaw.filter((id: any): id is string =>
      typeof id === 'string' && localCharIds.has(id));
    if (linked.length !== linkedRaw.length) characterRefsFiltered++;
    const row: ChronicleLocation = {
      ...raw,
      id: crypto.randomUUID(),
      chronicleId: newChronicleId,
      linkedCharacterIds: linked,
      createdAt: now,
      updatedAt: now,
    };
    saveChronicleLocation(row);
    locationCount++;
  }

  // 5. Relationships — drop any whose endpoints don't resolve locally.
  const relationships = Array.isArray(data.relationships) ? (data.relationships as any[]) : [];
  let relationshipCount = 0;
  for (const raw of relationships) {
    if (!raw || typeof raw !== 'object') continue;
    const src = typeof raw.sourceCharacterId === 'string' ? raw.sourceCharacterId : '';
    const tgt = typeof raw.targetCharacterId === 'string' ? raw.targetCharacterId : '';
    if (!src || !tgt || !localCharIds.has(src) || !localCharIds.has(tgt)) {
      relationshipsDropped++;
      continue;
    }
    const row: ChronicleRelationship = {
      ...raw,
      id: crypto.randomUUID(),
      chronicleId: newChronicleId,
      sourceCharacterId: src,
      targetCharacterId: tgt,
      createdAt: now,
      updatedAt: now,
    };
    saveChronicleRelationship(row);
    relationshipCount++;
  }

  // `linkedCharacters` (the summary array) is intentionally discarded — it
  // is informational metadata, not storage.

  return {
    chronicleId: newChronicleId,
    sessions: sessionCount,
    locations: locationCount,
    relationships: relationshipCount,
    characterRefsFiltered,
    relationshipsDropped,
  };
}
