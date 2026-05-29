/**
 * @vitest-environment jsdom
 *
 * Batch AG post-fix — the normal Character Import button must accept
 * `_vtmCharacterBulkExport` files (Batch AF format), not only the legacy
 * single-character export envelope.
 *
 * Drives the real <input type="file"> on the character page via a
 * File + change event, then awaits the asynchronous FileReader.onload.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, waitFor, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CharacterPage from '../character';
import { AppContextProvider } from '@/context/AppContext';
import {
  getCharacters,
  createEmptyCharacter,
  saveCharacter,
  buildCharacterExport,
} from '@/services/characterStorage';

const validBulkEnvelope = (chars: { name: string; clan?: string; edition?: string }[]) => ({
  _vtmCharacterBulkExport: true,
  exportVersion: 1,
  exportedAt: new Date().toISOString(),
  count: chars.length,
  characters: chars.map(c => ({
    id: crypto.randomUUID(),
    name: c.name,
    clan: c.clan ?? 'brujah',
    edition: c.edition ?? 'V20',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })),
});

function renderPage() {
  window.localStorage.setItem('vtm-language', 'en');
  return render(
    <AppContextProvider>
      <CharacterPage />
    </AppContextProvider>
  );
}

/** Get the character-import file input — the FIRST hidden type=file in the list view. */
function characterImportInput(container: HTMLElement): HTMLInputElement {
  const inputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
  // First input is the character-import one; second is the full backup import.
  return inputs[0];
}

function dropFileOn(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

describe('normal Character Import button (Batch AG post-fix)', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => { cleanup(); window.localStorage.clear(); });

  it('accepts a _vtmCharacterBulkExport file and imports every character', async () => {
    const { container } = renderPage();
    const envelope = validBulkEnvelope([{ name: 'BulkA' }, { name: 'BulkB' }]);
    const file = new File([JSON.stringify(envelope)], 'bulk.json', { type: 'application/json' });

    dropFileOn(characterImportInput(container), file);

    await waitFor(() => expect(getCharacters()).toHaveLength(2));
    const names = getCharacters().map(c => c.name).sort();
    expect(names).toEqual(['BulkA', 'BulkB']);
    // Imported rows get fresh UUIDs, distinct from the source ids in the envelope.
    const sourceIds = new Set<string>(envelope.characters.map(c => c.id));
    expect(getCharacters().some(c => sourceIds.has(c.id))).toBe(false);
  });

  it('still accepts a single-character export file (regression guard)', async () => {
    // Seed one character, export it through the existing helper, then import.
    const seeded = saveCharacter(createEmptyCharacter('V20', 'tremere', 'Source'));
    const envelope = buildCharacterExport(seeded.id)!;
    // Wipe storage so we can assert exactly what the importer added.
    window.localStorage.removeItem('vtm-characters');

    const { container } = renderPage();
    const file = new File([JSON.stringify(envelope)], 'one.json', { type: 'application/json' });
    dropFileOn(characterImportInput(container), file);

    await waitFor(() => expect(getCharacters()).toHaveLength(1));
    expect(getCharacters()[0].name).toBe('Source');
  });

  it('remaps duplicate IDs and never overwrites existing characters', async () => {
    const existing = saveCharacter(createEmptyCharacter('V20', 'brujah', 'KeepMe'));
    const { container } = renderPage();

    // Bulk envelope reusing the existing id but a different name.
    const envelope = {
      _vtmCharacterBulkExport: true,
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      count: 1,
      characters: [{
        id: existing.id,
        name: 'Intruder',
        clan: 'ventrue',
        edition: 'V5',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
    };
    const file = new File([JSON.stringify(envelope)], 'dup.json', { type: 'application/json' });
    dropFileOn(characterImportInput(container), file);

    await waitFor(() => expect(getCharacters()).toHaveLength(2));
    const stored = getCharacters();
    // Existing record untouched (same id and name).
    const survivor = stored.find(c => c.id === existing.id);
    expect(survivor).toBeDefined();
    expect(survivor!.name).toBe('KeepMe');
    // Imported record has a new UUID + the bulk name.
    const intruder = stored.find(c => c.name === 'Intruder');
    expect(intruder).toBeDefined();
    expect(intruder!.id).not.toBe(existing.id);
  });

  it('rejects an invalid file (wrong discriminator) without adding any character', async () => {
    const { container } = renderPage();
    expect(getCharacters()).toHaveLength(0);

    const bogus = { _vtmExport: false, character: { name: 'X', clan: 'brujah', edition: 'V20' } };
    const file = new File([JSON.stringify(bogus)], 'bad.json', { type: 'application/json' });
    dropFileOn(characterImportInput(container), file);

    // Give the FileReader a chance to resolve, then assert nothing was added.
    await new Promise(r => setTimeout(r, 30));
    expect(getCharacters()).toHaveLength(0);
  });
});
