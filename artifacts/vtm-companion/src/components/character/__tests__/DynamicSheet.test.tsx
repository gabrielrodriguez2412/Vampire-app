/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

  afterEach(() => {
    cleanup();
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

  it('renders dynamic-dots-5 and allows adding custom entry', () => {
    const v20Char: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      humanity: 7, bloodPool: { current: 10, max: 10 }, willpower: { current: 5, max: 5 }, health: 0,
      createdAt: '', updatedAt: '', experience: 0, generation: 13
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'bg', labelKey: 'bg', fields: [
          { id: 'backgrounds', type: 'dynamic-dots-5', labelKey: 'bg' }
        ]
      }]
    };

    const { getByPlaceholderText } = renderWithContext(
      <DynamicSheet character={v20Char} schema={schema} onChange={mockOnChange} readonly={false} />
    );

    // Try to add a custom background
    const input = getByPlaceholderText('Add...');
    fireEvent.change(input, { target: { value: 'Resources' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('hides add inputs when readonly is true', () => {
    const v20Char: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      humanity: 7, bloodPool: { current: 10, max: 10 }, willpower: { current: 5, max: 5 }, health: 0,
      createdAt: '', updatedAt: '', experience: 0, generation: 13
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'bg', labelKey: 'bg', fields: [
          { id: 'backgrounds', type: 'dynamic-dots-5', labelKey: 'bg' },
          { id: 'disciplines', type: 'special-disciplines', labelKey: 'disc' }
        ]
      }]
    };

    const { queryByPlaceholderText, queryByRole } = renderWithContext(
      <DynamicSheet character={v20Char} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    expect(queryByPlaceholderText('Add...')).toBeNull();
    expect(queryByPlaceholderText('Name...')).toBeNull();
  });
});

describe('DynamicSheet Hybrid View/Edit Mode', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithContext = (ui: React.ReactElement) => {
    return render(
      <AppContextProvider>
        {ui}
      </AppContextProvider>
    );
  };

  it('View Mode blocks build field updates (attributes)', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: { strength: 3 }, skills: {}, disciplines: {}, willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'attrs', labelKey: 'test', fields: [
          { id: 'attributes.strength', type: 'dots-5', labelKey: 'strength' }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    // Click a dot — should NOT trigger onChange because this is a build field in View Mode
    const dots = container.querySelectorAll('.rounded-full');
    if (dots.length > 0) {
      fireEvent.click(dots[0]);
    }
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('View Mode allows V5 gameplay tracker updates (health DamageTracker)', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: {}, skills: {}, disciplines: {}, willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'health', type: 'special-health', labelKey: 'health', gameplay: true }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    // Click a damage box — should trigger onChange because health is a gameplay field
    const damageBoxes = container.querySelectorAll('.w-5.h-5');
    if (damageBoxes.length > 0) {
      fireEvent.click(damageBoxes[0]);
    }
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('View Mode allows V5 gameplay tracker updates (hunger dots)', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: {}, skills: {}, disciplines: {}, willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'vtraits', labelKey: 'test', fields: [
          { id: 'hunger', type: 'dots-5', labelKey: 'sheet_hunger', special: 'hunger', gameplay: true }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    // Click a hunger dot — should trigger onChange because hunger is a gameplay field
    const dots = container.querySelectorAll('.rounded-full');
    if (dots.length > 0) {
      fireEvent.click(dots[dots.length - 1]); // click last dot
    }
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('View Mode allows classic Health updates (flat number)', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 15, max: 20 },
      health: 0,
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'health', type: 'special-health', special: 'health', labelKey: 'sheet_health', gameplay: true }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    // The classic health renders as a number input — it should NOT be readOnly for gameplay fields
    const inputs = container.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThan(0);
    const healthInput = inputs[0] as HTMLInputElement;
    expect(healthInput.readOnly).toBe(false);

    // Changing the value should trigger onChange
    fireEvent.change(healthInput, { target: { value: '3' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('View Mode allows classic Blood Pool updates', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 15, max: 20 },
      health: 0,
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'bloodPool', type: 'special-health', special: 'bloodPool', labelKey: 'sheet_blood_pool', gameplay: true }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    const inputs = container.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThan(0);
    const bpInput = inputs[0] as HTMLInputElement;
    expect(bpInput.readOnly).toBe(false);

    fireEvent.change(bpInput, { target: { value: '10' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('Humanity stays locked in View Mode (not a gameplay field)', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 10, max: 10 }, health: 0,
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'traits', labelKey: 'test', fields: [
          { id: 'humanity', type: 'dots-10', labelKey: 'sheet_humanity_path' }
          // No gameplay flag — should be locked in View Mode
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    // Click a humanity dot — should NOT trigger onChange
    const dots = container.querySelectorAll('.rounded-full');
    if (dots.length > 0) {
      fireEvent.click(dots[0]);
    }
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('Edit Mode allows all updates (build and gameplay fields)', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: { strength: 3 }, skills: {}, disciplines: {}, willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'mixed', labelKey: 'test', fields: [
          { id: 'attributes.strength', type: 'dots-5', labelKey: 'strength' },
          { id: 'hunger', type: 'dots-5', labelKey: 'sheet_hunger', special: 'hunger', gameplay: true }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} readonly={false} />
    );

    // Click attribute dot — should work in Edit Mode
    const dots = container.querySelectorAll('.rounded-full');
    if (dots.length > 0) {
      fireEvent.click(dots[0]);
    }
    expect(mockOnChange).toHaveBeenCalled();
  });
});
