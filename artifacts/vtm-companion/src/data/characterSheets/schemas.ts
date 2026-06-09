export type FieldType = 'text' | 'textarea' | 'dots-5' | 'dots-10' | 'tracker' | 'checkbox' | 'number' | 'special-health' | 'special-willpower' | 'dynamic-dots-5' | 'special-disciplines' | 'inventory' | 'journal';

export interface FieldDef {
  id: string; // The property key in the Character object, e.g., 'attributes.strength'
  labelKey: string; // Key used for i18n lookup
  type: FieldType;
  max?: number;
  min?: number;
  // Specific for trackers or specialized fields
  special?: 'health' | 'willpower' | 'bloodPool' | 'hunger';
  /** If true, this field stays editable even in View Mode (gameplay trackers). */
  gameplay?: boolean;
  /**
   * Batch AV — opt-in for optional numeric fields. When `true` on a
   * `type: 'number'` field, the renderer displays a blank input (not a
   * forced `0`) for undefined / non-numeric values, and writes back
   * `undefined` when the input is cleared. Used for V5 Generation, which
   * is intentionally not defaulted at the storage layer. Default behavior
   * (omitted / `false`) preserves the legacy "coerce to 0" rendering used
   * by every existing number field.
   */
  optional?: boolean;
}

export interface SectionDef {
  id: string;
  labelKey: string;
  fields: FieldDef[];
}

export interface SheetSchema {
  sections: SectionDef[];
}
