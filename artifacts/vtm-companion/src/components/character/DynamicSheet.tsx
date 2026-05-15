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
export function getProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((o, p) => (o && typeof o === 'object' ? o[p] : undefined), obj);
}

export function setProperty(obj: any, path: string, value: any): any {
  if (!path) return obj;
  const parts = path.split('.');
  const last = parts.pop()!;
  const newObj = obj ? JSON.parse(JSON.stringify(obj)) : {};
  let current = newObj;
  for (const part of parts) {
    if (current[part] === null || typeof current[part] !== 'object') {
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

  const renderField = (field: FieldDef) => {
    const value = getProperty(character, field.id);
    const label = strings[field.labelKey] || field.labelKey;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">{label}</label>
            <Input 
              value={value || ''} 
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
              value={value || ''} 
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
              value={value || 0} 
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
              value={value || 0} 
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
        const isV5 = character.edition === 'V5';

        if (isV5 && field.special !== 'bloodPool') {
          // V5 style
          const safeValue = (typeof value === 'object' && value !== null) 
            ? value 
            : { damage: 0, aggravated: 0, max: 5 };

          return (
            <div key={field.id} className="flex flex-col gap-2 py-2">
              <label className="text-sm text-foreground font-serif">{label}</label>
              <DamageTracker 
                damage={safeValue.damage || 0}
                aggravated={safeValue.aggravated || 0}
                max={safeValue.max || 5}
                onChange={v => handleUpdate(field.id, { ...safeValue, ...v })}
                readonly={readonly}
              />
            </div>
          );
        } else {
          // Classic style (blood pool, health index, or willpower pool)
          const isObject = typeof value === 'object' && value !== null;
          const currentValue = isObject ? (value.current ?? 0) : (typeof value === 'number' ? value : 0);
          const classicMax = isObject ? (value.max || 10) : (field.special === 'bloodPool' ? 20 : 7); 
          
          return (
             <div key={field.id} className="flex flex-col gap-2 py-2">
               <label className="text-sm text-foreground font-serif">{label}</label>
               <div className="flex gap-2 items-center">
                 <Input 
                    type="number"
                    value={currentValue} 
                    onChange={e => {
                      const num = parseInt(e.target.value) || 0;
                      if (isObject) {
                        handleUpdate(field.id, { ...value, current: num });
                      } else {
                        handleUpdate(field.id, num);
                      }
                    }} 
                    readOnly={readonly}
                    className="w-16 bg-zinc-950 border-zinc-800"
                  />
                  <span className="text-xs text-muted-foreground">/ {classicMax}</span>
               </div>
             </div>
          );
        }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {schema.sections.map(section => (
        <section key={section.id} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6">
          <h2 className="font-serif text-xl text-primary mb-6 uppercase tracking-widest border-b border-zinc-800 pb-2">
            {strings[section.labelKey] || section.labelKey}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {section.fields.map(field => renderField(field))}
          </div>
        </section>
      ))}
    </div>
  );
}
