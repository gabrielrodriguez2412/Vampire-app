import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Character, EditionId, V5Character, ClassicCharacter, InventoryItem, CharacterNote, CharacterNoteCategory } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getClanDisplayNameById } from "@/utils/content";
import { getDisciplineDisplayName } from "@/utils/disciplineDisplay";
import { readDisciplineEntry } from "./DynamicSheet";

/**
 * Render `rating` filled dots followed by `max - rating` empty dots,
 * joined by spaces. `rating` is clamped into `[0, max]` so out-of-range
 * data never breaks the layout.
 */
export function dotsString(rating: number, max: number): string {
  const safe = Math.max(0, Math.min(max, Math.floor(rating)));
  const filled = "●".repeat(safe);
  const empty = "○".repeat(Math.max(0, max - safe));
  return (filled + empty).split("").join(" ");
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, c => c.toUpperCase());
}

function getInventoryCategoryPrintLabel(
  category: string | undefined,
  strings: Record<string, string>
): string | null {
  if (!category) return null;
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
    default: return category;
  }
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-2 py-px">
      <span className="font-medium">{label}</span>
      <span className="text-right truncate ml-2">{value}</span>
    </div>
  );
}

/**
 * A labelled free-text block for print (Batch W). Used by the V5
 * Social & Moral section (Touchstones / Convictions / Advantages /
 * Flaws) and the classic Merits & Flaws section — all of which are
 * multi-line textarea fields on the normal sheet. Each block is an
 * atomic print unit so a label never strands itself at the bottom of
 * a page away from its body.
 */
