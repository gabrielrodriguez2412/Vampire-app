import { Character } from '../types';
import { getCharacters, saveCharacter } from './characterStorage';

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

// ---------------------------------------------------------------------------
// Import (Batch AG) — accepts the `_vtmCharacterBulkExport` envelope produced
// above and adds each character to local storage. Mirrors the safety promises
// of `importCharacterBackup`:
//   - every imported character gets a fresh UUID, so duplicate ids in the
//     file (or collisions with stored ids) can NEVER overwrite an existing
//     character — they are always added as new records;
//   - name collisions against existing or just-imported characters are
//     resolved by appending " Imported", " Imported 2", …;
//   - timestamps (`createdAt` / `updatedAt`) are stamped to "now";
//   - existing characters are never modified or deleted.
// Returns counts on success or a human-readable error message string.
// ---------------------------------------------------------------------------

const SUPPORTED_IMPORT_VERSIONS: ReadonlySet<number> = new Set([
  CHARACTER_BULK_EXPORT_VERSION,
]);

/** Cheap discriminator check used by the import router to dispatch by shape. */
export function isCharacterBulkExport(data: unknown): boolean {
  return !!data && typeof data === 'object'
    && (data as { _vtmCharacterBulkExport?: unknown })._vtmCharacterBulkExport === true;
}

/**
 * Validate a parsed JSON value as a bulk character export envelope.
 * Returns null on success or a human-readable error message string.
 *
 * Field checks mirror `validateCharacterBackup` for the per-character minimum
 * (`name`, `edition`, `clan`) so a file accepted here would also pass the
 * legacy importer's per-row validation if it had the right discriminator.
 */
export function validateCharacterBulkExport(data: any): string | null {
  if (!data || typeof data !== 'object') return 'Invalid file: not a JSON object.';
  if (data._vtmCharacterBulkExport !== true) {
    return 'Invalid file: not a VTM bulk character export.';
  }
  if (typeof data.exportVersion !== 'number') {
    return 'Invalid file: missing export version.';
  }
  if (!SUPPORTED_IMPORT_VERSIONS.has(data.exportVersion)) {
    return `Invalid file: unsupported export version (${data.exportVersion}).`;
  }
  if (!Array.isArray(data.characters)) {
    return 'Invalid file: missing characters list.';
  }
  if (data.characters.length === 0) {
    return 'Invalid file: no characters to import.';
  }
  // If the envelope carries an explicit `count`, require it to match — guards
  // against truncated or hand-edited files.
  if (typeof data.count === 'number' && data.count !== data.characters.length) {
    return `Invalid file: count (${data.count}) does not match characters length (${data.characters.length}).`;
  }
  for (let i = 0; i < data.characters.length; i++) {
    const c = data.characters[i];
    if (!c || typeof c !== 'object') return `Invalid character at index ${i}: not an object.`;
    if (typeof c.name !== 'string' || !c.name.trim()) return `Invalid character at index ${i}: missing name.`;
    if (typeof c.edition !== 'string') return `Invalid character at index ${i}: missing edition.`;
    if (typeof c.clan !== 'string') return `Invalid character at index ${i}: missing clan.`;
  }
  return null;
}

export interface CharacterBulkImportResult {
  /** Number of characters that were added to local storage. */
  imported: number;
  /** Number of characters whose name was suffixed to avoid a collision. */
  renamed: number;
}

/**
 * Import every character in a validated bulk export envelope. Existing
 * characters are NEVER overwritten or modified — duplicate ids are remapped
 * to fresh UUIDs so the imported rows are always distinct records.
 */
export function importCharacterBulkExport(
  data: any
): CharacterBulkImportResult | string {
  const error = validateCharacterBulkExport(data);
  if (error) return error;

  const existing = getCharacters();
  const takenNames = new Set(existing.map(c => c.name));
  const now = new Date().toISOString();

  let renamed = 0;
  let imported = 0;
  for (const raw of data.characters as Record<string, any>[]) {
    // Shallow clone so we never mutate the caller's data.
    const charData: Record<string, any> = { ...raw };

    // Always assign a new UUID. This is the duplicate-id strategy: a
    // colliding id never overwrites anything, it becomes a distinct row.
    charData.id = crypto.randomUUID();
    charData.createdAt = now;
    charData.updatedAt = now;

    // Resolve name collisions against existing rows AND earlier imports in
    // this same batch.
    const originalName = String(charData.name);
    if (takenNames.has(originalName)) {
      let candidate = `${originalName} Imported`;
      if (takenNames.has(candidate)) {
        let n = 2;
        while (takenNames.has(`${originalName} Imported ${n}`)) n++;
        candidate = `${originalName} Imported ${n}`;
      }
      charData.name = candidate;
      renamed++;
    }
    takenNames.add(String(charData.name));

    saveCharacter(charData as Character);
    imported++;
  }

  return { imported, renamed };
}
