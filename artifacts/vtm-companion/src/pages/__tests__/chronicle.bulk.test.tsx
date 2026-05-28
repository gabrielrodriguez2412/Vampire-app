/**
 * @vitest-environment jsdom
 *
 * Batch AB — Chronicle list bulk-selection flow.
 *
 * Drives the real ChroniclePage (list view) with seeded chronicles and
 * exercises selection mode, the selected count, and bulk delete with
 * confirmation (which cascades to sessions/locations/relationships).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ChroniclePage from '../chronicle';
import { AppContextProvider } from '@/context/AppContext';
import { createEmptyChronicle, saveChronicle, getChronicles } from '@/services/chronicleStorage';

function seedAndRender() {
  saveChronicle(createEmptyChronicle('Berlin by Night'));
  saveChronicle(createEmptyChronicle('Chicago Nights'));
  window.localStorage.setItem('vtm-language', 'en');
  render(
    <AppContextProvider>
      <ChroniclePage />
    </AppContextProvider>
  );
}

function bulkBar() {
  return screen.getByRole('toolbar');
}

describe('Chronicle list — bulk selection (Batch AB)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('enters selection mode and reports the selected count', async () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(within(bulkBar()).getByText('0 selected')).toBeInTheDocument();
    expect(within(bulkBar()).getByRole('button', { name: 'Delete' })).toBeDisabled();

    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Select all' }));
    expect(within(bulkBar()).getByText('2 selected')).toBeInTheDocument();
  });

  it('bulk deletes selected chronicles only after confirmation', async () => {
    seedAndRender();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Select all' }));

    fireEvent.click(within(bulkBar()).getByRole('button', { name: 'Delete' }));
    await screen.findByText('Delete selected chronicles?');
    expect(getChronicles()).toHaveLength(2); // not deleted yet

    const dialogDelete = screen.getAllByRole('button', { name: 'Delete' }).pop()!;
    fireEvent.click(dialogDelete);

    await waitFor(() => expect(getChronicles()).toHaveLength(0));
    expect(screen.queryByRole('toolbar')).toBeNull();
  });
});
