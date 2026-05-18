import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Character, EditionId, V5Character, ClassicCharacter, InventoryItem } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getClanDisplayNameById } from "@/utils/content";
import { disciplines as disciplineData } from "@/data/disciplines";
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

function getDisciplineDisplayName(id: string): string {
  const d = disciplineData.find(x => x.id === id);
  return d?.name || id;
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
    case 'money': return strings.inventory_cat_money || "Money/Resource";
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
  if (!isV5 && cl?.nature) identityRows.push({ label: strings.sheet_nature || "Nature", value: cl.nature });
  if (!isV5 && cl?.demeanor) identityRows.push({ label: strings.sheet_demeanor || "Demeanor", value: cl.demeanor });
  if (!isV5 && typeof cl?.generation === "number") identityRows.push({ label: strings.sheet_generation || "Generation", value: String(cl.generation) });

  // Tracker rows — these are always meaningful (created with defaults).
  const trackerRows: Row[] = [];
  if (isV5 && v5?.health) {
    trackerRows.push({
      label: strings.sheet_health || "Health",
      value: `${v5.health.damage || 0} sup · ${v5.health.aggravated || 0} agg / ${v5.health.max || 5}`,
    });
  } else if (!isV5) {
    trackerRows.push({
      label: strings.sheet_health || "Health",
      value: typeof cl?.health === "number" ? `${cl.health} dmg` : "—",
    });
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
                    <span className="font-medium">{getDisciplineDisplayName(id)}</span>
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
    </article>
  );
}

interface CharacterPrintModalProps {
  character: Character;
  onClose: () => void;
}

export function CharacterPrintModal({ character, onClose }: CharacterPrintModalProps) {
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
        aria-label="Print character sheet"
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
              Print preview
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={printNow}
                className="gap-1.5 bg-red-800 text-white font-medium border border-red-700 hover:bg-red-700"
              >
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClose}
                aria-label="Close print preview"
                className="gap-1 bg-zinc-800 text-zinc-100 border-zinc-600 font-medium hover:bg-zinc-700 hover:text-zinc-50"
              >
                <X className="w-4 h-4" /> Close
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
