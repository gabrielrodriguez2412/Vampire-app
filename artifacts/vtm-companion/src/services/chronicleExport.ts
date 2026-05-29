import { EditionId, CharacterType } from '../types';
import { getChronicleById } from './chronicleStorage';
import { getChronicleSessions } from './chronicleSessionStorage';
import { getChronicleLocations } from './chronicleLocationStorage';
import { getChronicleRelationships } from './chronicleRelationshipStorage';
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
