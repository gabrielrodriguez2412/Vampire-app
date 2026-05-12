import { Character } from "@/types";
import { SheetSchema, FieldDef } from "@/data/characterSheets/schemas";
import { DotRating } from "./DotRating";
import { DamageTracker } from "./DamageTracker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UI_STRINGS } from "@/i18n/ui";
import { useAppContext } from "@/context/AppContext";

interface DynamicSheetProps {
  character: Character;
  schema: SheetSchema;
  onChange: (char: Character) => void;
  readonly?: boolean;
}

// Simple object path getter/setter
function getProperty(obj: any, path: string): any {
  return path.split('.').reduce((o, p) => {
    if (!o || typeof o !== 'object') return undefined;
    return o[p];
  }, obj);
}

function setProperty(obj: any, path: string, value: any): any {
  const parts = path.split('.');
  const last = parts.pop()!;
  const newObj = JSON.parse(JSON.stringify(obj));
  let current = newObj;

  for (const part of parts) {
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[last] = value;
  return newObj;
}

export function DynamicSheet({ character, schema, onChange, readonly = false }: DynamicSheetProps) {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const handleUpdate = (fieldId: string, value: any) => {
    if (readonly) return;
    const updated = setProperty(character, fieldId, value);
    onChange(updated);
  };

  // Safely handle missing schema
  if (!schema || !schema.sections) {
    return <div className="text-center text-muted-foreground p-8">Unable to load character sheet schema</div>;
  }

  const renderField = (field: FieldDef) => {
    // Safe fallback for missing field definition
    if (!field || !field.id || !field.type) {
      return null;
    }
    
    const value = getProperty(character, field.id);
    const label = strings[field.labelKey] || field.labelKey;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">{label}</label>
            <Input 
              value={value != null ? String(value) : ''} 
              onChange={e => handleUpdate(field.id, e.target.value)} 
              readOnly={readonly}
              className="bg-transparent border-0 border-b border-zinc-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary-container"
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.id} className="flex flex-col gap-1 col-span-full">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">{label}</label>
            <Textarea 
              value={value != null ? String(value) : ''} 
              onChange={e => handleUpdate(field.id, e.target.value)} 
              readOnly={readonly}
              className="bg-zinc-950 border-zinc-800 min-h-[100px]"
            />
          </div>
        );
      case 'number':
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">{label}</label>
            <Input 
              type="number"
              value={typeof value === 'number' ? value : parseInt(String(value)) || 0} 
              onChange={e => handleUpdate(field.id, parseInt(e.target.value) || 0)} 
              readOnly={readonly}
              className="bg-transparent border-0 border-b border-zinc-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary-container w-20"
            />
          </div>
        );
      case 'dots-5':
      case 'dots-10':
        const max = field.type === 'dots-10' ? 10 : 5;
        const colorClass = field.special === 'hunger' ? 'text-red-500 border-red-500 [&>div.bg-primary]:bg-red-500 [&>div.border-primary]:border-red-500' : '';
        return (
          <div key={field.id} className="flex items-center justify-between gap-4 py-1 border-b border-zinc-800/50">
            <label className="text-sm text-foreground font-serif">{label}</label>
            <DotRating 
              value={typeof value === 'number' ? value : parseInt(String(value)) || 0} 
              max={max} 
              min={field.min || 0}
              onChange={v => handleUpdate(field.id, v)} 
              readonly={readonly}
              className={colorClass}
            />
          </div>
        );
      case 'special-health':
      case 'special-willpower':
        // Value should be an object { damage: 0, aggravated: 0, max: X } for V5,
        // but classic data may be a number or an object with current/max.
        if (typeof value === 'object' && value !== null) {
          const damage = Number((value as any).damage) || 0;
          const aggravated = Number((value as any).aggravated) || 0;
          const maxValue = Number((value as any).max) || (field.special === 'bloodPool' ? 20 : 7);
          return (
            <div key={field.id} className="flex flex-col gap-2 py-2">
              <label className="text-sm text-foreground font-serif">{label}</label>
              <DamageTracker 
                damage={damage}
                aggravated={aggravated}
                max={maxValue}
                onChange={v => handleUpdate(field.id, { ...value, ...v })}
                readonly={readonly}
              />
            </div>
          );
        }

        const classicMax = field.special === 'bloodPool' ? 20 : 7;
        return (
          <div key={field.id} className="flex flex-col gap-2 py-2">
            <label className="text-sm text-foreground font-serif">{label}</label>
            <div className="flex gap-2 items-center">
              <Input 
                type="number"
                value={typeof value === 'number' ? value : parseInt(String(value)) || 0} 
                onChange={e => handleUpdate(field.id, parseInt(e.target.value) || 0)} 
                readOnly={readonly}
                className="w-16 bg-zinc-950 border-zinc-800"
              />
              <span className="text-xs text-muted-foreground">/ {classicMax}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {(Array.isArray(schema.sections) ? schema.sections : []).map(section => (
        <section key={section.id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6">
          <h2 className="font-serif text-xl text-primary mb-6 uppercase tracking-widest border-b border-zinc-800 pb-2">
            {strings[section.labelKey] || section.labelKey}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {(Array.isArray(section.fields) ? section.fields : []).map(field => renderField(field))}
          </div>
        </section>
      ))}
    </div>
  );
}
