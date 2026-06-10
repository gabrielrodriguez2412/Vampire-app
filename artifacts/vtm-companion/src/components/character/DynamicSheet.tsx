import React, { useState } from "react";
import { useLocation } from "wouter";
import { Character, EditionId, DisciplineValue, InventoryItem, InventoryCategory, CharacterNote, CharacterNoteCategory } from "@/types";
import { SheetSchema, FieldDef } from "@/data/characterSheets/schemas";
import { DotRating } from "./DotRating";
import { DamageTracker } from "./DamageTracker";
import { ClassicHealthTracker } from "./ClassicHealthTracker";
import { ClassicPoolTracker } from "./ClassicPoolTracker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Plus, X, ChevronDown, ExternalLink, Pencil, Trash2, Check,
  Sword, Shield, Wrench, Backpack, FileText, Car, Sparkles, Heart, Coins, Package2, Package,
} from "lucide-react";
import { UI_STRINGS } from "@/i18n/ui";
import { useAppContext } from "@/context/AppContext";
import { disciplines } from "@/data/disciplines";
import { clans } from "@/data/clans";
import { getClanDisciplinesForEdition } from "@/utils/content";
import { getDisciplineDisplayName } from "@/utils/disciplineDisplay";
import {
  generateSuggestion,
  isFieldAvailable,
  GeneratorField,
} from "@/data/characterGenerator";

/**
 * Batch AR — map the sheet's text-field ids to the GeneratorField the
 * inspiration generator understands. Fields not in the map (playerName,
 * chronicle, sire, etc.) never see a Suggest control on the sheet, so
 * the UI stays calm and we don't fan out generator buttons everywhere.
 */
const SHEET_FIELD_TO_GEN: Readonly<Record<string, GeneratorField>> = {
  name: 'name',
  concept: 'concept',
  ambition: 'ambition',
  desire: 'desire',
  predatorType: 'predator',
  nature: 'nature',
  demeanor: 'demeanor',
};

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
  // Batch S: route through the edition-aware helper instead of
  // iterating the flat `clan.disciplines` union and filtering by
  // each discipline's `editions`. The helper picks
  // `clan.disciplinesByEdition[edition]` when present (e.g., Giovanni
  // V20 → Dominate/Necromancy/Potence, distinct from V5 Hecata's
  // Auspex/Fortitude/Oblivion) and otherwise falls back to the flat
  // list with the same `editions` filter the old inline code applied,
  // so clans without an override (Brujah, Tremere, Lasombra, …) keep
  // their previous behaviour byte-for-byte.
  return getClanDisciplinesForEdition(clan, edition).filter(
    disciplineId => currentMap[disciplineId] === undefined,
  );
}

interface DynamicSheetProps {
  character: Character;
  schema: SheetSchema;
  onChange: (char: Character) => void;
  readonly?: boolean;
  /**
   * Display name of the chronicle this character is linked to (via
   * `chronicleId`), if any. Used to prefill the free-text "Chronicle" field
   * when it is empty. Purely a render-layer fallback — it never mutates the
   * stored value, so a manual entry is always preserved.
   */
  linkedChronicleName?: string;
}

/**
 * Resolve the value shown in the free-text "Chronicle" field. When the stored
 * value is blank and the character is linked to a chronicle, fall back to the
 * linked chronicle's name; otherwise show the stored value verbatim. A manual
 * (non-blank) entry always wins, so user edits are never overwritten.
 */
