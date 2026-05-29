import { getCharacters } from './characterStorage';

/**
 * Bulk character export — a user-selected subset of characters bundled into a
 * single JSON file.
 *
 * Envelope conventions mirror the existing single-character export
 * (`_vtmExport` / `exportVersion` / `exportedAt`) and the Batch AE chronicle
 * export, but with a distinct discriminator (`_vtmCharacterBulkExport`) so
 * importers can route by shape rather than collapse a single export and a
 * subset bulk into the same path. Full character objects are embedded so the
 * file can drive a future bulk import without going through the all-or-nothing
 * full app backup.
 *
 * Scope: characters only. No chronicles, sessions, locations, relationships,
 * or other app-backup data is included — see the v2 app backup for that.
 */
export const CHARACTER_BULK_EXPORT_VERSION = 1;

export interface CharacterBulkExport {
  _vtmCharacterBulkExport: true;
  exportVersion: number;
  exportedAt: string;
  count: number;
  characters: Record<string, any>[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Build a bulk-export envelope for the given character ids. Pure with respect
 * to storage. Returns `null` when no ids are supplied or none resolve to a
 * stored character (so the UI can show a destructive toast instead of a
 * download with zero rows).
 */
export function buildCharacterBulkExport(ids: readonly string[]): CharacterBulkExport | null {
  if (!ids || ids.length === 0) return null;
  const idSet = new Set(ids);
  const matched = getCharacters().filter(c => idSet.has(c.id));
  if (matched.length === 0) return null;

  return {
    _vtmCharacterBulkExport: true,
    exportVersion: CHARACTER_BULK_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    count: matched.length,
    characters: matched.map(clone),
  };
}

/**
 * Trigger a single browser download containing the selected characters as
 * JSON. Returns the suggested filename, or `null` if nothing could be
 * exported (no ids / none resolved). Always one file — never a per-character
 * download.
 */
export function downloadCharacterBulkExport(ids: readonly string[]): string | null {
  const data = buildCharacterBulkExport(ids);
  if (!data) return null;

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = `characters-${data.count}-${ts}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}