function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="vtm-print-atom py-px">
      <span className="font-medium">{label}</span>
      <p className="whitespace-pre-wrap text-zinc-800 leading-snug">{value}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  // Subtle VTM-themed accent: dark crimson, thin bottom border, small caps.
  return (
    <h2
      className="mt-2 mb-1 pb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] border-b border-zinc-500"
      style={{ color: '#5a1217' }}
    >
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Batch AO — printable Health capacity boxes.
//
// The print sheet used to collapse Health into a one-line text summary
// (e.g. "2 bash · 2 leth · 1 agg / 7"). That was reading-only — no sense
// of the full track length, no visible empty boxes, no way to tell at a
// glance which boxes were damaged. We now render the full track as a
// row of small bordered boxes, marked with the same symbols the live
// trackers (`DamageTracker`, `ClassicHealthTracker`) already use:
//
//     V5      → `/` superficial · `X` aggravated
//     classic → `/` bashing · `X` lethal · `✱` aggravated
//
// Boxes are filled most-severe-first, just like the live trackers.
// Marks rely on distinct symbols, NOT colour — so a black-and-white
// print is still legible. The short text summary stays next to the
// boxes so the exact numeric breakdown remains accessible.
// ---------------------------------------------------------------------------

export type PrintHealthMarkKind =
  | 'empty'
  | 'aggravated'
  | 'lethal'
  | 'bashing'
  | 'superficial';

export interface PrintHealthBox {
  /** Visible glyph: '' for empty, '/' or 'X' or '✱'. */
  symbol: string;
  kind: PrintHealthMarkKind;
}

/**
 * Build the V5 box sequence. V5 tracks two damage types:
 *   * superficial (`damage` field) → `/`
 *   * aggravated                   → `X`
 * Boxes are filled most-severe-first, then padded with empties up to
 * `max`. Defensive against missing / corrupted fields.
 */
export function buildV5HealthBoxes(h: {
  damage?: number;
  aggravated?: number;
  max?: number;
}): PrintHealthBox[] {
  const max = Math.max(0, Math.floor(h.max ?? 5));
  const agg = Math.max(0, Math.floor(h.aggravated ?? 0));
  const sup = Math.max(0, Math.floor(h.damage ?? 0));
  const boxes: PrintHealthBox[] = [];
  for (let i = 0; i < max; i++) {
    if (i < agg) boxes.push({ symbol: 'X', kind: 'aggravated' });
    else if (i < agg + sup) boxes.push({ symbol: '/', kind: 'superficial' });
    else boxes.push({ symbol: '', kind: 'empty' });
  }
  return boxes;
}

/**
 * Build the classic / WoD box sequence. Three damage types:
 *   * bashing    → `/`
 *   * lethal     → `X`
 *   * aggravated → `✱`
 * Severity order matches the live `ClassicHealthTracker` (aggravated
 * first, then lethal, then bashing) so the print preview always reads
 * the same shape as what the player sees on screen.
 */
export function buildClassicHealthBoxes(h: {
  bashing?: number;
  lethal?: number;
  aggravated?: number;
  max?: number;
}): PrintHealthBox[] {
  const max = Math.max(0, Math.floor(h.max ?? 7));
  const agg = Math.max(0, Math.floor(h.aggravated ?? 0));
  const leth = Math.max(0, Math.floor(h.lethal ?? 0));
  const bash = Math.max(0, Math.floor(h.bashing ?? 0));
  const boxes: PrintHealthBox[] = [];
  for (let i = 0; i < max; i++) {
    if (i < agg) boxes.push({ symbol: '✱', kind: 'aggravated' });
    else if (i < agg + leth) boxes.push({ symbol: 'X', kind: 'lethal' });
    else if (i < agg + leth + bash) boxes.push({ symbol: '/', kind: 'bashing' });
    else boxes.push({ symbol: '', kind: 'empty' });
  }
  return boxes;
}

function PrintHealthBoxes({ boxes, label }: { boxes: PrintHealthBox[]; label: string }) {
  const damaged = boxes.filter(b => b.kind !== 'empty').length;
  return (
    <span
      role="group"
      aria-label={`${label} ${damaged} of ${boxes.length}`}
      data-testid="print-health-boxes"
      className="inline-flex flex-wrap items-center gap-0.5 align-middle"
    >
      {boxes.map((box, i) => (
        <span
          key={i}
          data-testid={`print-health-box-${i}`}
          data-mark={box.kind}
          aria-label={
            box.kind === 'empty'
              ? `${label} ${i + 1}`
              : `${label} ${i + 1} ${box.kind}`
          }
          // Solid 1px black border + white background keeps every box
          // clearly visible on greyscale prints. Mark glyph is rendered
          // as text so the symbol scales with the page font and never
          // depends on web-only icon fonts.
          className="inline-flex items-center justify-center w-3 h-3 border border-black text-[8px] font-bold leading-none text-black bg-white"
        >
          {box.symbol}
        </span>
      ))}
    </span>
  );
}

function TraitGrid({ entries, max }: { entries: [string, unknown][]; max: number }) {
  const sorted = [...entries].sort(([a], [b]) => humanize(a).localeCompare(humanize(b)));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0">
      {sorted.map(([key, raw]) => {
        const rating = typeof raw === "number" ? raw : parseInt(String(raw), 10) || 0;
        return (
          <FieldRow
            key={key}
            label={humanize(key)}
            value={<span className="font-mono">{dotsString(rating, max)}</span>}
          />
        );
      })}
    </div>
  );
}

interface CharacterPrintLayoutProps {
  character: Character;
}

