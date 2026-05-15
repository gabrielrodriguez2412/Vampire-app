/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet, getProperty, setProperty } from '../DynamicSheet';
import { AppContextProvider } from '@/context/AppContext';
import { Character, EditionId, V5Character, ClassicCharacter } from '@/types';
import { SheetSchema } from '@/data/characterSheets/schemas';

// Mock UI strings to prevent translation issues in tests
vi.mock('@/i18n/ui', () => ({
  UI_STRINGS: {
    en: {
      health: 'Health',
      willpower: 'Willpower',
      strength: 'Strength'
    }
  }
}));

describe('DynamicSheet Utilities', () => {
  describe('getProperty', () => {
    it('returns undefined for null or undefined objects', () => {
      expect(getProperty(null, 'a.b')).toBeUndefined();
    });

    it('returns correctly nested values', () => {
      expect(getProperty({ a: { b: 5 } }, 'a.b')).toBe(5);
    });

    it('safely handles primitive values when object is expected', () => {
      expect(getProperty({ a: 'primitive' }, 'a.b')).toBeUndefined();
    });
  });

  describe('setProperty', () => {
    it('overwrites primitive with object if path requires it', () => {
      const obj = { health: 'string' };
      const updated = setProperty(obj, 'health.damage', 1);
      expect(updated.health.damage).toBe(1);
    });

    it('safely sets nested properties in null fields', () => {
      const obj = { attributes: null };
      const updated = setProperty(obj, 'attributes.strength', 3);
      expect(updated.attributes.strength).toBe(3);
    });
  });
});

describe('DynamicSheet Rendering', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithContext = (ui: React.ReactElement) => {
    return render(
      <AppContextProvider>
        {ui}
      </AppContextProvider>
    );
  };

  it('renders without crashing even with deeply corrupted null character data', () => {
    const corruptedChar = {
      id: '1', name: 'Corrupt', clan: 'brujah', edition: 'V5',
      attributes: null,
      health: 'im-a-string-not-object',
      willpower: null
    } as unknown as Character;

    const schema: SheetSchema = {
      sections: [{
        id: 'test', labelKey: 'test', fields: [
          { id: 'attributes.strength', type: 'dots-5', labelKey: 'strength' },
          { id: 'health', type: 'special-health', special: 'health', labelKey: 'health' }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={corruptedChar} schema={schema} onChange={mockOnChange} />
    );
    expect(container).toBeTruthy();
  });

  it('renders V5 DamageTracker correctly when edition is V5', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 1, aggravated: 0, max: 5 },
      attributes: {}, skills: {}, disciplines: {}, willpower: { damage:0, aggravated:0, max:5 },
      bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'test', labelKey: 'test', fields: [
          { id: 'health', type: 'special-health', special: 'health', labelKey: 'health' }
        ]
      }]
    };

    const { container } = renderWithContext(<DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} />);
    
    // In V5, damage trackers render boxes (either button or span depending on the tracker).
    // We check if the V5 structure rendered by checking for tracker boxes.
    const damageBoxes = container.querySelectorAll('.w-5.h-5, button, span');
    expect(damageBoxes.length).toBeGreaterThan(0); 
  });

  it('renders Classic input fields for health/willpower when edition is Classic', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 15, max: 20 },
      health: 0,
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'test', labelKey: 'test', fields: [
          { id: 'bloodPool', type: 'special-health', special: 'bloodPool', labelKey: 'Blood Pool' }
        ]
      }]
    };

    const { container } = renderWithContext(<DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} />);
    
    // In Classic, it renders an <input type="number"> instead of DamageTracker buttons
    const inputs = container.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
