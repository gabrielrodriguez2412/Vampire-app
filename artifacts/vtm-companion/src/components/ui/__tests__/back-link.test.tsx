/**
 * @vitest-environment jsdom
 *
 * Batch AC — shared BackLink + back_to_compendium i18n.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BackLink } from '../back-link';
import { UI_STRINGS } from '@/i18n/ui';

afterEach(() => cleanup());

describe('BackLink', () => {
  it('renders an anchor with the given label and destination href', () => {
    render(<BackLink to="/compendium" label="Back to Compendium" />);
    const link = screen.getByRole('link', { name: 'Back to Compendium' });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/compendium');
  });

  it('renders the provided (localized) label text', () => {
    render(<BackLink to="/compendium" label="Volver al Compendio" />);
    expect(screen.getByRole('link', { name: 'Volver al Compendio' })).toBeInTheDocument();
  });
});

describe('back_to_compendium i18n', () => {
  it('is localized in EN and ES and distinct', () => {
    expect(UI_STRINGS.en.back_to_compendium).toBe('Back to Compendium');
    expect(UI_STRINGS.es.back_to_compendium).toBe('Volver al Compendio');
    expect(UI_STRINGS.es.back_to_compendium).not.toBe(UI_STRINGS.en.back_to_compendium);
  });
});
