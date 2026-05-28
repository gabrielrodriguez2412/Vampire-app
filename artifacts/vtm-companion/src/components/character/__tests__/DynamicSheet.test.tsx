/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet, getProperty, setProperty, getSuggestedDisciplineIds, readDisciplineEntry, writeDisciplineValue } from '../DynamicSheet';
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

  describe('getSuggestedDisciplineIds', () => {
    it('returns the canonical disciplines for a clan in V5', () => {
      const ids = getSuggestedDisciplineIds('brujah', 'V5', {});
      expect(ids).toEqual(['celerity', 'potence', 'presence']);
    });

    it('filters out edition-incompatible disciplines (V5 Tremere: no Thaumaturgy)', () => {
      const ids = getSuggestedDisciplineIds('tremere', 'V5', {});
      expect(ids).toContain('blood_sorcery');
      expect(ids).not.toContain('thaumaturgy');
    });

    it('filters out edition-incompatible disciplines (V20 Tremere: no Blood Sorcery)', () => {
      const ids = getSuggestedDisciplineIds('tremere', 'V20', {});
      expect(ids).toContain('thaumaturgy');
      expect(ids).not.toContain('blood_sorcery');
    });

    it('returns empty array for Caitiff (no clan disciplines)', () => {
      expect(getSuggestedDisciplineIds('caitiff', 'V5', {})).toEqual([]);
    });

    it('returns empty array for unknown clan id', () => {
      expect(getSuggestedDisciplineIds('not-a-clan', 'V5', {})).toEqual([]);
    });

    it('returns empty array when clan id is undefined', () => {
      expect(getSuggestedDisciplineIds(undefined, 'V5', {})).toEqual([]);
    });

    it('excludes disciplines that are already on the character', () => {
      const ids = getSuggestedDisciplineIds('brujah', 'V5', { celerity: 2 });
      expect(ids).not.toContain('celerity');
      expect(ids).toContain('potence');
      expect(ids).toContain('presence');
    });

    it('also excludes disciplines stored in the new object shape', () => {
      const ids = getSuggestedDisciplineIds('brujah', 'V5', {
        celerity: { rating: 2, powers: ['Cat\'s Grace'] },
      });
      expect(ids).not.toContain('celerity');
    });
  });

  describe('readDisciplineEntry', () => {
    it('treats a plain number as the rating with no powers', () => {
      expect(readDisciplineEntry(2)).toEqual({ rating: 2, powers: [] });
    });

    it('reads the object shape with rating and powers', () => {
      expect(readDisciplineEntry({ rating: 3, powers: ['A', 'B'] }))
        .toEqual({ rating: 3, powers: ['A', 'B'] });
    });

    it('defaults missing powers to an empty array', () => {
      expect(readDisciplineEntry({ rating: 4 })).toEqual({ rating: 4, powers: [] });
    });

    it('defaults missing rating to 0 (defensive)', () => {
      expect(readDisciplineEntry({ powers: ['X'] })).toEqual({ rating: 0, powers: ['X'] });
    });

    it('filters non-string entries out of the powers array', () => {
      expect(readDisciplineEntry({ rating: 1, powers: ['A', 42, null, 'B'] as any }))
        .toEqual({ rating: 1, powers: ['A', 'B'] });
    });

    it('returns safe zero defaults for null/undefined', () => {
      expect(readDisciplineEntry(null)).toEqual({ rating: 0, powers: [] });
      expect(readDisciplineEntry(undefined)).toEqual({ rating: 0, powers: [] });
    });

    it('parses numeric strings (historical malformed data)', () => {
      expect(readDisciplineEntry('3')).toEqual({ rating: 3, powers: [] });
      expect(readDisciplineEntry('not-a-number')).toEqual({ rating: 0, powers: [] });
    });
  });

  describe('writeDisciplineValue', () => {
    it('returns a plain number when there are no powers (legacy-shape preserved)', () => {
      expect(writeDisciplineValue(3, [])).toBe(3);
    });

    it('returns the object shape when powers are present', () => {
      expect(writeDisciplineValue(2, ['Soaring Leap']))
        .toEqual({ rating: 2, powers: ['Soaring Leap'] });
    });

    it('keeps the object shape even at rating 0 when powers exist', () => {
      expect(writeDisciplineValue(0, ['X']))
        .toEqual({ rating: 0, powers: ['X'] });
    });

    it('round-trips with readDisciplineEntry for both shapes', () => {
      expect(readDisciplineEntry(writeDisciplineValue(3, [])))
        .toEqual({ rating: 3, powers: [] });
      expect(readDisciplineEntry(writeDisciplineValue(2, ['A', 'B'])))
        .toEqual({ rating: 2, powers: ['A', 'B'] });
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
      health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
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

  it('renders a box tracker (not a number input) for classic health', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 10, max: 10 },
      health: { bashing: 2, lethal: 1, aggravated: 0, max: 7 },
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'test', labelKey: 'test', fields: [
          { id: 'health', type: 'special-health', special: 'health', labelKey: 'sheet_health' }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} />
    );

    expect(container.querySelectorAll('input[type="number"]').length).toBe(0);
    expect(container.querySelectorAll('.w-5.h-5').length).toBe(7);
  });

  it('does not crash when a classic character still has a legacy numeric health', () => {
    const legacyChar = {
      id: '1', name: 'Legacy', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 10, max: 10 },
      health: 3, // legacy un-migrated shape
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    } as unknown as Character;

    const schema: SheetSchema = {
      sections: [{
        id: 'test', labelKey: 'test', fields: [
          { id: 'health', type: 'special-health', special: 'health', labelKey: 'sheet_health' }
        ]
      }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={legacyChar} schema={schema} onChange={mockOnChange} />
    );
    // Legacy number is read as bashing damage → 3 filled boxes, 7 total, no crash.
    expect(container.querySelectorAll('.w-5.h-5').length).toBe(7);
  });

  it('renders dynamic-dots-5 and allows adding custom entry', () => {
    const v20Char: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      humanity: 7, bloodPool: { current: 10, max: 10 }, willpower: { current: 5, max: 5 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
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
      humanity: 7, bloodPool: { current: 10, max: 10 }, willpower: { current: 5, max: 5 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
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

  it('View Mode allows classic Health updates (box tracker)', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 15, max: 20 },
      health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
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

    // Classic health is now a box tracker; gameplay fields stay clickable in View Mode.
    const boxes = container.querySelectorAll('.w-5.h-5');
    expect(boxes.length).toBe(7);
    fireEvent.click(boxes[0]);
    expect(mockOnChange).toHaveBeenCalled();
    const updated = mockOnChange.mock.calls[0][0] as ClassicCharacter;
    expect(updated.health).toEqual({ bashing: 1, lethal: 0, aggravated: 0, max: 7 });
  });

  it('View Mode allows classic Blood Pool updates', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 15, max: 20 },
      health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
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
      bloodPool: { current: 10, max: 10 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
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
