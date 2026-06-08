/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DynamicSheet, getProperty, setProperty, getSuggestedDisciplineIds, readDisciplineEntry, writeDisciplineValue, resolveChronicleFieldValue } from '../DynamicSheet';
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

  describe('resolveChronicleFieldValue', () => {
    it('auto-fills an empty field with the linked chronicle name', () => {
      expect(resolveChronicleFieldValue('', 'Camarilla Nights')).toBe('Camarilla Nights');
    });

    it('treats a whitespace-only stored value as empty and auto-fills', () => {
      expect(resolveChronicleFieldValue('   ', 'Camarilla Nights')).toBe('Camarilla Nights');
    });

    it('preserves a manual value over the linked chronicle name', () => {
      expect(resolveChronicleFieldValue('My Side Story', 'Camarilla Nights')).toBe('My Side Story');
    });

    it('tracks a changed link only while the field is still empty (auto-filled state)', () => {
      // Empty field follows whatever chronicle is currently linked.
      expect(resolveChronicleFieldValue('', 'Chronicle A')).toBe('Chronicle A');
      expect(resolveChronicleFieldValue('', 'Chronicle B')).toBe('Chronicle B');
      // A stored (manual) value is never replaced when the link changes.
      expect(resolveChronicleFieldValue('Chronicle A', 'Chronicle B')).toBe('Chronicle A');
    });

    it('keeps existing behavior when the character is not linked', () => {
      expect(resolveChronicleFieldValue('', undefined)).toBe('');
      expect(resolveChronicleFieldValue('', '')).toBe('');
      expect(resolveChronicleFieldValue('   ', undefined)).toBe('   ');
      expect(resolveChronicleFieldValue('Manual Only', undefined)).toBe('Manual Only');
    });

    it('handles null/undefined stored values', () => {
      expect(resolveChronicleFieldValue(null, 'Linked')).toBe('Linked');
      expect(resolveChronicleFieldValue(undefined, undefined)).toBe('');
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

  it('renders the classic Blood Pool as a cell tracker (Batch AN — no number input)', () => {
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

    renderWithContext(<DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} />);

    // Batch AN replaced the plain number input with the cell tracker.
    expect(screen.getByTestId('blood-pool-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('blood-pool-cell-15')).toHaveAttribute('data-state', 'filled');
    expect(screen.getByTestId('blood-pool-cell-16')).toHaveAttribute('data-state', 'empty');
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

  it.each([
    ['V5', { id: '1', name: 'V5', clan: 'brujah', edition: 'V5', health: { damage: 0, aggravated: 0, max: 5 }, willpower: { damage: 0, aggravated: 0, max: 5 }, attributes: {}, skills: {}, disciplines: {}, bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0, chronicleId: 'chr1' } as Character],
    ['Classic', { id: '1', name: 'Classic', clan: 'brujah', edition: 'V20', bloodPool: { current: 10, max: 10 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 }, attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 }, willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0, chronicleId: 'chr1' } as Character],
  ])('prefills an empty Chronicle field from the linked chronicle (%s)', (_label, char) => {
    const schema: SheetSchema = {
      sections: [{ id: 'info', labelKey: 'info', fields: [{ id: 'chronicle', type: 'text', labelKey: 'chronicle' }] }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={char} schema={schema} onChange={mockOnChange} linkedChronicleName="Camarilla Nights" />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Camarilla Nights');
  });

  it('shows a manual Chronicle value instead of the linked name', () => {
    const char = {
      id: '1', name: 'Classic', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 10, max: 10 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
      chronicleId: 'chr1', chronicle: 'My Side Story',
    } as Character;

    const schema: SheetSchema = {
      sections: [{ id: 'info', labelKey: 'info', fields: [{ id: 'chronicle', type: 'text', labelKey: 'chronicle' }] }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={char} schema={schema} onChange={mockOnChange} linkedChronicleName="Camarilla Nights" />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('My Side Story');
  });

  it('leaves the Chronicle field empty when the character is not linked', () => {
    const char = {
      id: '1', name: 'Classic', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 10, max: 10 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {}, virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
    } as Character;

    const schema: SheetSchema = {
      sections: [{ id: 'info', labelKey: 'info', fields: [{ id: 'chronicle', type: 'text', labelKey: 'chronicle' }] }]
    };

    const { container } = renderWithContext(
      <DynamicSheet character={char} schema={schema} onChange={mockOnChange} />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('');
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

    renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    // Click a hunger drop — Batch AM swapped the rounded-dot for a
    // blood-drop SVG, but the field is still a gameplay tracker so it
    // should fire onChange in View Mode the same way.
    fireEvent.click(screen.getByTestId('hunger-drop-5'));
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

  it('View Mode allows classic Blood Pool updates (cell tracker is clickable as a gameplay field)', () => {
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

    renderWithContext(
      <DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} readonly={true} />
    );

    // Click cell 10 — gameplay field, so View Mode still drives onChange.
    fireEvent.click(screen.getByTestId('blood-pool-cell-10'));
    expect(mockOnChange).toHaveBeenCalled();
    const updated = mockOnChange.mock.calls[0][0] as ClassicCharacter;
    // Storage shape preserved: `{ current, max }`.
    expect(updated.bloodPool).toEqual({ current: 10, max: 20 });
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

  // ---------------------------------------------------------------------
  // Batch AM — V5 Hunger renders as blood drops, not round dots, and
  // exposes its value via aria-label so screen readers keep parity.
  // ---------------------------------------------------------------------

  it('V5 Hunger field renders blood-drop slots with the value reflected per slot', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: {}, skills: {}, disciplines: {}, willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 3, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'vampire_traits', labelKey: 'vt', fields: [
          { id: 'hunger', type: 'dots-5', special: 'hunger', labelKey: 'sheet_hunger' }
        ]
      }]
    };

    renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} />
    );

    // Five drop slots are rendered, one per Hunger level.
    expect(screen.getByTestId('hunger-drop-1')).toBeInTheDocument();
    expect(screen.getByTestId('hunger-drop-2')).toBeInTheDocument();
    expect(screen.getByTestId('hunger-drop-5')).toBeInTheDocument();
    // The first three drops are filled (Hunger 3); the rest are empty.
    expect(screen.getByTestId('hunger-drop-1')).toHaveAttribute('data-state', 'filled');
    expect(screen.getByTestId('hunger-drop-3')).toHaveAttribute('data-state', 'filled');
    expect(screen.getByTestId('hunger-drop-4')).toHaveAttribute('data-state', 'empty');
    expect(screen.getByTestId('hunger-drop-5')).toHaveAttribute('data-state', 'empty');
  });

  it('V5 Hunger field exposes the underlying numeric value through aria-label', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: {}, skills: {}, disciplines: {}, willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 4, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'vampire_traits', labelKey: 'vt', fields: [
          { id: 'hunger', type: 'dots-5', special: 'hunger', labelKey: 'sheet_hunger' }
        ]
      }]
    };

    renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} />
    );

    // The whole group announces "sheet_hunger 4 of 5" so screen readers
    // get the numeric value even though the visible glyphs are drops.
    expect(screen.getByRole('group', { name: /sheet_hunger 4 of 5/i })).toBeInTheDocument();
  });

  it('classic / non-V5 sheets do NOT render Hunger blood drops', () => {
    const classicChar: ClassicCharacter = {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 10, max: 10 }, health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      willpower: { current: 5, max: 5 }, generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    // Classic characters use Blood Pool, not Hunger — but even if a hostile
    // schema tried to render a Hunger field, the drop visual is only
    // triggered by `field.special === 'hunger'`, which the classic schema
    // never sets. Render a normal Humanity dots row instead and confirm
    // the drop test-ids are absent.
    const schema: SheetSchema = {
      sections: [{
        id: 'traits', labelKey: 't', fields: [
          { id: 'humanity', type: 'dots-10', labelKey: 'sheet_humanity_path' }
        ]
      }]
    };

    renderWithContext(
      <DynamicSheet character={classicChar} schema={schema} onChange={mockOnChange} />
    );
    expect(screen.queryByTestId('hunger-drop-1')).toBeNull();
    expect(screen.queryByTestId('hunger-drop-5')).toBeNull();
  });

  it('Hunger drop click updates the value (Edit Mode)', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5 Char', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: {}, skills: {}, disciplines: {}, willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 1, humanity: 7, createdAt: '', updatedAt: '', experience: 0
    };

    const schema: SheetSchema = {
      sections: [{
        id: 'vampire_traits', labelKey: 'vt', fields: [
          { id: 'hunger', type: 'dots-5', special: 'hunger', labelKey: 'sheet_hunger', gameplay: true }
        ]
      }]
    };

    renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} />
    );

    // Clicking the 4th drop should drive Hunger up to 4.
    fireEvent.click(screen.getByTestId('hunger-drop-4'));
    expect(mockOnChange).toHaveBeenCalled();
    const updated = mockOnChange.mock.calls[0][0] as V5Character;
    expect(updated.hunger).toBe(4);
  });

  // ---------------------------------------------------------------------
  // Batch AN — V20/classic Blood Pool + Willpower visual cell trackers.
  // ---------------------------------------------------------------------

  function makeClassicChar(overrides: Partial<ClassicCharacter> = {}): ClassicCharacter {
    return {
      id: '1', name: 'Classic Char', clan: 'brujah', edition: 'V20',
      bloodPool: { current: 7, max: 10 },
      willpower: { current: 4, max: 6 },
      health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
      ...overrides,
    };
  }

  it('V20 Blood Pool renders as a clickable cell tracker (drops) and surfaces the numeric readout', () => {
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'bloodPool', type: 'special-health', special: 'bloodPool', labelKey: 'sheet_blood_pool', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={makeClassicChar()} schema={schema} onChange={mockOnChange} />
    );
    // 10 cells, the first 7 filled (current = 7, max = 10).
    expect(screen.getByTestId('blood-pool-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('blood-pool-cell-1')).toHaveAttribute('data-state', 'filled');
    expect(screen.getByTestId('blood-pool-cell-7')).toHaveAttribute('data-state', 'filled');
    expect(screen.getByTestId('blood-pool-cell-8')).toHaveAttribute('data-state', 'empty');
    expect(screen.getByTestId('blood-pool-cell-10')).toHaveAttribute('data-state', 'empty');
    // Numeric "X / Y" readout for the exact value.
    expect(screen.getByTestId('blood-pool-tracker-readout').textContent).toMatch(/7\s*\/\s*10/);
    // Group aria-label exposes the value for screen readers.
    expect(
      screen.getByRole('group', { name: /sheet_blood_pool 7 of 10/i })
    ).toBeInTheDocument();
  });

  it('V20 Blood Pool is editable in View Mode and preserves the {current, max} shape', () => {
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'bloodPool', type: 'special-health', special: 'bloodPool', labelKey: 'sheet_blood_pool', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={makeClassicChar()} schema={schema} onChange={mockOnChange} readonly={true} />
    );
    fireEvent.click(screen.getByTestId('blood-pool-cell-3'));
    expect(mockOnChange).toHaveBeenCalled();
    const updated = mockOnChange.mock.calls[0][0] as ClassicCharacter;
    // Critical contract: storage shape unchanged.
    expect(updated.bloodPool).toEqual({ current: 3, max: 10 });
  });

  it('V20 Willpower renders as a clickable cell tracker (boxes) and surfaces the numeric readout', () => {
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'willpower', type: 'special-willpower', labelKey: 'sheet_willpower', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={makeClassicChar()} schema={schema} onChange={mockOnChange} />
    );
    expect(screen.getByTestId('willpower-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('willpower-cell-4')).toHaveAttribute('data-state', 'filled');
    expect(screen.getByTestId('willpower-cell-5')).toHaveAttribute('data-state', 'empty');
    expect(screen.getByTestId('willpower-tracker-readout').textContent).toMatch(/4\s*\/\s*6/);
  });

  it('V20 Willpower box visuals (Batch AN polish) — filled cells get an inner inset; empty cells do not', () => {
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'willpower', type: 'special-willpower', labelKey: 'sheet_willpower', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={makeClassicChar()} schema={schema} onChange={mockOnChange} />
    );
    // Filled boxes (1..current) carry a smaller inner inset that gives
    // each point its own visual identity instead of blurring into a
    // single yellow bar. Empty boxes (current+1..max) do not.
    expect(screen.getByTestId('willpower-cell-1-inset')).toBeInTheDocument();
    expect(screen.getByTestId('willpower-cell-4-inset')).toBeInTheDocument();
    expect(screen.queryByTestId('willpower-cell-5-inset')).toBeNull();
    expect(screen.queryByTestId('willpower-cell-6-inset')).toBeNull();
    // Each Willpower box is its own focusable button — the inner inset
    // is decorative (aria-hidden) so screen readers still announce one
    // cell per point and the labelled group reads "Willpower 4 of 6".
    expect(screen.getByTestId('willpower-cell-1')).toHaveAttribute('role', 'button');
    expect(screen.getByTestId('willpower-cell-1-inset')).toHaveAttribute('aria-hidden');
    expect(
      screen.getByRole('group', { name: /sheet_willpower 4 of 6/i })
    ).toBeInTheDocument();
  });

  it('V20 Willpower is NOT rendered as a Health damage track (no bashing/lethal/aggravated states)', () => {
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'willpower', type: 'special-willpower', labelKey: 'sheet_willpower', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={makeClassicChar()} schema={schema} onChange={mockOnChange} />
    );
    // None of the Health-damage labels or sub-track testids the
    // ClassicHealthTracker uses leak into the Willpower row. Willpower
    // is a single binary (filled / empty) cell row, not a multi-state
    // damage track.
    for (const id of ['willpower-cell-1', 'willpower-cell-2', 'willpower-cell-6']) {
      const cell = screen.getByTestId(id);
      expect(cell).toHaveAttribute('data-state');
      expect(cell.getAttribute('data-state')).toMatch(/^(filled|empty)$/);
      expect(cell.textContent).not.toMatch(/bashing|lethal|aggravated/i);
    }
    // No multi-state cycle labels show up at the group level either.
    const tracker = screen.getByTestId('willpower-tracker');
    expect(tracker.textContent).not.toMatch(/bashing|lethal|aggravated/i);
  });

  it('V20 Willpower is editable in View Mode and preserves the {current, max} shape', () => {
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'willpower', type: 'special-willpower', labelKey: 'sheet_willpower', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={makeClassicChar()} schema={schema} onChange={mockOnChange} readonly={true} />
    );
    fireEvent.click(screen.getByTestId('willpower-cell-2'));
    expect(mockOnChange).toHaveBeenCalled();
    const updated = mockOnChange.mock.calls[0][0] as ClassicCharacter;
    expect(updated.willpower).toEqual({ current: 2, max: 6 });
  });

  it('Re-clicking the current edge cell decrements by one (toggle pattern, matches DotRating)', () => {
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'bloodPool', type: 'special-health', special: 'bloodPool', labelKey: 'sheet_blood_pool', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={makeClassicChar({ bloodPool: { current: 5, max: 10 } })} schema={schema} onChange={mockOnChange} />
    );
    // Current is 5; clicking cell 5 decrements to 4 (so users can shed a
    // single Blood point in one tap without leaving the row).
    fireEvent.click(screen.getByTestId('blood-pool-cell-5'));
    const updated = mockOnChange.mock.calls[0][0] as ClassicCharacter;
    expect(updated.bloodPool.current).toBe(4);
  });

  it('V5 Hunger blood drops are unaffected by the Batch AN classic tracker (regression check)', () => {
    const v5Char: V5Character = {
      id: '1', name: 'V5', clan: 'brujah', edition: 'V5',
      health: { damage: 0, aggravated: 0, max: 5 },
      attributes: {}, skills: {}, disciplines: {},
      willpower: { damage: 0, aggravated: 0, max: 5 },
      bloodPotency: 1, hunger: 2, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
    };
    const schema: SheetSchema = {
      sections: [{
        id: 'vt', labelKey: 'vt', fields: [
          { id: 'hunger', type: 'dots-5', special: 'hunger', labelKey: 'sheet_hunger' }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={v5Char} schema={schema} onChange={mockOnChange} />
    );
    // Hunger still renders as drops, not the classic pool tracker.
    expect(screen.getByTestId('hunger-drop-2')).toHaveAttribute('data-state', 'filled');
    expect(screen.queryByTestId('blood-pool-tracker')).toBeNull();
    expect(screen.queryByTestId('willpower-tracker')).toBeNull();
  });

  it('Promotes a legacy bare-number Blood Pool to the {current, max} shape on first edit', () => {
    // Legacy save: a Blood Pool stored as a bare number. We render
    // tolerantly (treat it as the current value with classic defaults)
    // and the first edit upgrades the field to the canonical pair —
    // existing characters keep working, future writes are normalised.
    const corrupted = {
      id: '1', name: 'Legacy', clan: 'brujah', edition: 'V20',
      bloodPool: 8, // bare number — pre-`{current, max}` save
      willpower: { current: 5, max: 5 },
      health: { bashing: 0, lethal: 0, aggravated: 0, max: 7 },
      attributes: {}, abilities: {}, disciplines: {}, backgrounds: {},
      virtues: { conscience: 1, selfControl: 1, courage: 1 },
      generation: 13, humanity: 7, createdAt: '', updatedAt: '', experience: 0,
    } as unknown as Character;
    const schema: SheetSchema = {
      sections: [{
        id: 'trackers', labelKey: 'test', fields: [
          { id: 'bloodPool', type: 'special-health', special: 'bloodPool', labelKey: 'sheet_blood_pool', gameplay: true }
        ]
      }]
    };
    renderWithContext(
      <DynamicSheet character={corrupted} schema={schema} onChange={mockOnChange} />
    );
    // Bare number is interpreted as the current value; max falls back to
    // the classic Blood Pool default of 20.
    expect(screen.getByTestId('blood-pool-cell-8')).toHaveAttribute('data-state', 'filled');
    expect(screen.getByTestId('blood-pool-cell-9')).toHaveAttribute('data-state', 'empty');
    // First edit upgrades storage to `{ current, max }`.
    fireEvent.click(screen.getByTestId('blood-pool-cell-5'));
    const updated = mockOnChange.mock.calls[0][0] as ClassicCharacter;
    expect(updated.bloodPool).toEqual({ current: 5, max: 20 });
  });
});
