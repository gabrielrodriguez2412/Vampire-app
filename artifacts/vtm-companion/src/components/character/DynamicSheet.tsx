import React, { useState } from "react";
import { useLocation } from "wouter";
import { Character, EditionId, DisciplineValue, InventoryItem, InventoryCategory } from "@/types";
import { SheetSchema, FieldDef } from "@/data/characterSheets/schemas";
import { DotRating } from "./DotRating";
import { DamageTracker } from "./DamageTracker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronDown, ExternalLink } from "lucide-react";
import { UI_STRINGS } from "@/i18n/ui";
import { useAppContext } from "@/context/AppContext";
import { disciplines } from "@/data/disciplines";
import { clans } from "@/data/clans";

/**
 * Normalize a stored discipline value into `{ rating, powers }`.
 * Tolerates the legacy plain-number shape, the object shape `{ rating, powers? }`,
 * missing fields, and malformed historical data.
 */
export function readDisciplineEntry(v: unknown): { rating: number; powers: string[] } {
  if (typeof v === 'number') {
    return { rating: v, powers: [] };
  }
  if (v && typeof v === 'object') {
    const obj = v as { rating?: unknown; powers?: unknown };
    const rRaw = obj.rating;
    const rating = typeof rRaw === 'number'
      ? rRaw
      : (parseInt(String(rRaw), 10) || 0);
    const powers = Array.isArray(obj.powers)
      ? obj.powers.filter((x): x is string => typeof x === 'string')
      : [];
    return { rating, powers };
  }
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return { rating: Number.isFinite(n) ? n : 0, powers: [] };
  }
  return { rating: 0, powers: [] };
}

/**
 * Encode a discipline value for storage. Collapses to a plain number when
 * there are no powers, so legacy-shape entries stay legacy-shape unless the
 * user actually adds a power. Keeps stored JSON minimal and compatible.
 */
export function writeDisciplineValue(rating: number, powers: string[]): DisciplineValue {
  return powers.length > 0 ? { rating, powers } : rating;
}

/**
 * Returns the clan's canonical disciplines for the given edition, excluding
 * any that the character already has. Pure function (data-driven) so it can
 * be unit-tested without rendering.
 */
export function getSuggestedDisciplineIds(
  clanId: string | undefined,
  edition: EditionId,
  currentMap: Record<string, unknown> = {}
): string[] {
  if (!clanId) return [];
  const clan = clans.find(c => c.id === clanId);
  if (!clan) return [];
  return clan.disciplines.filter(disciplineId => {
    const d = disciplines.find(x => x.id === disciplineId);
    if (!d) return false;
    if (!d.editions.includes(edition)) return false;
    return currentMap[disciplineId] === undefined;
  });
}

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
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[last] = value;
  return newObj;
}

