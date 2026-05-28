/**
 * @vitest-environment jsdom
 *
 * Batch Z — Chronicle detail "Link character" flow.
 *
 * Regression: the link picker modal was rendered inline inside <main>
 * (which has `relative z-10`), so it was trapped beneath the manage modal
 * (portaled to <body> at z-[70]) and never appeared. The fix portals the
 * picker (and the reassign confirm) to <body> above the manage modal.
 *
 * These tests drive the real ChroniclePage via the `vtm-open-chronicle-id`
 * deep-link (opening straight onto the Characters tab) and assert the full
 * link / list-refresh / unlink behavior.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ChroniclePage from '../chronicle';
import { AppContextProvider } from '@/context/AppContext';
import { createEmptyChronicle, saveChronicle } from '@/services/chronicleStorage';
import { createEmptyCharacter, saveCharacter, setCharacterChronicle } from '@/services/characterStorage';

function openCharactersTab(opts: { linkCharacter?: boolean } = {}) {
  const chronicle = saveChronicle(createEmptyChronicle('Berlin by Night'));
  const character = saveCharacter(createEmptyCharacter('V20', 'brujah', 'Aria'));
  if (opts.linkCharacter) {
    setCharacterChronicle(character.id, chronicle.id);
  }
  window.localStorage.setItem('vtm-language', 'en');
  window.sessionStorage.setItem('vtm-open-chronicle-id', chronicle.id);
  window.sessionStorage.setItem('vtm-open-chronicle-tab', 'characters');
  render(
    <AppContextProvider>
      <ChroniclePage />
    </AppContextProvider>
  );
  return { chronicle, character };
}

describe('Chronicle detail — link character flow (Batch Z)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('opens the link picker when "Link character" is clicked', async () => {
    openCharactersTab();
    // Manage modal opens on the Characters tab with the empty state.
    await screen.findByText('No linked characters yet.');
    // Picker is not open yet (its filter label is unique to the picker).
    expect(screen.queryByText('Show')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /link character/i }));

    // Picker is now visible (portaled to <body>), listing the candidate.
    await screen.findByText('Show');
    expect(screen.getByText('Aria')).toBeInTheDocument();
  });

  it('links the selected character and shows it in the Characters tab', async () => {
    openCharactersTab();
    await screen.findByText('No linked characters yet.');

    fireEvent.click(screen.getByRole('button', { name: /link character/i }));
    await screen.findByText('Show');

    // Pick the candidate from the picker list.
    const candidate = screen.getByText('Aria').closest('button');
    expect(candidate).not.toBeNull();
    fireEvent.click(candidate!);

    // Linked list refreshes: empty state gone, an unlink control now exists.
    await waitFor(() => {
      expect(screen.queryByText('No linked characters yet.')).toBeNull();
    });
    expect(screen.getByRole('button', { name: /unlink/i })).toBeInTheDocument();
    expect(screen.getByText('Aria')).toBeInTheDocument();
  });

  it('keeps unlink working: removing a linked character returns the empty state', async () => {
    openCharactersTab({ linkCharacter: true });

    // Pre-linked character shows immediately with an unlink control.
    const unlink = await screen.findByRole('button', { name: /unlink/i });
    expect(screen.getByText('Aria')).toBeInTheDocument();
    expect(screen.queryByText('No linked characters yet.')).toBeNull();

    fireEvent.click(unlink);

    await screen.findByText('No linked characters yet.');
  });
});
