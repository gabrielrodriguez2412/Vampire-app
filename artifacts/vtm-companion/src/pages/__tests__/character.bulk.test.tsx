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
import { createEmptyCharacter, saveCharacter, getCharacters } from '@/services/characterStorage';

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
  });

  it('enters selection mode and shows a bar with zero selected and disabled actions', async () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));

    const bar = bulkBar();
    expect(within(bar).getByText('0 selected')).toBeInTheDocument();
    // Nothing selected → destructive + other actions are disabled.
    expect(within(bar).getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(within(bar).getByRole('button', { name: 'Archive' })).toBeDisabled();
    // Compact-mode "Actions" dropdown trigger is wired (shown via CSS in
    // short-landscape; always present in the DOM).
    expect(within(bar).getByRole('button', { name: 'Actions' })).toBeInTheDocument();
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