export function resolveChronicleFieldValue(stored: unknown, linkedChronicleName?: string): string {
  const current = stored != null ? String(stored) : '';
  if (current.trim() === '' && linkedChronicleName && linkedChronicleName.trim() !== '') {
    return linkedChronicleName;
  }
  return current;
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

function DisciplineList({ value, label, fieldId, isReadOnly, handleUpdate, strings, character, mode }: any) {
  // Batch BI-1 — `mode: 'ghoul'` constrains the vampire-shaped UI for the
  // classic-Ghoul Powers card. The only behavior change is hiding the
  // "Add all suggested" bulk action: ghouls should pick powers
  // deliberately. Default ('vampire') leaves the existing UI byte-for-byte
  // unchanged.
  const isGhoulMode = mode === 'ghoul';
  // Batch U: pull the active language so discipline names render in
  // the selected locale (e.g. Obfuscate → Ofuscación in Spanish)
  // through the shared `getDisciplineDisplayName` helper, instead of
  // the old `strings[d.name] || d.name` lookup that only ever matched
  // English data-side names and silently fell back to English.
  const { activeLanguage } = useAppContext();
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
    // Known disciplines route through the shared language-aware helper;
    // custom / unknown ids (player-authored disciplines) fall back to
    // the raw id so nothing is lost.
    if (disciplines.some(d => d.id === id)) {
      return getDisciplineDisplayName(id, activeLanguage);
    }
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
                <option key={d.id} value={d.id}>{getDisciplineDisplayName(d.id, activeLanguage)}</option>
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
          {suggestedIds.length > 1 && !isGhoulMode && (
            <button
              type="button"
              onClick={addAllSuggested}
              data-testid="disciplines-add-all-suggested"
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

/** Visual identity glyph for each inventory category — used in group headings
 *  so users can scan the inventory by silhouette without reading the label. */
function InventoryCategoryIcon({ category, className }: { category: string; className?: string }) {
  const props = { className: className || "w-3.5 h-3.5", "aria-hidden": true as const };
  switch (category) {
    case 'weapon': return <Sword {...props} />;
    case 'armor': return <Shield {...props} />;
    case 'tool': return <Wrench {...props} />;
    case 'equipment': return <Backpack {...props} />;
    case 'document': return <FileText {...props} />;
    case 'vehicle': return <Car {...props} />;
    case 'occult': return <Sparkles {...props} />;
    case 'personal': return <Heart {...props} />;
    case 'money': return <Coins {...props} />;
    case 'other': return <Package2 {...props} />;
    default: return <Package {...props} />;
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
      {/* Section header — title with optional count badge + Add Item action. */}
      <div className="flex items-center justify-between gap-3 mb-1 border-b border-zinc-800/50 pb-2">
        <label className="text-sm text-foreground font-serif uppercase tracking-wider flex items-center gap-2 min-w-0">
          <span className="truncate">{label}</span>
          {totalCount > 0 && (
            <span className="text-[10px] uppercase tracking-widest border border-border px-1.5 py-0.5 rounded bg-zinc-900 text-muted-foreground shrink-0">
              {totalCount}
            </span>
          )}
        </label>
        {!isReadOnly && (
          <Button size="sm" variant="outline" onClick={addItem} className="h-7 px-2 text-xs gap-1 shrink-0">
            <Plus className="w-3.5 h-3.5" /> {strings.add_inventory_item || "Add item"}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs italic text-muted-foreground py-1">
          {strings.no_inventory_items || "No inventory items yet."}
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <section key={group.key} aria-label={getInventoryCategoryLabel(group.key, strings)}>
              {/* Category heading — icon + label + subtle count chip, separated
                  from items by a thin line so the group reads as a block. */}
              <h4 className="text-[11px] font-sans uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2 border-b border-zinc-800/30 pb-1">
                <InventoryCategoryIcon category={group.key} className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span className="truncate">{getInventoryCategoryLabel(group.key, strings)}</span>
                <span className="text-[10px] text-zinc-500 normal-case tracking-normal shrink-0">{group.items.length}</span>
              </h4>
              <ul className={isReadOnly ? "divide-y divide-zinc-800/30" : "space-y-2"}>
                {group.items.map(item => (
                  <li key={item.id}>
                    {isReadOnly ? (
                      /* View mode — compact row:
                         left side has name + (compact) notes underneath,
                         right side has the quantity tally and the equipped chip. */
                      <div className="flex items-start justify-between gap-3 py-1.5 group">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{item.name || "—"}</p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground/90 mt-0.5 whitespace-pre-wrap leading-snug">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          {typeof item.quantity === 'number' && (
                            <span className="text-xs text-zinc-400 tabular-nums">×{item.quantity}</span>
                          )}
                          {item.equipped && (
                            <span
                              className="text-[9px] uppercase tracking-widest border border-primary/30 bg-primary/5 text-primary/90 px-1.5 py-0.5 rounded"
                              title={strings.inventory_equipped || "Equipped"}
                            >
                              {strings.inventory_equipped || "Equipped"}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Edit mode — tight bordered card with two rows:
                         row 1 holds the inline controls (category, name, qty,
                         equipped, delete); row 2 holds the notes textarea. */
                      <div className="border border-zinc-800 rounded-md bg-zinc-950/40 hover:border-zinc-700 transition-colors p-2.5 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <InventoryCategoryIcon
                              category={item.category || 'equipment'}
                              className="w-3.5 h-3.5 text-zinc-500"
                            />
                            <select
                              value={item.category || 'equipment'}
                              onChange={e => updateItem(item.id, { category: e.target.value as InventoryCategory })}
                              className="h-7 text-xs bg-zinc-950 border border-zinc-800 rounded px-1.5 text-foreground hover:border-zinc-700 focus:outline-none focus:border-primary/40"
                              aria-label={strings.inventory_item_category || "Category"}
                            >
                              {INVENTORY_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{getInventoryCategoryLabel(cat, strings)}</option>
                              ))}
                            </select>
                          </span>
                          <Input
                            value={item.name}
                            onChange={e => updateItem(item.id, { name: e.target.value })}
                            placeholder={strings.inventory_item_name || "Item name"}
                            className="h-7 text-xs bg-zinc-950 border-zinc-800 flex-1 min-w-[140px] focus-visible:border-primary/40"
                          />
                          <div className="inline-flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-muted-foreground">×</span>
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
                              className="h-7 text-xs bg-zinc-950 border-zinc-800 w-14 tabular-nums focus-visible:border-primary/40"
                            />
                          </div>
                          <label
                            className={`inline-flex items-center gap-1.5 text-[11px] cursor-pointer select-none rounded px-1.5 py-1 border transition-colors shrink-0 ${
                              item.equipped
                                ? "border-primary/30 bg-primary/5 text-primary/90"
                                : "border-zinc-800 text-muted-foreground hover:border-zinc-700"
                            }`}
                          >
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
                            className="ml-auto text-zinc-500 hover:text-red-500 transition-colors shrink-0 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <Textarea
                          value={item.notes || ''}
                          onChange={e => updateItem(item.id, { notes: e.target.value })}
                          placeholder={strings.inventory_item_notes || "Notes (optional)"}
                          className="bg-zinc-950 border-zinc-800 min-h-[36px] text-xs leading-snug focus-visible:border-primary/40"
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

/**
 * Display/render order for journal categories. Kept explicit so categories
 * appear in the same intuitive order on every character. `'other'` sinks
 * to the end as a catch-all.
 */
const JOURNAL_CATEGORIES: CharacterNoteCategory[] = [
  'general', 'backstory', 'goals', 'secrets', 'contacts', 'session', 'other',
];

function getJournalCategoryLabel(
  category: CharacterNoteCategory,
  strings: Record<string, string>
): string {
  switch (category) {
    case 'general':   return strings.journal_category_general   || "General";
    case 'backstory': return strings.journal_category_backstory || "Backstory";
    case 'goals':     return strings.journal_category_goals     || "Goals";
    case 'secrets':   return strings.journal_category_secrets   || "Secrets";
    case 'contacts':  return strings.journal_category_contacts  || "Contacts";
    case 'session':   return strings.journal_category_session   || "Session";
    case 'other':     return strings.journal_category_other     || "Other";
    default:          return category;
  }
}

/** Best-effort localized short date label; falls back to ISO slice on failure. */
function formatJournalDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * Character journal list — structured notes attached to a character.
 *
 * View Mode (`isReadOnly === true`):
 *   - Shows entries as read-only cards (category pill, title, body, updated date).
 *   - No add/edit/delete UI.
 *
 * Edit Mode:
 *   - "Add note" button creates an inline editor (a draft entry kept in local
 *     state and only persisted on Save).
 *   - Each existing entry shows Edit + Delete actions; Edit replaces the card
 *     with the same inline editor; Delete asks for inline confirmation.
 *
 * Pure presentation: persistence happens via the `handleUpdate` callback
 * (same path as inventory). Never touches localStorage directly.
 */
function JournalList({ value, label, fieldId, isReadOnly, handleUpdate, strings }: any) {
  const notes: CharacterNote[] = Array.isArray(value) ? value : [];
  // Newest-first display so recent entries are top-of-mind.
  const ordered = React.useMemo(() => {
    return [...notes].sort((a, b) => {
      const ta = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      const tb = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return tb - ta;
    });
  }, [notes]);

  // Editor state. `editingId === '__new__'` means a draft for a brand-new note.
  // We keep edits in local state until the user clicks Save, so half-typed
  // content doesn't trigger a storage write on every keystroke.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    category: CharacterNoteCategory;
    title: string;
    body: string;
  }>({ category: 'general', title: '', body: '' });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const startNew = () => {
    setEditingId('__new__');
    setDraft({ category: 'general', title: '', body: '' });
    setPendingDeleteId(null);
  };

  const startEdit = (note: CharacterNote) => {
    setEditingId(note.id);
    setDraft({ category: note.category, title: note.title, body: note.body });
    setPendingDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ category: 'general', title: '', body: '' });
  };

  const saveDraft = () => {
    const title = draft.title.trim();
    const body = draft.body.trim();
    // Don't persist an empty note — silently cancel if the user saved nothing.
    if (!title && !body) {
      cancelEdit();
      return;
    }
    const nowIso = new Date().toISOString();
    if (editingId === '__new__') {
      const newNote: CharacterNote = {
        id: crypto.randomUUID(),
        category: draft.category,
        title,
        body,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      handleUpdate(fieldId, [newNote, ...notes]);
    } else if (editingId) {
      handleUpdate(fieldId, notes.map(n =>
        n.id === editingId
          ? { ...n, category: draft.category, title, body, updatedAt: nowIso }
          : n
      ));
    }
    cancelEdit();
  };

  const confirmDelete = (id: string) => {
    handleUpdate(fieldId, notes.filter(n => n.id !== id));
    setPendingDeleteId(null);
    // If the deleted note was being edited, drop the editor too.
    if (editingId === id) cancelEdit();
  };

  const Editor = (
    <div className="border border-primary/30 bg-zinc-950/60 rounded-md p-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">
          {strings.journal_category_label || "Category"}
        </label>
        <select
          value={draft.category}
          onChange={e => setDraft(d => ({ ...d, category: e.target.value as CharacterNoteCategory }))}
          className="h-7 text-xs bg-zinc-950 border border-zinc-800 rounded px-1.5 text-foreground hover:border-zinc-700 focus:outline-none focus:border-primary/40"
        >
          {JOURNAL_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{getJournalCategoryLabel(cat, strings)}</option>
          ))}
        </select>
      </div>
      <Input
        value={draft.title}
        onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
        placeholder={strings.journal_title_placeholder || "Title (optional)"}
        aria-label={strings.journal_title_label || "Title"}
        className="h-8 text-sm bg-zinc-950 border-zinc-800 focus-visible:border-primary/40"
      />
      <Textarea
        value={draft.body}
        onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
        placeholder={strings.journal_body_placeholder || "Write your note here..."}
        aria-label={strings.journal_body_label || "Body"}
        className="bg-zinc-950 border-zinc-800 min-h-[100px] text-sm leading-snug focus-visible:border-primary/40"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={cancelEdit} className="h-7 px-3 text-xs">
          {strings.journal_cancel || "Cancel"}
        </Button>
        <Button type="button" size="sm" onClick={saveDraft} className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
          {strings.journal_save || "Save"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="col-span-full flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 mb-1 border-b border-zinc-800/50 pb-2">
        <label className="text-sm text-foreground font-serif uppercase tracking-wider flex items-center gap-2 min-w-0">
          <span className="truncate">{label}</span>
          {ordered.length > 0 && (
            <span className="text-[10px] uppercase tracking-widest border border-border px-1.5 py-0.5 rounded bg-zinc-900 text-muted-foreground shrink-0">
              {ordered.length}
            </span>
          )}
        </label>
        {!isReadOnly && editingId === null && (
          <Button size="sm" variant="outline" onClick={startNew} className="h-7 px-2 text-xs gap-1 shrink-0">
            <Plus className="w-3.5 h-3.5" /> {strings.journal_add_note || "Add note"}
          </Button>
        )}
      </div>

      {/* Inline draft editor for a new note appears above the list. */}
      {!isReadOnly && editingId === '__new__' && Editor}

      {ordered.length === 0 && editingId !== '__new__' ? (
        <p className="text-xs italic text-muted-foreground py-1">
          {strings.journal_empty || "No notes yet."}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {ordered.map(note => {
            if (!isReadOnly && editingId === note.id) {
              return <li key={note.id}>{Editor}</li>;
            }
            const updatedLabel = formatJournalDate(note.updatedAt || note.createdAt);
            return (
              <li key={note.id} className="border border-zinc-800 rounded-md bg-zinc-950/40 hover:border-zinc-700 transition-colors p-3">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-[10px] uppercase tracking-widest border border-primary/30 bg-primary/5 text-primary/90 px-1.5 py-0.5 rounded shrink-0">
                      {getJournalCategoryLabel(note.category, strings)}
                    </span>
                    <h5 className="font-serif text-sm text-foreground truncate min-w-0">
                      {note.title.trim() || (
                        <span className="italic text-muted-foreground">
                          {strings.journal_untitled || "(untitled)"}
                        </span>
                      )}
                    </h5>
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        aria-label={strings.journal_edit || "Edit"}
                        className="text-zinc-500 hover:text-primary transition-colors p-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(note.id)}
                        aria-label={strings.journal_delete || "Delete"}
                        className="text-zinc-500 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {note.body && (
                  <p className="text-xs text-muted-foreground/95 whitespace-pre-wrap leading-snug">
                    {note.body}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  {updatedLabel && (
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                      {strings.journal_updated_label || "Updated"} {updatedLabel}
                    </span>
                  )}
                  {!isReadOnly && pendingDeleteId === note.id && (
                    <span className="ml-auto inline-flex items-center gap-2">
                      <span className="text-[11px] text-red-400">
                        {strings.journal_confirm_delete || "Delete this note?"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                        className="text-[11px] underline text-muted-foreground hover:text-foreground"
                      >
                        {strings.journal_cancel || "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(note.id)}
                        className="text-[11px] underline text-red-400 hover:text-red-300"
                      >
                        {strings.journal_delete || "Delete"}
                      </button>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DynamicSheet({ character, schema, onChange, readonly = false, linkedChronicleName }: DynamicSheetProps) {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  /** Local-only collapsed state for sections. Not persisted; not in character data. */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Batch AR — sheet-level generator state. Pending suggestion per
  // schema field id (e.g. 'name', 'concept', 'ambition'). The chip is
  // the only writer; the input itself is never auto-mutated. Cleared
  // when the user dismisses, uses, or navigates away from /character.
  const [sheetSuggestions, setSheetSuggestions] = useState<Record<string, string>>({});
  const [sheetLastSuggestions, setSheetLastSuggestions] = useState<Record<string, string>>({});

  const handleSuggestSheetField = (fieldId: string) => {
    const genField = SHEET_FIELD_TO_GEN[fieldId];
    if (!genField) return;
    const value = generateSuggestion(
      genField,
      character.edition as EditionId,
      activeLanguage,
      undefined,
      sheetLastSuggestions[fieldId],
      // Batch BC — thread the character's kind so a mortal sheet's
      // Suggest button draws from the kind-appropriate pool.
      character.kind ?? 'vampire',
    );
    if (!value) return;
    setSheetSuggestions(prev => ({ ...prev, [fieldId]: value }));
    setSheetLastSuggestions(prev => ({ ...prev, [fieldId]: value }));
  };
  const handleUseSheetSuggestion = (fieldId: string, field: FieldDef) => {
    const value = sheetSuggestions[fieldId];
    if (!value) return;
    handleUpdate(fieldId, value, field);
    setSheetSuggestions(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };
  const handleDismissSheetSuggestion = (fieldId: string) => {
    setSheetSuggestions(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

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

  // Batch BE-1 — opt-in morality tracker, Human / Ghoul only. The toggle
  // lives outside the schema so the existing renderer doesn't need a new
  // field type; turning it on / off only flips `trackMorality` and (the
  // first time it's enabled) seeds a default `humanity: 7` when no
  // dormant value is already on the character. Disabling preserves the
  // stored `humanity` so a future opt-in doesn't lose play state.
  const characterKind = character.kind ?? 'vampire';
  const isMortalKind = characterKind === 'human' || characterKind === 'ghoul';
  const trackMoralityEnabled = isMortalKind && character.trackMorality === true;
  const moralityLabelKey = character.edition === 'V5' ? 'sheet_humanity' : 'sheet_humanity_path';

  const toggleTrackMorality = (next: boolean) => {
    if (!isMortalKind) return;
    // The toggle is a build-time choice, not a gameplay tracker, so it
    // honors the View-Mode lock the same way Predator Type / Concept do.
    if (readonly) return;
    let updated: Character = { ...character, trackMorality: next } as Character;
    if (next) {
      // Seed a safe default only when no value is already present. A
      // dormant `humanity` from earlier batches (AX / AY) survives this
      // path untouched.
      const existing = (character as { humanity?: unknown }).humanity;
      if (typeof existing !== 'number' || !Number.isFinite(existing)) {
        updated = setProperty(updated, 'humanity', 7) as Character;
      }
    }
    onChange(updated);
  };

  // Batch BG — opt-in Vitae tracker for classic-edition Ghouls. Mirrors
  // the Morality toggle pattern but gates on `kind === 'ghoul'` AND a
  // non-V5 edition (V5 ghoul vitae is deferred per the BF audit §3).
  // Independent from `trackMorality` — both flags can be on, off, or
  // mixed without interacting. Seeds `{ current: 3, max: 3 }` on opt-in
  // when no `bloodPool` value is already stored; preserves any dormant
  // pre-Batch-BA value (e.g. the legacy 10/10 from when ghouls flowed
  // through the vampire-shaped pipeline) verbatim if one exists.
  const isGhoulClassic = characterKind === 'ghoul' && character.edition !== 'V5';
  const trackVitaeEnabled = isGhoulClassic && character.trackVitae === true;

  const toggleTrackVitae = (next: boolean) => {
    if (!isGhoulClassic) return;
    if (readonly) return;
    let updated: Character = { ...character, trackVitae: next } as Character;
    if (next) {
      const existing = (character as { bloodPool?: unknown }).bloodPool;
      const isPoolObject =
        typeof existing === 'object' && existing !== null &&
        typeof (existing as { current?: unknown }).current === 'number' &&
        typeof (existing as { max?: unknown }).max === 'number';
      if (!isPoolObject) {
        updated = setProperty(updated, 'bloodPool', { current: 3, max: 3 }) as Character;
      }
    }
    onChange(updated);
  };

  // Batch BI-1 — opt-in Powers section for classic-edition Ghouls. Gated
  // on the same `isGhoulClassic` predicate as Vitae (kind === 'ghoul' AND
  // edition !== 'V5'); independent of `trackMorality` and `trackVitae`.
  // Pure visibility flag: enabling does NOT seed any `disciplines` data
  // (the dormant map is left verbatim, including the empty {} that
  // createEmptyCharacter seeds for every kind); disabling does NOT erase
  // it, so re-enabling later restores the same entries.
  const trackGhoulPowersEnabled = isGhoulClassic && character.trackGhoulPowers === true;

  const toggleTrackGhoulPowers = (next: boolean) => {
    if (!isGhoulClassic) return;
    if (readonly) return;
    onChange({ ...character, trackGhoulPowers: next } as Character);
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
      case 'text': {
        // Batch AR — inspiration generator (sheet integration).
        //
        // We only surface a Suggest control when:
        //   1. The field id maps to a GeneratorField we support.
        //   2. The pool for that field+edition+language is non-empty
        //      (covers V5-vs-classic gating automatically).
        //   3. The sheet is in Edit Mode (these are build-time
        //      fields, not gameplay trackers). When the row is
        //      readonly we render nothing — same calm View Mode UX.
        // The generator never mutates the input; the chip is the
        // only writer, and "Use" is the only action that writes.
        const genField = SHEET_FIELD_TO_GEN[field.id];
        const inputIsReadOnly = isFieldReadOnly(field);
        const canSuggest =
          !!genField &&
          !inputIsReadOnly &&
          // Batch BC — kind-aware Suggest gating so a human / ghoul sheet
          // never offers a predator / ambition / desire suggestion.
          isFieldAvailable(genField, character.edition as EditionId, activeLanguage, character.kind ?? 'vampire');
        const pendingSuggestion = sheetSuggestions[field.id];
        const inputValue = field.id === 'chronicle'
          ? resolveChronicleFieldValue(value, linkedChronicleName)
          : (value != null ? String(value) : '');
        const suggestAria = (strings.gen_suggest_for || 'Suggest {field}').replace('{field}', label);
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">{label}</label>
              {canSuggest && (
                <button
                  type="button"
                  onClick={() => handleSuggestSheetField(field.id)}
                  aria-label={suggestAria}
                  title={suggestAria}
                  data-testid={`sheet-gen-suggest-${field.id}`}
                  className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                >
                  <Sparkles className="w-3 h-3" aria-hidden />
                  {strings.gen_suggest || 'Suggest'}
                </button>
              )}
            </div>
            <Input
              value={inputValue}
              onChange={e => handleUpdate(field.id, e.target.value, field)}
              readOnly={inputIsReadOnly}
              className="bg-transparent border-0 border-b border-zinc-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary-container"
            />
            {canSuggest && pendingSuggestion && (
              <div
                data-testid={`sheet-gen-chip-${field.id}`}
                className="mt-1 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5"
              >
                <Sparkles className="w-3 h-3 mt-1 text-primary shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs italic text-foreground/80 break-words">{pendingSuggestion}</p>
                  {String(value ?? '').trim().length > 0 && (
                    <p className="text-[10px] text-amber-300/80 mt-0.5">
                      {strings.gen_replace_warning || 'This will replace your text.'}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseSheetSuggestion(field.id, field)}
                  className="h-6 px-2 text-[10px] uppercase tracking-wider"
                  data-testid={`sheet-gen-use-${field.id}`}
                >
                  <Check className="w-3 h-3 mr-1" /> {strings.gen_use || 'Use'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDismissSheetSuggestion(field.id)}
                  aria-label={strings.gen_dismiss || 'Dismiss'}
                  title={strings.gen_dismiss || 'Dismiss'}
                  className="h-6 w-6 shrink-0"
                  data-testid={`sheet-gen-dismiss-${field.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        );
      }
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
      case 'number': {
        // Batch AV — optional numeric fields (currently V5 Generation) render
        // as a blank input when the underlying value is undefined / NaN /
        // garbage, and write `undefined` back when the player clears the
        // input. Every other number field keeps the legacy "coerce to 0"
        // behavior so existing trackers (Experience, classic Generation)
        // continue to display 0 / their stored default rather than blank.
        const isOptional = field.optional === true;
        const numericValue =
          typeof value === 'number' && Number.isFinite(value)
            ? value
            : isOptional
              ? null
              : parseInt(String(value)) || 0;
        const inputValue = numericValue == null ? '' : numericValue;
        const onChangeFor = (raw: string) => {
          if (isOptional) {
            const trimmed = raw.trim();
            if (trimmed === '') {
              handleUpdate(field.id, undefined, field);
              return;
            }
            const parsed = parseInt(trimmed, 10);
            handleUpdate(field.id, Number.isFinite(parsed) ? parsed : undefined, field);
            return;
          }
          handleUpdate(field.id, parseInt(raw) || 0, field);
        };
        return (
          <div key={field.id} className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-sans">{label}</label>
            <Input
              type="number"
              value={inputValue}
              onChange={e => onChangeFor(e.target.value)}
              readOnly={isFieldReadOnly(field)}
              placeholder={isOptional ? '—' : undefined}
              data-testid={`sheet-number-${field.id}`}
              className="bg-transparent border-0 border-b border-zinc-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary-container w-20"
            />
          </div>
        );
      }
      case 'dots-5':
      case 'dots-10':
        const max = field.type === 'dots-10' ? 10 : 5;
        // Batch AM — V5 Hunger renders as red blood drops instead of the
        // generic round dots. We keep the existing red color override but
        // switch the slot silhouette to a drop so Hunger reads
        // distinctively at a glance.
        const isHunger = field.special === 'hunger';
        const colorClass = isHunger ? 'text-red-500 border-red-500 [&>div.bg-primary]:bg-red-500 [&>div.border-primary]:border-red-500' : '';
        const numericValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
        return (
          <div key={field.id} className="flex items-center justify-between gap-4 py-1 border-b border-zinc-800/50">
            <label className="text-sm text-foreground font-serif">{label}</label>
            <DotRating
              value={numericValue}
              max={max}
              min={field.min || 0}
              onChange={v => handleUpdate(field.id, v, field)}
              readonly={isFieldReadOnly(field)}
              className={colorClass}
              shape={isHunger ? 'drop' : 'dot'}
              ariaLabel={isHunger ? label : undefined}
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
        } else if (!isV5 && field.special === 'health') {
          // Classic / WoD box-based health track (bashing / lethal / aggravated).
          const h = (typeof value === 'object' && value !== null)
            ? value as { bashing?: number; lethal?: number; aggravated?: number; max?: number }
            : { bashing: typeof value === 'number' ? value : 0, lethal: 0, aggravated: 0, max: 7 };
          const safe = {
            bashing: h.bashing || 0,
            lethal: h.lethal || 0,
            aggravated: h.aggravated || 0,
            max: h.max || 7,
          };

          return (
            <div key={field.id} className="flex flex-col gap-2 py-2">
              <label className="text-sm text-foreground font-serif">{label}</label>
              <ClassicHealthTracker
                bashing={safe.bashing}
                lethal={safe.lethal}
                aggravated={safe.aggravated}
                max={safe.max}
                onChange={v => handleUpdate(field.id, { ...safe, ...v }, field)}
                readonly={isFieldReadOnly(field)}
                labels={{
                  bashing: strings.dmg_bashing,
                  lethal: strings.dmg_lethal,
                  aggravated: strings.dmg_aggravated,
                }}
              />
            </div>
          );
        } else {
          // Batch AN — classic Blood Pool / Willpower pool tracker.
          //
          // Both store as `{ current, max }`. We read the stored shape,
          // hand it to `ClassicPoolTracker`, and write back the same
          // shape on every change — so existing saved characters and the
          // classic schema are unaffected. The legacy number-input
          // fallback (when value is a bare number, not an object) is
          // preserved by promoting the bare number to a current value
          // and reading max from the classic defaults below.
          const isObject = typeof value === 'object' && value !== null;
          const currentValue = isObject ? (value.current ?? 0) : (typeof value === 'number' ? value : 0);
          const classicMax = isObject ? (value.max || 10) : (field.special === 'bloodPool' ? 20 : 7);
          const poolKind = field.special === 'bloodPool' ? 'blood' : 'willpower';

          return (
            <div key={field.id} className="flex flex-col gap-2 py-2">
              <label className="text-sm text-foreground font-serif">{label}</label>
              <ClassicPoolTracker
                current={currentValue}
                max={classicMax}
                kind={poolKind}
                label={label}
                readonly={isFieldReadOnly(field)}
                onChange={next => {
                  // Preserve the stored shape: if storage was already
                  // `{ current, max }` keep the rest of that object
                  // intact; otherwise upgrade a bare number to the
                  // canonical pair so we don't keep mixing shapes.
                  if (isObject) {
                    handleUpdate(field.id, { ...value, current: next }, field);
                  } else {
                    handleUpdate(field.id, { current: next, max: classicMax }, field);
                  }
                }}
              />
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
      case 'journal':
        return (
          <JournalList key={field.id} value={value} label={label} fieldId={field.id} isReadOnly={readonly} handleUpdate={handleUpdate} strings={strings} />
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
    /* Vertical rhythm is deliberately generous on desktop / portrait phones
       (space-y-10 between sections, p-6/p-8 inside each one). On phone
       landscape that turns into ~80% of the viewport being whitespace, so
       short-landscape clamps the sheet's vertical density without touching
       the font sizes or the per-field rows. */
    <div className="space-y-10 short-landscape:space-y-3 pb-12 short-landscape:pb-4">
      {sections.length > 1 && (
        <div className="flex justify-end -mb-4 short-landscape:-mb-2">
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
        // Batch BE-1 polish — the mortal "Track morality" toggle now lives
        // in its own small card directly after Basic Info, so it reads as
        // controlling an optional morality tracker rather than the whole
        // sheet. The card holds the toggle on its own when off, and the
        // toggle + Humanity / Path field when on. Vampires never enter
        // this branch.
        const renderedSection = (
          <section key={sectionId} className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 md:p-8 short-landscape:p-3">
            <button
              type="button"
              onClick={() => toggleSection(sectionId)}
              aria-expanded={!isCollapsed}
              aria-controls={bodyId}
              className="w-full flex items-center justify-between gap-3 uppercase tracking-widest border-b border-zinc-800 pb-3 short-landscape:pb-2 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
            >
              <h2 className="font-serif text-xl short-landscape:text-base text-primary">
                {sectionLabel}
              </h2>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform shrink-0 ${isCollapsed ? "-rotate-90" : ""}`}
                aria-hidden="true"
              />
            </button>
            <div
              id={bodyId}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 short-landscape:gap-x-4 gap-y-5 short-landscape:gap-y-2 ${isCollapsed ? "hidden" : "mt-6 short-landscape:mt-3"}`}
            >
              {(Array.isArray(section.fields) ? section.fields : []).map(field => renderField(field))}
            </div>
          </section>
        );

        if (section.id === 'basic_info' && isMortalKind) {
          return (
            <React.Fragment key={sectionId}>
              {renderedSection}
              <section
                data-testid="sheet-morality-section"
                aria-label={strings.sheet_track_morality || "Track morality"}
                className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 md:p-8 short-landscape:p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="sheet-track-morality"
                    className="text-sm text-foreground font-serif"
                  >
                    {strings.sheet_track_morality || "Track morality"}
                  </label>
                  <Switch
                    id="sheet-track-morality"
                    checked={trackMoralityEnabled}
                    onCheckedChange={toggleTrackMorality}
                    disabled={readonly}
                    aria-label={strings.sheet_track_morality || "Track morality"}
                    data-testid="sheet-track-morality-toggle"
                  />
                </div>
                {trackMoralityEnabled && (
                  <div
                    data-testid="sheet-morality-tracker"
                    className="mt-6 short-landscape:mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 short-landscape:gap-x-4 gap-y-5 short-landscape:gap-y-2"
                  >
                    {renderField({ id: 'humanity', labelKey: moralityLabelKey, type: 'dots-10' })}
                  </div>
                )}
              </section>
              {/* Batch BG — Vitae card sits alongside the Morality card
                  for classic-edition Ghouls. The two flags are
                  independent: a ghoul can opt into either, both, or
                  neither. The card is absent for Humans, Vampires, and
                  V5 ghouls. */}
              {isGhoulClassic && (
                <section
                  data-testid="sheet-vitae-section"
                  aria-label={strings.sheet_track_vitae || "Track vitae"}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 md:p-8 short-landscape:p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="sheet-track-vitae"
                      className="text-sm text-foreground font-serif"
                    >
                      {strings.sheet_track_vitae || "Track vitae"}
                    </label>
                    <Switch
                      id="sheet-track-vitae"
                      checked={trackVitaeEnabled}
                      onCheckedChange={toggleTrackVitae}
                      disabled={readonly}
                      aria-label={strings.sheet_track_vitae || "Track vitae"}
                      data-testid="sheet-track-vitae-toggle"
                    />
                  </div>
                  {trackVitaeEnabled && (
                    <div
                      data-testid="sheet-vitae-tracker"
                      className="mt-6 short-landscape:mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 short-landscape:gap-x-4 gap-y-5 short-landscape:gap-y-2"
                    >
                      {renderField({
                        id: 'bloodPool',
                        labelKey: 'sheet_vitae',
                        type: 'special-health',
                        special: 'bloodPool',
                        gameplay: true,
                      })}
                    </div>
                  )}
                </section>
              )}
              {/* Batch BI-1 — Powers card sits after the Vitae card for
                  classic-edition Ghouls. Uses the same DisciplineList UI
                  vampires use, but in `mode="ghoul"` so the "Add all
                  suggested" bulk action is hidden — ghouls pick powers
                  deliberately. The card is absent for Humans, Vampires,
                  and V5 ghouls. Section label is "Powers" / "Poderes",
                  NOT "Disciplines" — keeps the printed/visible header
                  distinct from the vampire surface. */}
              {isGhoulClassic && (
                <section
                  data-testid="sheet-ghoul-powers-section"
                  aria-label={strings.sheet_track_ghoul_powers || "Track powers"}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-6 md:p-8 short-landscape:p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="sheet-track-ghoul-powers"
                      className="text-sm text-foreground font-serif"
                    >
                      {strings.sheet_track_ghoul_powers || "Track powers"}
                    </label>
                    <Switch
                      id="sheet-track-ghoul-powers"
                      checked={trackGhoulPowersEnabled}
                      onCheckedChange={toggleTrackGhoulPowers}
                      disabled={readonly}
                      aria-label={strings.sheet_track_ghoul_powers || "Track powers"}
                      data-testid="sheet-track-ghoul-powers-toggle"
                    />
                  </div>
                  {trackGhoulPowersEnabled && (
                    <div
                      data-testid="sheet-ghoul-powers-list"
                      className="mt-6 short-landscape:mt-3"
                    >
                      <DisciplineList
                        value={(character as { disciplines?: unknown }).disciplines}
                        label={strings.sheet_section_ghoul_powers || "Powers"}
                        fieldId="disciplines"
                        isReadOnly={readonly}
                        handleUpdate={handleUpdate}
                        strings={strings}
                        character={character}
                        mode="ghoul"
                      />
                    </div>
                  )}
                </section>
              )}
            </React.Fragment>
          );
        }

        return renderedSection;
      })}
    </div>
  );
}