function DynamicDotList({ value, label, max, fieldId, isReadOnly, handleUpdate, strings }: any) {
  const currentMap = typeof value === 'object' && value !== null ? value : {};
  const entries = Object.entries(currentMap);
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = () => {
    const val = newItemName.trim();
    if (val && currentMap[val] === undefined) {
      handleUpdate(fieldId, { ...currentMap, [val]: 1 });
      setNewItemName('');
    }
  };

  return (
    <div className="flex flex-col gap-2 py-2 col-span-full">
      <div className="flex items-center justify-between mb-2 border-b border-zinc-800/50 pb-2">
        <label className="text-sm text-foreground font-serif uppercase tracking-wider">{label}</label>
        {!isReadOnly && (
          <div className="flex gap-2 items-center">
            <Input 
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder={strings.add_background || "Add..."}
              className="h-7 w-40 text-xs bg-zinc-950 border-zinc-800"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleAdd}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        {entries.map(([key, rating]) => (
          <div key={key} className="flex items-center justify-between gap-4 py-1 border-b border-zinc-800/30">
            <span className="text-sm text-muted-foreground capitalize">{key}</span>
            <div className="flex items-center gap-2">
              <DotRating 
                value={typeof rating === 'number' ? rating : parseInt(String(rating)) || 0} 
                max={max} 
                onChange={v => handleUpdate(fieldId, { ...currentMap, [key]: v })} 
                readonly={isReadOnly}
              />
              {!isReadOnly && (
                <button onClick={() => {
                  const newMap = { ...currentMap };
                  delete newMap[key];
                  handleUpdate(fieldId, newMap);
                }} className="text-red-500/50 hover:text-red-500 ml-2">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-2">
            {strings.noResults || "No entries yet."}
          </div>
        )}
      </div>
    </div>
  );
}

function DisciplineList({ value, label, fieldId, isReadOnly, handleUpdate, strings, character }: any) {
  const currentMap = typeof value === 'object' && value !== null ? value : {};
  const entries = Object.entries(currentMap);
  const [selectedId, setSelectedId] = useState('');
  const [customName, setCustomName] = useState('');
  const [, setLocation] = useLocation();

  const availableDisciplines = disciplines.filter(d => d.editions.includes(character.edition));
  const suggestedIds: string[] = getSuggestedDisciplineIds(character.clan, character.edition, currentMap);

  /** A stored discipline key is "known" if it matches a discipline data id. */
  const isKnownDiscipline = (id: string) => disciplines.some(d => d.id === id);
  const openDiscipline = (id: string) => setLocation(`/compendium/disciplinas/${id}`);

  const handleAdd = () => {
    if (selectedId === 'custom') {
      const val = customName.trim();
      if (val && currentMap[val] === undefined) {
        handleUpdate(fieldId, { ...currentMap, [val]: 1 });
        setCustomName('');
        setSelectedId('');
      }
    } else if (selectedId) {
      if (currentMap[selectedId] === undefined) {
        handleUpdate(fieldId, { ...currentMap, [selectedId]: 1 });
        setSelectedId('');
      }
    }
  };

  const addSuggested = (id: string) => {
    if (currentMap[id] !== undefined) return;
    handleUpdate(fieldId, { ...currentMap, [id]: 1 });
  };

  const addAllSuggested = () => {
    if (suggestedIds.length === 0) return;
    const next: Record<string, any> = { ...currentMap };
    for (const id of suggestedIds) {
      if (next[id] === undefined) next[id] = 1;
    }
    handleUpdate(fieldId, next);
  };

  const addPower = (disciplineId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { rating, powers } = readDisciplineEntry(currentMap[disciplineId]);
    if (powers.includes(trimmed)) return; // skip exact duplicates within the same discipline
    handleUpdate(fieldId, {
      ...currentMap,
      [disciplineId]: writeDisciplineValue(rating, [...powers, trimmed]),
    });
  };

  const removePower = (disciplineId: string, index: number) => {
    const { rating, powers } = readDisciplineEntry(currentMap[disciplineId]);
    const nextPowers = powers.filter((_, i) => i !== index);
    handleUpdate(fieldId, {
      ...currentMap,
      [disciplineId]: writeDisciplineValue(rating, nextPowers),
    });
  };

  const getDisplayName = (id: string) => {
    const d = disciplines.find(x => x.id === id);
    if (d) return strings[d.name] || d.name;
    return id;
  };

  return (
    <div className="flex flex-col gap-2 py-2 col-span-full">
      <div className="flex items-center justify-between mb-2 border-b border-zinc-800/50 pb-2">
        <label className="text-sm text-foreground font-serif uppercase tracking-wider">{label}</label>
        {!isReadOnly && (
          <div className="flex gap-2 items-center">
            <select 
              value={selectedId} 
              onChange={e => setSelectedId(e.target.value)}
              className="h-7 text-xs bg-zinc-950 border border-zinc-800 rounded px-2 text-foreground"
            >
              <option value="">{strings.add_discipline || "Add Discipline..."}</option>
              {availableDisciplines.map(d => (
                <option key={d.id} value={d.id}>{strings[d.name] || d.name}</option>
              ))}
              <option value="custom">{strings.custom_discipline || "Custom..."}</option>
            </select>
            {selectedId === 'custom' && (
              <Input 
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder={strings.sheet_name || "Name..."}
                className="h-7 w-32 text-xs bg-zinc-950 border-zinc-800"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            )}
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleAdd}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      {!isReadOnly && suggestedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {strings.disciplines_suggested || "Suggested"}:
          </span>
          {suggestedIds.map(id => (
            <button
              key={id}
              type="button"
              onClick={() => addSuggested(id)}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-zinc-700 bg-zinc-950/60 text-foreground hover:bg-zinc-900 hover:border-primary/40 transition-colors"
            >
              <Plus className="w-3 h-3" aria-hidden="true" />
              {getDisplayName(id)}
            </button>
          ))}
          {suggestedIds.length > 1 && (
            <button
              type="button"
              onClick={addAllSuggested}
              className="text-xs px-2 py-1 rounded border border-primary/40 bg-primary/15 text-foreground hover:bg-primary/25 transition-colors"
            >
              {strings.disciplines_add_all_suggested || "Add all"}
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        {entries.map(([key, raw]) => {
          const { rating, powers } = readDisciplineEntry(raw);
          const showPowersStrip = powers.length > 0 || !isReadOnly;
          return (
            <div key={key} className="flex flex-col gap-1.5 py-1 border-b border-zinc-800/30">
              <div className="flex items-center justify-between gap-4">
                {isKnownDiscipline(key) ? (
                  <button
                    type="button"
                    onClick={() => openDiscipline(key)}
                    title={strings.view_discipline || "View discipline"}
                    aria-label={`${getDisplayName(key)} — ${strings.view_discipline || "View discipline"}`}
                    className="inline-flex items-center gap-1 text-sm text-foreground capitalize hover:text-primary focus:outline-none focus-visible:text-primary group"
                  >
                    <span className="underline-offset-2 group-hover:underline">{getDisplayName(key)}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary" aria-hidden="true" />
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground capitalize">{getDisplayName(key)}</span>
                )}
                <div className="flex items-center gap-2">
                  <DotRating
                    value={rating}
                    max={5}
                    onChange={v => handleUpdate(fieldId, { ...currentMap, [key]: writeDisciplineValue(v, powers) })}
                    readonly={isReadOnly}
                  />
                  {!isReadOnly && (
                    <button onClick={() => {
                      const newMap = { ...currentMap };
                      delete newMap[key];
                      handleUpdate(fieldId, newMap);
                    }} className="text-red-500/50 hover:text-red-500 ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {showPowersStrip && (
                <div className="ml-2 pl-2 border-l border-zinc-800/40 flex flex-wrap items-center gap-1">
                  {powers.map((p, i) => (
                    isReadOnly ? (
                      <span
                        key={`${p}-${i}`}
                        className="text-[11px] px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950/40 text-muted-foreground"
                      >
                        {p}
                      </span>
                    ) : (
                      <span
                        key={`${p}-${i}`}
                        className="inline-flex items-center gap-1 text-[11px] pl-1.5 pr-1 py-0.5 rounded border border-zinc-800 bg-zinc-950/40 text-foreground"
                      >
                        {p}
                        <button
                          type="button"
                          onClick={() => removePower(key, i)}
                          aria-label={strings.remove_power || "Remove power"}
                          className="text-red-500/50 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  ))}
                  {!isReadOnly && (
                    <AddPowerInput
                      placeholder={strings.add_power || "Add power..."}
                      onAdd={name => addPower(key, name)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-2">
            {strings.noResults || "No entries yet."}
          </div>
        )}
      </div>
    </div>
  );
}

function AddPowerInput({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
  };
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        placeholder={placeholder}
        className="h-6 text-[11px] bg-zinc-950 border border-zinc-800 rounded px-1.5 w-28 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={submit}
        aria-label={placeholder}
        className="text-zinc-500 hover:text-primary"
      >
        <Plus className="w-3 h-3" />
      </button>
    </span>
  );
}

/**
 * Category catalogue shown in the editor dropdown AND used for the
 * view-mode grouping order. Keep this list explicit so the UI renders
 * categories in the same intuitive order on every character.
 */
const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'weapon', 'armor', 'tool', 'equipment',
  'document', 'vehicle', 'occult', 'personal',
  'money', 'other',
];

/** Render order for view-mode grouping. `uncategorized` sinks to the end. */
type GroupKey = InventoryCategory | 'uncategorized';
const INVENTORY_GROUP_ORDER: GroupKey[] = [...INVENTORY_CATEGORIES, 'uncategorized'];

function getInventoryCategoryLabel(category: string | undefined, strings: Record<string, string>): string {
  switch (category) {
    case 'weapon': return strings.inventory_cat_weapon || "Weapon";
    case 'armor': return strings.inventory_cat_armor || "Armor";
    case 'tool': return strings.inventory_cat_tool || "Tool";
    case 'equipment': return strings.inventory_cat_equipment || "Equipment";
    case 'document': return strings.inventory_cat_document || "Document";
    case 'vehicle': return strings.inventory_cat_vehicle || "Vehicle";
    case 'occult': return strings.inventory_cat_occult || "Occult Item";
    case 'personal': return strings.inventory_cat_personal || "Personal Item";
    case 'money': return strings.inventory_cat_money || "Cash / Resource";
    case 'other': return strings.inventory_cat_other || "Other";
    case 'uncategorized': return strings.inventory_cat_uncategorized || "Uncategorized";
    default: return category || "—";
  }
}

function InventoryList({ value, label, fieldId, isReadOnly, handleUpdate, strings }: any) {
  const items: InventoryItem[] = Array.isArray(value) ? value : [];
  const totalCount = items.length;

  const addItem = () => {
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: '',
      quantity: 1,
      category: 'equipment',
    };
    handleUpdate(fieldId, [...items, newItem]);
  };

  const updateItem = (id: string, patch: Partial<InventoryItem>) => {
    handleUpdate(fieldId, items.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    handleUpdate(fieldId, items.filter(it => it.id !== id));
  };

  // Group by category using the explicit render order so categories appear
  // consistently across characters. Empty groups are filtered out below.
  const groups = (() => {
    const map = new Map<GroupKey, InventoryItem[]>();
    for (const it of items) {
      const key: GroupKey = it.category ?? 'uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return INVENTORY_GROUP_ORDER
      .map(key => ({ key, items: map.get(key) ?? [] }))
      .filter(g => g.items.length > 0);
  })();

  return (
    <div className="col-span-full flex flex-col gap-3">
      <div className="flex items-center justify-between mb-2 border-b border-zinc-800/50 pb-2">
        <label className="text-sm text-foreground font-serif uppercase tracking-wider flex items-center gap-2">
          {label}
          {totalCount > 0 && (
            <span className="text-[10px] uppercase tracking-widest border border-border px-1.5 rounded bg-zinc-900 text-muted-foreground">
              {totalCount}
            </span>
          )}
        </label>
        {!isReadOnly && (
          <Button size="sm" variant="outline" onClick={addItem} className="h-7 px-2 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> {strings.add_inventory_item || "Add item"}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs italic text-muted-foreground py-1">
          {strings.no_inventory_items || "No inventory items yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <section key={group.key} aria-label={getInventoryCategoryLabel(group.key, strings)}>
              <h4 className="text-[11px] font-sans uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
                <span>{getInventoryCategoryLabel(group.key, strings)}</span>
                <span className="text-zinc-600">({group.items.length})</span>
              </h4>
              <ul className="space-y-2">
                {group.items.map(item => (
                  <li key={item.id}>
                    {isReadOnly ? (
                      <div className="border-b border-zinc-800/30 pb-2">
                        <div className="flex items-baseline flex-wrap gap-2 text-sm">
                          <span className="text-foreground">{item.name || "—"}</span>
                          {typeof item.quantity === 'number' && (
                            <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                          )}
                          {item.equipped && (
                            <span className="text-[9px] uppercase tracking-widest border border-primary/40 bg-primary/10 text-primary px-1 rounded">
                              {strings.inventory_equipped || "Equipped"}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-md bg-zinc-950/40 p-2 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={item.category || 'equipment'}
                            onChange={e => updateItem(item.id, { category: e.target.value as InventoryCategory })}
                            className="h-7 text-xs bg-zinc-950 border border-zinc-800 rounded px-1.5 text-foreground"
                            aria-label={strings.inventory_item_category || "Category"}
                          >
                            {INVENTORY_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{getInventoryCategoryLabel(cat, strings)}</option>
                            ))}
                          </select>
                          <Input
                            value={item.name}
                            onChange={e => updateItem(item.id, { name: e.target.value })}
                            placeholder={strings.inventory_item_name || "Item name"}
                            className="h-7 text-xs bg-zinc-950 border-zinc-800 flex-1 min-w-[120px]"
                          />
                          <Input
                            type="number"
                            min={0}
                            value={typeof item.quantity === 'number' ? item.quantity : ''}
                            onChange={e => {
                              const v = e.target.value;
                              if (v === '') {
                                updateItem(item.id, { quantity: undefined });
                              } else {
                                const n = parseInt(v, 10);
                                if (Number.isFinite(n)) updateItem(item.id, { quantity: n });
                              }
                            }}
                            placeholder="1"
                            aria-label={strings.inventory_item_qty || "Quantity"}
                            className="h-7 text-xs bg-zinc-950 border-zinc-800 w-16"
                          />
                          <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!item.equipped}
                              onChange={e => updateItem(item.id, { equipped: e.target.checked || undefined })}
                              className="accent-primary"
                              aria-label={strings.inventory_equipped || "Equipped"}
                            />
                            {strings.inventory_equipped || "Equipped"}
                          </label>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={strings.remove_inventory_item || "Remove item"}
                            className="text-red-500/50 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <Textarea
                          value={item.notes || ''}
                          onChange={e => updateItem(item.id, { notes: e.target.value })}
                          placeholder={strings.inventory_item_notes || "Notes (optional)"}
                          className="bg-zinc-950 border-zinc-800 min-h-[40px] text-xs"
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function DynamicSheet({ character, schema, onChange, readonly = false }: DynamicSheetProps) {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  /** Local-only collapsed state for sections. Not persisted; not in character data. */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setCollapsed(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  /** A field is read-only if we're in View Mode AND it's not a gameplay tracker. */
  const isFieldReadOnly = (field: FieldDef): boolean => {
    if (!readonly) return false;       // Edit Mode: everything editable
    return !field.gameplay;            // View Mode: only gameplay fields editable
  };

  const handleUpdate = (fieldId: string, value: any, field?: FieldDef) => {
    // Block updates for non-gameplay fields in View Mode
    if (readonly && (!field || !field.gameplay)) return;
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
              onChange={e => handleUpdate(field.id, e.target.value, field)} 
              readOnly={isFieldReadOnly(field)}
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
              onChange={e => handleUpdate(field.id, e.target.value, field)} 
              readOnly={isFieldReadOnly(field)}
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
              onChange={e => handleUpdate(field.id, parseInt(e.target.value) || 0, field)} 
              readOnly={isFieldReadOnly(field)}
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
              onChange={v => handleUpdate(field.id, v, field)} 
              readonly={isFieldReadOnly(field)}
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
                onChange={v => handleUpdate(field.id, { ...safeValue, ...v }, field)}
                readonly={isFieldReadOnly(field)}
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
                        handleUpdate(field.id, { ...value, current: num }, field);
                      } else {
                        handleUpdate(field.id, num, field);
                      }
                    }} 
                    readOnly={isFieldReadOnly(field)}
                    className="w-16 bg-zinc-950 border-zinc-800"
                  />
                  <span className="text-xs text-muted-foreground">/ {classicMax}</span>
               </div>
             </div>
           );
        }
      case 'dynamic-dots-5':
        return (
          <DynamicDotList key={field.id} value={value} label={label} max={5} fieldId={field.id} isReadOnly={readonly} handleUpdate={handleUpdate} strings={strings} />
        );
      case 'special-disciplines':
        return (
          <DisciplineList key={field.id} value={value} label={label} fieldId={field.id} isReadOnly={readonly} handleUpdate={handleUpdate} strings={strings} character={character} />
        );
      case 'inventory':
        return (
          <InventoryList key={field.id} value={value} label={label} fieldId={field.id} isReadOnly={readonly} handleUpdate={handleUpdate} strings={strings} />
        );
      default:
        return (
          <div key={field.id || field.labelKey || Math.random()} className="flex flex-col gap-1 border-b border-zinc-800/30 py-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">{label}</label>
            <div className="text-sm text-muted-foreground">Unsupported field type: {field.type || 'unknown'}</div>
          </div>
        );
    }
  };

  const sections = Array.isArray(schema.sections) ? schema.sections : [];
  const sectionIds = sections.map((s, i) => s.id || s.labelKey || String(i));
  const allCollapsed = sectionIds.length > 0 && sectionIds.every(id => collapsed[id]);

  const toggleAll = () => {
    if (allCollapsed) {
      setCollapsed({});
    } else {
      const next: Record<string, boolean> = {};
      for (const id of sectionIds) next[id] = true;
      setCollapsed(next);
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {sections.length > 1 && (
        <div className="flex justify-end -mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            aria-pressed={allCollapsed}
            className="gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${allCollapsed ? "-rotate-90" : ""}`} aria-hidden="true" />
            {allCollapsed
              ? (strings.sheet_expand_all || "Expand all")
              : (strings.sheet_collapse_all || "Collapse all")}
          </Button>
        </div>
      )}
      {sections.map((section, sectionIndex) => {
        const sectionId = section.id || section.labelKey || String(sectionIndex);
        const isCollapsed = !!collapsed[sectionId];
        const sectionLabel = strings[section.labelKey] || section.labelKey;
        const bodyId = `sheet-section-body-${sectionId}`;
        return (
          <section key={sectionId} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 md:p-8">
            <button
              type="button"
              onClick={() => toggleSection(sectionId)}
              aria-expanded={!isCollapsed}
              aria-controls={bodyId}
              className="w-full flex items-center justify-between gap-3 uppercase tracking-widest border-b border-zinc-800 pb-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
            >
              <h2 className="font-serif text-xl text-primary">
                {sectionLabel}
              </h2>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform shrink-0 ${isCollapsed ? "-rotate-90" : ""}`}
                aria-hidden="true"
              />
            </button>
            <div
              id={bodyId}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 ${isCollapsed ? "hidden" : "mt-6"}`}
            >
              {(Array.isArray(section.fields) ? section.fields : []).map(field => renderField(field))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