function CharacterPrintLayout({ character }: CharacterPrintLayoutProps) {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS["en"];
  const isV5 = character.edition === "V5";

  const clanName = getClanDisplayNameById(
    character.clan,
    character.edition as EditionId,
    activeLanguage
  );

  const v5 = isV5 ? (character as V5Character) : null;
  const cl = !isV5 ? (character as ClassicCharacter) : null;

  const attributeEntries = Object.entries(character.attributes || {});
  const skillEntries = isV5
    ? Object.entries(v5?.skills || {})
    : Object.entries(cl?.abilities || {});
  const disciplineEntries = Object.entries(character.disciplines || {});
  const backgroundEntries = !isV5 ? Object.entries(cl?.backgrounds || {}) : [];
  const inventoryItems: InventoryItem[] = Array.isArray(character.inventory)
    ? (character.inventory as InventoryItem[])
    : [];

  // Identity rows. Only entries that actually exist on the character.
  type Row = { label: string; value: React.ReactNode };
  const identityRows: Row[] = [];
  if (character.concept) identityRows.push({ label: strings.sheet_concept || "Concept", value: character.concept });
  if (character.chronicle) identityRows.push({ label: strings.sheet_chronicle || "Chronicle", value: character.chronicle });
  if (character.sire) identityRows.push({ label: strings.sheet_sire || "Sire", value: character.sire });
  if (character.playerName) identityRows.push({ label: strings.sheet_player || "Player", value: character.playerName });
  if (isV5 && v5?.ambition) identityRows.push({ label: strings.sheet_ambition || "Ambition", value: v5.ambition });
  if (isV5 && v5?.desire) identityRows.push({ label: strings.sheet_desire || "Desire", value: v5.desire });
  if (isV5 && v5?.predatorType) identityRows.push({ label: strings.sheet_predator_type || "Predator Type", value: v5.predatorType });
  // Batch W: resonance is a short V5-specific Vampire Trait that was
  // missing from print. Rendered as an identity row (single short value).
  if (isV5 && v5?.resonance) identityRows.push({ label: strings.sheet_resonance || "Resonance", value: v5.resonance });
  if (!isV5 && cl?.nature) identityRows.push({ label: strings.sheet_nature || "Nature", value: cl.nature });
  if (!isV5 && cl?.demeanor) identityRows.push({ label: strings.sheet_demeanor || "Demeanor", value: cl.demeanor });
  if (!isV5 && typeof cl?.generation === "number") identityRows.push({ label: strings.sheet_generation || "Generation", value: String(cl.generation) });

  // Tracker rows — these are always meaningful (created with defaults).
  const trackerRows: Row[] = [];
  const healthLabel = strings.sheet_health || "Health";
  if (isV5 && v5?.health) {
    // Batch AO — render Health as capacity boxes (most-severe-first marks)
    // alongside the existing one-line abbreviated summary so the exact
    // numeric breakdown stays visible next to the boxes.
    const boxes = buildV5HealthBoxes(v5.health);
    const summary = `${v5.health.damage || 0} sup · ${v5.health.aggravated || 0} agg / ${v5.health.max || 5}`;
    trackerRows.push({
      label: healthLabel,
      value: (
        <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
          <PrintHealthBoxes boxes={boxes} label={healthLabel} />
          <span className="text-[8px] text-zinc-700 whitespace-nowrap" data-testid="print-health-summary">
            {summary}
          </span>
        </span>
      ),
    });
  } else if (!isV5) {
    // Classic health may be the new structured track or (legacy) a plain number.
    const ch: unknown = cl?.health;
    if (ch && typeof ch === "object") {
      const h = ch as { bashing?: number; lethal?: number; aggravated?: number; max?: number };
      const boxes = buildClassicHealthBoxes(h);
      const bashAbbr = strings.dmg_bashing_abbr || "bash";
      const lethAbbr = strings.dmg_lethal_abbr || "leth";
      const aggAbbr = strings.dmg_aggravated_abbr || "agg";
      const summary = `${h.bashing || 0} ${bashAbbr} · ${h.lethal || 0} ${lethAbbr} · ${h.aggravated || 0} ${aggAbbr} / ${h.max || 7}`;
      trackerRows.push({
        label: healthLabel,
        value: (
          <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
            <PrintHealthBoxes boxes={boxes} label={healthLabel} />
            <span className="text-[8px] text-zinc-700 whitespace-nowrap" data-testid="print-health-summary">
              {summary}
            </span>
          </span>
        ),
      });
    } else if (typeof ch === "number") {
      // Legacy bare-number save — we don't know which damage type is
      // recorded, so we don't invent a mark sequence. Fall back to the
      // text summary only.
      trackerRows.push({ label: healthLabel, value: `${ch} dmg` });
    } else {
      trackerRows.push({ label: healthLabel, value: "—" });
    }
  }
  if (isV5 && v5?.willpower) {
    trackerRows.push({
      label: strings.sheet_willpower || "Willpower",
      value: `${v5.willpower.damage || 0} sup · ${v5.willpower.aggravated || 0} agg / ${v5.willpower.max || 5}`,
    });
  } else if (!isV5 && cl?.willpower) {
    trackerRows.push({
      label: strings.sheet_willpower || "Willpower",
      value: `${cl.willpower.current ?? 0} / ${cl.willpower.max ?? 5}`,
    });
  }
  if (isV5) {
    trackerRows.push({
      label: strings.sheet_hunger || "Hunger",
      value: <span className="font-mono">{dotsString(v5?.hunger || 0, 5)}</span>,
    });
  } else if (cl?.bloodPool) {
    trackerRows.push({
      label: strings.sheet_blood_pool || "Blood Pool",
      value: `${cl.bloodPool.current ?? 0} / ${cl.bloodPool.max ?? 10}`,
    });
  }
  trackerRows.push({
    label: strings.sheet_humanity || "Humanity",
    value: <span className="font-mono">{dotsString((character as any).humanity || 0, 10)}</span>,
  });
  if (isV5 && typeof v5?.bloodPotency === "number") {
    trackerRows.push({
      label: strings.sheet_blood_potency || "Blood Potency",
      value: <span className="font-mono">{dotsString(v5.bloodPotency, 10)}</span>,
    });
  }
  if (typeof character.experience === "number" && character.experience !== 0) {
    trackerRows.push({
      label: strings.sheet_experience || "Experience",
      value: String(character.experience),
    });
  }

  const hasIdentity = identityRows.length > 0;
  const hasBackgrounds = backgroundEntries.length > 0;
  const hasVirtues = !isV5 && !!cl?.virtues;

  // Batch W: free-text "Social & Moral" (V5) and "Merits & Flaws"
  // (classic) blocks were modelled on the normal sheet but never
  // rendered in print. Collect only the populated ones so empty
  // sections stay hidden (matching the rest of the print design).
  const nonEmpty = (v: string | undefined): v is string => !!v && v.trim() !== '';
  type TextRow = { label: string; value: string };
  const socialMoralRows: TextRow[] = [];
  if (isV5) {
    if (nonEmpty(v5?.touchstones)) socialMoralRows.push({ label: strings.sheet_touchstones || "Touchstones", value: v5!.touchstones! });
    if (nonEmpty(v5?.convictions)) socialMoralRows.push({ label: strings.sheet_convictions || "Convictions", value: v5!.convictions! });
    if (nonEmpty(v5?.advantages))  socialMoralRows.push({ label: strings.sheet_advantages || "Advantages", value: v5!.advantages! });
    if (nonEmpty(v5?.flaws))       socialMoralRows.push({ label: strings.sheet_flaws || "Flaws", value: v5!.flaws! });
  }
  const meritsFlawsRows: TextRow[] = [];
  if (!isV5) {
    if (nonEmpty(cl?.merits)) meritsFlawsRows.push({ label: strings.sheet_merits || "Merits", value: cl!.merits! });
    if (nonEmpty(cl?.flaws))  meritsFlawsRows.push({ label: strings.sheet_flaws || "Flaws", value: cl!.flaws! });
  }

  return (
    <article className="text-black font-serif leading-snug text-[10px]">
      {/* Header — compact, two short lines. */}
      <header className="mb-2 pb-1 border-b border-zinc-700">
        <h1 className="text-xl font-bold tracking-tight leading-tight" style={{ color: '#5a1217' }}>
          {character.name}
        </h1>
        <p className="text-[11px] text-zinc-700">
          {clanName} · <span className="uppercase">{character.edition}</span> ·{" "}
          <span className="uppercase tracking-wider">
            {character.characterType === 'npc'
              ? (strings.char_type_short_npc || "NPC")
              : (strings.char_type_short_pc || "PC")}
          </span>
        </p>
      </header>

      {/* Row 1: Identity (wide) + Trackers. If Identity is empty, Trackers
          stretches to full width. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5">
        {hasIdentity && (
          <section className="sm:col-span-2">
            <SectionHeading>{strings.sheet_section_basic || "Identity"}</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
              {identityRows.map((r, i) => (
                <FieldRow key={i} label={r.label} value={r.value} />
              ))}
            </div>
          </section>
        )}
        <section className={hasIdentity ? "sm:col-span-1" : "sm:col-span-3"}>
          <SectionHeading>{strings.sheet_section_trackers || "Trackers"}</SectionHeading>
          <div className={`grid ${hasIdentity ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"} gap-x-4 gap-y-0`}>
            {trackerRows.map((r, i) => (
              <FieldRow key={i} label={r.label} value={r.value} />
            ))}
          </div>
        </section>
      </div>

      {/* Attributes — only when the user has filled at least one. */}
      {attributeEntries.length > 0 && (
        <section>
          <SectionHeading>{strings.sheet_section_attributes || "Attributes"}</SectionHeading>
          <TraitGrid entries={attributeEntries} max={5} />
        </section>
      )}

      {/* Skills (V5) / Abilities (Classic) — only when populated. */}
      {skillEntries.length > 0 && (
        <section>
          <SectionHeading>
            {isV5
              ? (strings.sheet_section_skills || "Skills")
              : (strings.sheet_section_abilities || "Abilities")}
          </SectionHeading>
          <TraitGrid entries={skillEntries} max={5} />
        </section>
      )}

      {/* Disciplines — only when populated. Each discipline row is the atomic
          break-inside unit so name and its powers stay together. */}
      {disciplineEntries.length > 0 && (
        <section>
          <SectionHeading>{strings.sheet_section_disciplines || "Disciplines"}</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
            {disciplineEntries.map(([id, raw]) => {
              const { rating, powers } = readDisciplineEntry(raw);
              return (
                <div key={id} className="vtm-print-atom py-px">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-medium">{getDisciplineDisplayName(id, activeLanguage)}</span>
                    <span className="font-mono">{dotsString(rating, 5)}</span>
                  </div>
                  {powers.length > 0 && (
                    <p className="italic text-zinc-700 text-[9px] leading-tight">
                      {powers.join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Backgrounds + Virtues (Classic). Either may be hidden independently. */}
      {!isV5 && (hasBackgrounds || hasVirtues) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5">
          {hasBackgrounds && (
            <section className={hasVirtues ? "sm:col-span-2" : "sm:col-span-3"}>
              <SectionHeading>{strings.sheet_section_backgrounds || "Backgrounds"}</SectionHeading>
              <TraitGrid entries={backgroundEntries} max={5} />
            </section>
          )}
          {hasVirtues && cl?.virtues && (
            <section className={hasBackgrounds ? "sm:col-span-1" : "sm:col-span-3"}>
              <SectionHeading>{strings.sheet_section_advantages || "Virtues"}</SectionHeading>
              <div className={`grid ${hasBackgrounds ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"} gap-x-4 gap-y-0`}>
                <FieldRow label={strings.virtue_conscience || "Conscience"} value={<span className="font-mono">{dotsString(cl.virtues.conscience || 0, 5)}</span>} />
                <FieldRow label={strings.virtue_self_control || "Self-Control"} value={<span className="font-mono">{dotsString(cl.virtues.selfControl || 0, 5)}</span>} />
                <FieldRow label={strings.virtue_courage || "Courage"} value={<span className="font-mono">{dotsString(cl.virtues.courage || 0, 5)}</span>} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* Social & Moral (V5) — Touchstones / Convictions / Advantages /
          Flaws. Free-text blocks; only the populated ones render. Added
          in Batch W (was previously missing from print entirely). */}
      {isV5 && socialMoralRows.length > 0 && (
        <section>
          <SectionHeading>{strings.sheet_section_social_moral || "Social & Moral"}</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
            {socialMoralRows.map(r => (
              <TextBlock key={r.label} label={r.label} value={r.value} />
            ))}
          </div>
        </section>
      )}

      {/* Merits & Flaws (Classic) — free-text blocks; only the populated
          ones render. Added in Batch W (was previously missing from
          print entirely). */}
      {!isV5 && meritsFlawsRows.length > 0 && (
        <section>
          <SectionHeading>{strings.sheet_section_merits_flaws || "Merits & Flaws"}</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
            {meritsFlawsRows.map(r => (
              <TextBlock key={r.label} label={r.label} value={r.value} />
            ))}
          </div>
        </section>
      )}

      {/* Inventory — only when populated. Each item is an atomic unit. */}
      {inventoryItems.length > 0 && (
        <section>
          <SectionHeading>{strings.sheet_section_inventory || "Inventory"}</SectionHeading>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
            {inventoryItems.map(item => {
              const category = getInventoryCategoryPrintLabel(item.category, strings);
              return (
                <li key={item.id} className="vtm-print-atom py-px">
                  <div className="flex items-baseline flex-wrap gap-1.5">
                    {category && (
                      <span className="text-[9px] uppercase tracking-wider text-zinc-600">[{category}]</span>
                    )}
                    <span className="font-medium">{item.name || "—"}</span>
                    {typeof item.quantity === 'number' && (
                      <span className="text-zinc-700">×{item.quantity}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="italic text-zinc-700 text-[9px] leading-tight ml-2 whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Notes — last; may overflow to a later page if long, that's expected. */}
      {character.notes && (
        <section>
          <SectionHeading>{strings.sheet_notes || "Notes"}</SectionHeading>
          <p className="whitespace-pre-wrap text-[10px] leading-snug">{character.notes}</p>
        </section>
      )}

      {/* Journal — compact; cap at PRINT_JOURNAL_LIMIT entries to keep the
          sheet from ballooning into many pages. If the player has more, a
          short "+N more" hint is shown so the omission is obvious. Bodies
          are truncated to PRINT_JOURNAL_BODY_CHARS chars per entry. */}
      {Array.isArray(character.characterNotes) && character.characterNotes.length > 0 && (
        <section>
          <SectionHeading>{strings.sheet_section_journal || "Journal"}</SectionHeading>
          <PrintJournal notes={character.characterNotes} strings={strings} />
        </section>
      )}
    </article>
  );
}

const PRINT_JOURNAL_LIMIT = 6;
const PRINT_JOURNAL_BODY_CHARS = 280;

function getJournalCategoryPrintLabel(
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

function PrintJournal({ notes, strings }: { notes: CharacterNote[]; strings: Record<string, string> }) {
  // Newest-first to match the on-screen ordering.
  const ordered = [...notes].sort((a, b) => {
    const ta = Date.parse(a.updatedAt || a.createdAt || '') || 0;
    const tb = Date.parse(b.updatedAt || b.createdAt || '') || 0;
    return tb - ta;
  });
  const shown = ordered.slice(0, PRINT_JOURNAL_LIMIT);
  const hiddenCount = ordered.length - shown.length;

  return (
    <div className="space-y-1.5">
      {shown.map(n => {
        const title = n.title.trim() || (strings.journal_untitled || "(untitled)");
        const bodyFull = n.body || '';
        const body = bodyFull.length > PRINT_JOURNAL_BODY_CHARS
          ? bodyFull.slice(0, PRINT_JOURNAL_BODY_CHARS).trimEnd() + '…'
          : bodyFull;
        return (
          <div key={n.id} className="text-[10px] leading-snug">
            <div className="flex items-baseline gap-1.5">
              <span className="uppercase tracking-widest text-[8px] border border-zinc-400 px-1 rounded">
                {getJournalCategoryPrintLabel(n.category, strings)}
              </span>
              <span className="font-semibold">{title}</span>
            </div>
            {body && (
              <p className="whitespace-pre-wrap text-zinc-700 ml-2">{body}</p>
            )}
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <p className="text-[9px] italic text-zinc-600">+{hiddenCount} more…</p>
      )}
    </div>
  );
}

interface CharacterPrintModalProps {
  character: Character;
  onClose: () => void;
}

export function CharacterPrintModal({ character, onClose }: CharacterPrintModalProps) {
  // Batch V: localize the on-screen print-preview toolbar chrome
  // ("Print preview" heading, Print + Close buttons, and their
  // aria-labels). These live in the `vtm-print-hide` bar that is
  // removed from the actual printed page, but they ARE visible in the
  // preview modal, so they must respect the selected language.
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS["en"];

  // Mount the modal in a portal attached directly to <body> so it lives
  // outside the app's React root container. The print CSS then uses
  // `body > *:not(.vtm-print-root) { display: none }` to remove the entire
  // app from the printed page layout — `visibility: hidden` is not enough
  // because hidden elements still occupy their normal box geometry and
  // Chrome paginates that ghost content into blank pages.
  const [container] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.className = 'vtm-print-root';
    return el;
  });

  useEffect(() => {
    if (!container) return;
    document.body.appendChild(container);
    return () => {
      if (container.parentNode === document.body) {
        document.body.removeChild(container);
      }
    };
  }, [container]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const printNow = () => {
    const oldTitle = document.title;
    document.title = `${character.name} - Character Sheet`;
    const restore = () => {
      document.title = oldTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  if (!container) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="print-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 pt-12 pb-8 sm:px-6 sm:pt-16 sm:pb-10"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={strings.print_preview || "Print preview"}
      >
        {/* Print-specific CSS:
            - body > *:not(.vtm-print-root) { display: none } actually removes
              the entire app from print layout. visibility: hidden would only
              hide it visually while keeping its box geometry, which Chrome
              would then paginate into blank pages (the 7-page bug).
            - Inside the portal, all modal chrome (backdrop, flex container,
              scroll wrapper, rounded card) is flattened back to static block
              layout with no backgrounds, so only the sheet content paginates.
            - Toolbar removed from print via .vtm-print-hide.
            - break-inside: avoid only on .vtm-print-atom (a single discipline
              row, a single inventory item) — never on whole sections, which
              caused the previous "push entire section to new page" cascade. */}
        <style>{`
          @media print {
            @page { margin: 0.5cm; }
            body > *:not(.vtm-print-root) {
              display: none !important;
            }
            .vtm-print-root,
            .vtm-print-root > * {
              display: block !important;
              position: static !important;
              inset: auto !important;
              background: transparent !important;
              backdrop-filter: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: auto !important;
              max-width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              transform: none !important;
              opacity: 1 !important;
            }
            .vtm-print-root * {
              overflow: visible !important;
              max-height: none !important;
            }
            .vtm-print-area {
              background: white !important;
              color: black !important;
              border: none !important;
              border-radius: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .vtm-print-hide {
              display: none !important;
            }
            .vtm-print-atom {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}</style>

        <div
          className="vtm-print-area w-full max-w-3xl bg-white text-black rounded-lg shadow-2xl flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-6.5rem)] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Toolbar — dark gothic bar pinned at the top of the modal, in a
              distinct visual layer from the white sheet below. Stays visible
              while the content area scrolls. Removed entirely during print
              via `vtm-print-hide` so these dark on-screen colors never reach
              the printed page. */}
          <div className="vtm-print-hide relative z-10 flex items-center justify-between gap-3 px-5 py-3.5 bg-zinc-900 text-zinc-100 border-b border-zinc-800 shrink-0">
            <span className="text-sm font-semibold uppercase tracking-wider">
              {strings.print_preview || "Print preview"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={printNow}
                className="gap-1.5 bg-red-800 text-white font-medium border border-red-700 hover:bg-red-700"
              >
                <Printer className="w-4 h-4" /> {strings.char_print || "Print"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClose}
                aria-label={strings.close || "Close"}
                className="gap-1 bg-zinc-800 text-zinc-100 border-zinc-600 font-medium hover:bg-zinc-700 hover:text-zinc-50"
              >
                <X className="w-4 h-4" /> {strings.close || "Close"}
              </Button>
            </div>
          </div>

          {/* Scrollable preview content. Print CSS resets overflow so this
              never clips the printed output. */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
            <CharacterPrintLayout character={character} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, container);
}
