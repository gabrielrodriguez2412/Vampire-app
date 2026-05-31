/**
 * @vitest-environment jsdom
 *
 * Batch AB — Character list bulk-selection flow.
 *
 * Drives the real CharacterPage (list view) with seeded characters and
 * exercises: entering selection mode, the selected count, bulk archive, and
 * bulk delete with confirmation. Queries by accessible role/text rather than
 * snapshots so the tests stay resilient to markup tweaks.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CharacterPage from '../character';
import { AppContextProvider } from '@/context/AppContext';
import { createEmptyCharacter, saveCharacter, getCharacters, setCharacterChronicle } from '@/services/characterStorage';
import { createEmptyChronicle, saveChronicle } from '@/services/chronicleStorage';

function seedAndRender() {
  saveCharacter(createEmptyCharacter('V20', 'brujah', 'Alice'));
  saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bob'));
  window.localStorage.setItem('vtm-language', 'en');
  render(
    <AppContextProvider>
      <CharacterPage />
    </AppContextProvider>
  );
}

function bulkBar() {
  return screen.getByRole('toolbar');
}

describe('Character list — bulk selection (Batch AB)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    // Some tests stub matchMedia to force the compact layout; reset it so the
    // default (full-layout) tests see it absent again.
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('enters selection mode and shows a bar with zero selected and disabled actions', async () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));

    const bar = bulkBar();
    expect(within(bar).getByText('0 selected')).toBeInTheDocument();
    // Nothing selected → destructive + other actions are disabled.
    expect(within(bar).getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(within(bar).getByRole('button', { name: 'Archive' })).toBeDisabled();
    // Batch AF: bulk Export sits next to the other actions, disabled at 0 selected.
    expect(within(bar).getByRole('button', { name: 'Export' })).toBeDisabled();
  });

  it('enables the Export action once at least one character is selected', () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(within(bulkBar()).getByRole('button', { name: 'Export' })).toBeDisabled();

    fireEvent.click(screen.getByText('Alice'));
    expect(within(bulkBar()).getByRole('button', { name: 'Export' })).toBeEnabled();
  });

  it('uses the compact "Actions" dropdown on phone-width viewports', async () => {
    // Force the compact media query to match.
    (window as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;

    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    const bar = bulkBar();

    // Compact: a single "Actions" trigger replaces the individual buttons.
    expect(within(bar).getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    // The standalone action buttons are NOT rendered inline in compact mode.
    expect(within(bar).queryByRole('button', { name: 'Archive' })).toBeNull();
    expect(within(bar).queryByRole('button', { name: 'Mark as NPC' })).toBeNull();
    // Count + Select all + Cancel remain visible.
    expect(within(bar).getByText('0 selected')).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Select all' })).toBeInTheDocument();
  });

  it('tracks the selected count when cards are clicked', async () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));

    fireEvent.click(screen.getByText('Alice'));
    expect(within(bulkBar()).getByText('1 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Bob'));
    expect(within(bulkBar()).getByText('2 selected')).toBeInTheDocument();
  });

  it('bulk archives the selected characters (they leave the Active tab)', async () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Select all' }));
    expect(within(bulkBar()).getByText('2 selected')).toBeInTheDocument();

    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Archive' }));

    // Both characters are now archived in storage.
    await waitFor(() => {
      const stored = getCharacters();
      expect(stored.every(c => c.status === 'archived')).toBe(true);
    });
    // Active tab (default) no longer lists them; selection mode has exited.
    expect(screen.queryByText('Alice')).toBeNull();
    expect(screen.queryByText('Bob')).toBeNull();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  // --- Batch AI: bulk-assign-chronicle ---

  it('exposes a bulk "Assign chronicle" action that is disabled at zero selected', () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    const bar = bulkBar();
    expect(within(bar).getByRole('button', { name: 'Assign chronicle' })).toBeDisabled();

    fireEvent.click(screen.getByText('Alice'));
    expect(within(bar).getByRole('button', { name: 'Assign chronicle' })).toBeEnabled();
  });

  it('opens the assign-chronicle modal with the selected count', async () => {
    saveChronicle(createEmptyChronicle('Chicago by Night'));
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Select all' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Assign chronicle' }));

    const dialog = await screen.findByRole('dialog', { name: /assign chronicle to selected/i });
    // "2 selected" appears as a styled count + label. The dialog's aria-label
    // already matches /selected/i, so scope to the modal body paragraphs.
    expect(within(dialog).getByText('2')).toBeInTheDocument();
    expect(within(dialog).getAllByText(/selected/i).length).toBeGreaterThan(0);
  });

  it('shows the no-chronicles state and disables Save when there are no chronicles', async () => {
    seedAndRender(); // no chronicles seeded
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Select all' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Assign chronicle' }));

    const dialog = await screen.findByRole('dialog', { name: /assign chronicle to selected/i });
    expect(
      within(dialog).getByText(/no chronicles yet\. create one in the chronicle tab\./i)
    ).toBeInTheDocument();
    // The chronicle <select> is not rendered when there are no chronicles.
    expect(within(dialog).queryByRole('combobox')).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('assigns only the selected characters to the chosen chronicle', async () => {
    const chr = saveChronicle(createEmptyChronicle('Chicago by Night'));
    saveCharacter(createEmptyCharacter('V5', 'ventrue', 'Carol')); // unselected
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    // Select Alice + Bob only — leave Carol unselected.
    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByText('Bob'));

    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Assign chronicle' }));
    const dialog = await screen.findByRole('dialog', { name: /assign chronicle to selected/i });
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: chr.id } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const stored = getCharacters();
      const alice = stored.find(c => c.name === 'Alice');
      const bob = stored.find(c => c.name === 'Bob');
      const carol = stored.find(c => c.name === 'Carol');
      expect(alice?.chronicleId).toBe(chr.id);
      expect(bob?.chronicleId).toBe(chr.id);
      // Unselected character is untouched — never picks up a chronicle link.
      expect(carol?.chronicleId).toBeUndefined();
    });
    // Selection mode exits after a successful assignment.
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('reassigns characters already linked to a different chronicle and preserves the manual chronicle text', async () => {
    const oldChr = saveChronicle(createEmptyChronicle('Old Chronicle'));
    const newChr = saveChronicle(createEmptyChronicle('New Chronicle'));
    // Pre-seed Alice with a manual chronicle note AND a link to oldChr before
    // rendering, so the page picks her up in that state on mount.
    const aliceSeed = createEmptyCharacter('V20', 'brujah', 'Alice');
    aliceSeed.chronicle = 'My handwritten chronicle note';
    saveCharacter(aliceSeed);
    setCharacterChronicle(aliceSeed.id, oldChr.id);
    saveCharacter(createEmptyCharacter('V5', 'tremere', 'Bob'));
    window.localStorage.setItem('vtm-language', 'en');
    render(
      <AppContextProvider>
        <CharacterPage />
      </AppContextProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Select all' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Assign chronicle' }));

    const dialog = await screen.findByRole('dialog', { name: /assign chronicle to selected/i });
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: newChr.id } });
    // The reassignment warning surfaces because Alice was already linked elsewhere.
    expect(
      within(dialog).getByText(/already linked to another chronicle and will be reassigned/i)
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const after = getCharacters();
      const aliceAfter = after.find(c => c.name === 'Alice')!;
      // Reassigned safely — no duplicate record, link updated.
      expect(after.filter(c => c.name === 'Alice')).toHaveLength(1);
      expect(aliceAfter.chronicleId).toBe(newChr.id);
      // Manually-typed chronicle text was never touched.
      expect(aliceAfter.chronicle).toBe('My handwritten chronicle note');
    });
  });

  it('bulk deletes only after explicit confirmation', async () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Select all' }));

    // Open the confirm dialog — nothing is deleted yet.
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Delete' }));
    await screen.findByText('Delete selected characters?');
    expect(getCharacters()).toHaveLength(2);

    // Confirm.
    const dialogDelete = screen.getAllByRole('button', { name: 'Delete' }).pop()!;
    fireEvent.click(dialogDelete);

    await waitFor(() => expect(getCharacters()).toHaveLength(0));
  });
});
