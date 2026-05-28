/**
 * @vitest-environment jsdom
 *
 * Batch U — character-sheet localization regression tests.
 *
 * Two leaks were fixed in Batch U:
 *   1. The on-screen sheet (`DynamicSheet` → `DisciplineList`) rendered
 *      discipline names via `strings[d.name] || d.name`, which only ever
 *      matched English data-side names and silently fell back to English
 *      in Spanish.
 *   2. The print/PDF view (`CharacterPrintView`) had its OWN local
 *      `getDisciplineDisplayName(id)` that returned the raw English
 *      `DisciplineEntry.name`, ignoring the active language entirely.
 *
 * Both now route through the shared `getDisciplineDisplayName(id, lang)`
 * helper in `utils/disciplineDisplay.ts`. These tests render the real
 * components inside the real `AppContextProvider` (no UI-strings mock)
 * and assert the discipline names localize, while English stays intact.
 *
 * The action-label fixes (Print / PDF, Print, Collapse All) were already
 * wired to i18n keys in a prior batch; the final block here pins their
 * Spanish values so a future i18n edit can't silently regress them.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet } from '../DynamicSheet';
import { CharacterPrintModal } from '../CharacterPrintView';
import { AppContextProvider } from '@/context/AppContext';
import { UI_STRINGS } from '@/i18n/ui';
import type { Character, V5Character } from '@/types';
import type { SheetSchema } from '@/data/characterSheets/schemas';

const disciplineSchema: SheetSchema = {
  sections: [
    {
      id: 'powers',
      labelKey: 'powers',
      fields: [
        { id: 'disciplines', type: 'special-disciplines', special: 'disciplines', labelKey: 'disciplines' },
      ],
    },
  ],
} as unknown as SheetSchema;

function makeChar(): V5Character {
  return {
    id: 'c1', name: 'Test', clan: 'lasombra', edition: 'V5',
    health: { damage: 0, aggravated: 0, max: 5 },
    willpower: { damage: 0, aggravated: 0, max: 5 },
    attributes: {}, skills: {},
    // Three disciplines whose Spanish names differ from English.
    disciplines: { obfuscate: 2, blood_sorcery: 1, oblivion: 3 } as Record<string, number>,
    bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
  };
}

function renderSheet(lang: 'en' | 'es') {
  // AppContextProvider seeds `activeLanguage` from this localStorage key.
  window.localStorage.setItem('vtm-language', lang);
  return render(
    <AppContextProvider>
      <DynamicSheet character={makeChar() as Character} schema={disciplineSchema} onChange={() => {}} readonly />
    </AppContextProvider>
  );
}

describe('character sheet discipline names are language-aware (Batch U)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('renders Spanish discipline names when the language is Spanish', () => {
    const { container } = renderSheet('es');
    const text = container.textContent ?? '';
    expect(text).toContain('Ofuscación');           // obfuscate
    expect(text).toContain('Hechicería de Sangre');  // blood_sorcery
    expect(text).toContain('Olvido');                // oblivion
    // The raw English names must NOT appear in Spanish mode.
    expect(text).not.toContain('Obfuscate');
    expect(text).not.toContain('Blood Sorcery');
    expect(text).not.toContain('Oblivion');
  });

  it('renders English discipline names when the language is English', () => {
    const { container } = renderSheet('en');
    const text = container.textContent ?? '';
    expect(text).toContain('Obfuscate');
    expect(text).toContain('Blood Sorcery');
    expect(text).toContain('Oblivion');
    // Spanish names must NOT appear in English mode.
    expect(text).not.toContain('Ofuscación');
    expect(text).not.toContain('Hechicería de Sangre');
    expect(text).not.toContain('Olvido');
  });
});

describe('print/PDF view renders required sections with localized discipline names (Batch U)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    // The print modal portals into document.body; clear it so tests don't bleed.
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('Spanish print view shows localized section headings and discipline names', () => {
    window.localStorage.setItem('vtm-language', 'es');
    render(
      <AppContextProvider>
        <CharacterPrintModal character={makeChar() as Character} onClose={() => {}} />
      </AppContextProvider>
    );
    // The modal renders through a portal appended to <body>.
    const text = document.body.textContent ?? '';
    // Required sections present (trackers always render; disciplines + attributes
    // when populated — this character has disciplines).
    expect(text).toContain(UI_STRINGS.es.sheet_section_trackers);     // "Medidores"
    expect(text).toContain(UI_STRINGS.es.sheet_section_disciplines);  // "Disciplinas"
    // Localized discipline names in the print sheet (the Batch U fix).
    expect(text).toContain('Ofuscación');
    expect(text).toContain('Hechicería de Sangre');
    expect(text).toContain('Olvido');
    // English discipline names must not leak into the Spanish print sheet.
    expect(text).not.toContain('Obfuscate');
    expect(text).not.toContain('Blood Sorcery');
  });

  it('English print view shows English discipline names', () => {
    window.localStorage.setItem('vtm-language', 'en');
    render(
      <AppContextProvider>
        <CharacterPrintModal character={makeChar() as Character} onClose={() => {}} />
      </AppContextProvider>
    );
    const text = document.body.textContent ?? '';
    expect(text).toContain(UI_STRINGS.en.sheet_section_disciplines); // "Disciplines"
    expect(text).toContain('Obfuscate');
    expect(text).toContain('Blood Sorcery');
    expect(text).toContain('Oblivion');
    expect(text).not.toContain('Ofuscación');
  });
});

describe('character sheet action labels are localized (Batch U pin)', () => {
  it('Spanish print / collapse labels are translated and distinct from English', () => {
    const en = UI_STRINGS.en;
    const es = UI_STRINGS.es;

    // Print / PDF → Imprimir / PDF
    expect(es.char_print_pdf).toBe('Imprimir / PDF');
    expect(es.char_print_pdf).not.toBe(en.char_print_pdf);
    // Print → Imprimir
    expect(es.char_print).toBe('Imprimir');
    expect(es.char_print).not.toBe(en.char_print);
    // Collapse All → Colapsar todo
    expect(es.sheet_collapse_all).toBe('Colapsar todo');
    expect(es.sheet_collapse_all).not.toBe(en.sheet_collapse_all);

    // English remains unchanged.
    expect(en.char_print_pdf).toBe('Print / PDF');
    expect(en.char_print).toBe('Print');
    expect(en.sheet_collapse_all).toBe('Collapse all');
  });
});

describe('discipline-section helper labels are localized (Batch V)', () => {
  it('Spanish discipline-section labels are translated and distinct from English', () => {
    const en = UI_STRINGS.en;
    const es = UI_STRINGS.es;

    // The headline Batch V fix: "Add all" → "Añadir todo".
    expect(es.disciplines_add_all_suggested).toBe('Añadir todo');
    expect(es.disciplines_add_all_suggested).not.toBe(en.disciplines_add_all_suggested);
    // Sibling labels in the same discipline section that had the same leak.
    expect(es.disciplines_suggested).toBe('Sugeridas');
    expect(es.disciplines_suggested).not.toBe(en.disciplines_suggested);
    expect(es.add_power).toBe('Añadir poder...');
    expect(es.add_power).not.toBe(en.add_power);
    expect(es.remove_power).toBe('Quitar poder');
    expect(es.remove_power).not.toBe(en.remove_power);
    // Print-preview toolbar heading (Batch V).
    expect(es.print_preview).toBe('Vista previa de impresión');
    expect(es.print_preview).not.toBe(en.print_preview);

    // English unchanged.
    expect(en.disciplines_add_all_suggested).toBe('Add all');
    expect(en.disciplines_suggested).toBe('Suggested');
    expect(en.add_power).toBe('Add power...');
    expect(en.remove_power).toBe('Remove power');
    expect(en.print_preview).toBe('Print preview');
  });
});

describe('discipline-section "Add all" / "Suggested" render in the active language (Batch V)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  // A character with NO disciplines yet so the suggested-disciplines
  // chips and the "Add all" button render (they only show when there
  // are unclaimed clan suggestions and the sheet is in edit mode).
  function makeEmptyChar(): V5Character {
    return {
      id: 'c2', name: 'Empty', clan: 'lasombra', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      willpower: { damage: 0, aggravated: 0, max: 5 },
      attributes: {}, skills: {},
      disciplines: {} as Record<string, number>,
      bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
    };
  }

  function renderEditSheet(lang: 'en' | 'es') {
    window.localStorage.setItem('vtm-language', lang);
    // No `readonly` → edit mode, so the Add-Discipline controls render.
    return render(
      <AppContextProvider>
        <DynamicSheet character={makeEmptyChar() as Character} schema={disciplineSchema} onChange={() => {}} />
      </AppContextProvider>
    );
  }

  it('shows "Añadir todo" and "Sugeridas" in Spanish edit mode, not English', () => {
    const { container } = renderEditSheet('es');
    const text = container.textContent ?? '';
    expect(text).toContain('Añadir todo');
    expect(text).toContain('Sugeridas');
    expect(text).not.toContain('Add all');
    expect(text).not.toContain('Suggested');
  });

  it('shows "Add all" and "Suggested" in English edit mode', () => {
    const { container } = renderEditSheet('en');
    const text = container.textContent ?? '';
    expect(text).toContain('Add all');
    expect(text).toContain('Suggested');
    expect(text).not.toContain('Añadir todo');
  });
});

describe('print-preview toolbar chrome is localized (Batch V)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('Spanish print modal shows localized toolbar labels', () => {
    window.localStorage.setItem('vtm-language', 'es');
    render(
      <AppContextProvider>
        <CharacterPrintModal character={makeChar() as Character} onClose={() => {}} />
      </AppContextProvider>
    );
    const text = document.body.textContent ?? '';
    expect(text).toContain('Vista previa de impresión'); // heading
    expect(text).toContain('Imprimir');                  // Print button
    expect(text).toContain('Cerrar');                    // Close button
    expect(text).not.toContain('Print preview');
  });

  it('English print modal shows English toolbar labels', () => {
    window.localStorage.setItem('vtm-language', 'en');
    render(
      <AppContextProvider>
        <CharacterPrintModal character={makeChar() as Character} onClose={() => {}} />
      </AppContextProvider>
    );
    const text = document.body.textContent ?? '';
    expect(text).toContain('Print preview');
    expect(text).not.toContain('Vista previa de impresión');
  });
});
