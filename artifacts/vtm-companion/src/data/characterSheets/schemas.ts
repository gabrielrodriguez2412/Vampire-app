export type FieldType = 'text' | 'textarea' | 'dots-5' | 'dots-10' | 'tracker' | 'checkbox' | 'number' | 'special-health' | 'special-willpower' | 'dynamic-dots-5' | 'special-disciplines';

export interface FieldDef {
  id: string; // The property key in the Character object, e.g., 'attributes.strength'
  labelKey: string; // Key used for i18n lookup
  type: FieldType;
  max?: number;
  min?: number;
  // Specific for trackers or specialized fields
  special?: 'health' | 'willpower' | 'bloodPool' | 'hunger';
}

export interface SectionDef {
  id: string;
  labelKey: string;
  fields: FieldDef[];
}

export interface SheetSchema {
  sections: SectionDef[];
}
