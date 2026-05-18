import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Character, EditionId, V5Character, ClassicCharacter } from "@/types";
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

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-zinc-300 py-0.5 text-[12px]">
      <span className="font-medium">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] border-b border-black mb-1.5 mt-4">
      {children}
    </h2>
  );
}

function TraitList({ entries, max }: { entries: [string, unknown][]; max: number }) {
  if (entries.length === 0) {
    return <p className="text-[11px] italic text-zinc-500 py-1">—</p>;
  }
  const sorted = [...entries].sort(([a], [b]) => humanize(a).localeCompare(humanize(b)));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
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

  return (
    <article className="text-black font-serif leading-tight">
      {/* Header */}
      <header className="border-b-2 border-black pb-2 mb-2">
        <h1 className="text-2xl font-bold tracking-tight">{character.name}</h1>
        <p className="text-sm">
          {clanName} · <span className="uppercase">{character.edition}</span> ·{" "}
          <span className="uppercase tracking-wider">
            {character.characterType === 'npc'
              ? (strings.char_type_short_npc || "NPC")
              : (strings.char_type_short_pc || "PC")}
          </span>
        </p>
      </header>

      {/* Identity */}
      <section className="break-inside-avoid">
        <SectionHeading>{strings.sheet_section_basic || "Identity"}</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {character.concept && <FieldRow label={strings.sheet_concept || "Concept"} value={character.concept} />}
          {character.chronicle && <FieldRow label={strings.sheet_chronicle || "Chronicle"} value={character.chronicle} />}
          {character.sire && <FieldRow label={strings.sheet_sire || "Sire"} value={character.sire} />}
          {character.playerName && <FieldRow label={strings.sheet_player || "Player"} value={character.playerName} />}
          {isV5 && v5?.ambition && <FieldRow label={strings.sheet_ambition || "Ambition"} value={v5.ambition} />}
          {isV5 && v5?.desire && <FieldRow label={strings.sheet_desire || "Desire"} value={v5.desire} />}
          {isV5 && v5?.predatorType && <FieldRow label={strings.sheet_predator_type || "Predator Type"} value={v5.predatorType} />}
          {!isV5 && cl?.nature && <FieldRow label={strings.sheet_nature || "Nature"} value={cl.nature} />}
          {!isV5 && cl?.demeanor && <FieldRow label={strings.sheet_demeanor || "Demeanor"} value={cl.demeanor} />}
          {!isV5 && typeof cl?.generation === "number" && (
            <FieldRow label={strings.sheet_generation || "Generation"} value={String(cl.generation)} />
          )}
        </div>
      </section>

      {/* Attributes */}
      <section className="break-inside-avoid">
        <SectionHeading>{strings.sheet_section_attributes || "Attributes"}</SectionHeading>
        <TraitList entries={attributeEntries} max={5} />
      </section>

      {/* Skills / Abilities */}
      <section className="break-inside-avoid">
        <SectionHeading>
          {isV5
            ? (strings.sheet_section_skills || "Skills")
            : (strings.sheet_section_abilities || "Abilities")}
        </SectionHeading>
        <TraitList entries={skillEntries} max={5} />
      </section>

      {/* Disciplines (with powers) */}
      <section className="break-inside-avoid">
        <SectionHeading>{strings.sheet_section_disciplines || "Disciplines"}</SectionHeading>
        {disciplineEntries.length === 0 ? (
          <p className="text-[11px] italic text-zinc-500 py-1">—</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {disciplineEntries.map(([id, raw]) => {
              const { rating, powers } = readDisciplineEntry(raw);
              return (
                <div key={id} className="border-b border-zinc-300 py-1 break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-2 text-[12px]">
                    <span className="font-medium">{getDisciplineDisplayName(id)}</span>
                    <span className="font-mono">{dotsString(rating, 5)}</span>
                  </div>
                  {powers.length > 0 && (
                    <ul className="text-[11px] mt-0.5 ml-3 list-disc list-outside">
                      {powers.map((p, i) => (
                        <li key={`${p}-${i}`}>{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Backgrounds (classic only) */}
      {!isV5 && (
        <section className="break-inside-avoid">
          <SectionHeading>{strings.sheet_section_backgrounds || "Backgrounds"}</SectionHeading>
          <TraitList entries={backgroundEntries} max={5} />
        </section>
      )}

      {/* Virtues (classic only) */}
      {!isV5 && cl?.virtues && (
        <section className="break-inside-avoid">
          <SectionHeading>{strings.sheet_section_advantages || "Virtues"}</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <FieldRow label={strings.virtue_conscience || "Conscience"} value={<span className="font-mono">{dotsString(cl.virtues.conscience || 0, 5)}</span>} />
            <FieldRow label={strings.virtue_self_control || "Self-Control"} value={<span className="font-mono">{dotsString(cl.virtues.selfControl || 0, 5)}</span>} />
            <FieldRow label={strings.virtue_courage || "Courage"} value={<span className="font-mono">{dotsString(cl.virtues.courage || 0, 5)}</span>} />
          </div>
        </section>
      )}

      {/* Trackers */}
      <section className="break-inside-avoid">
        <SectionHeading>{strings.sheet_section_trackers || "Trackers"}</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {/* Health */}
          {isV5 && v5?.health && (
            <FieldRow
              label={strings.sheet_health || "Health"}
              value={`${v5.health.damage || 0} sup · ${v5.health.aggravated || 0} agg / ${v5.health.max || 5}`}
            />
          )}
          {!isV5 && (
            <FieldRow
              label={strings.sheet_health || "Health"}
              value={typeof cl?.health === "number" ? `${cl.health} dmg` : "—"}
            />
          )}
          {/* Willpower */}
          {isV5 && v5?.willpower && (
            <FieldRow
              label={strings.sheet_willpower || "Willpower"}
              value={`${v5.willpower.damage || 0} sup · ${v5.willpower.aggravated || 0} agg / ${v5.willpower.max || 5}`}
            />
          )}
          {!isV5 && cl?.willpower && (
            <FieldRow
              label={strings.sheet_willpower || "Willpower"}
              value={`${cl.willpower.current ?? 0} / ${cl.willpower.max ?? 5}`}
            />
          )}
          {/* Hunger (V5) / Blood Pool (classic) */}
          {isV5 && (
            <FieldRow
              label={strings.sheet_hunger || "Hunger"}
              value={<span className="font-mono">{dotsString(v5?.hunger || 0, 5)}</span>}
            />
          )}
          {!isV5 && cl?.bloodPool && (
            <FieldRow
              label={strings.sheet_blood_pool || "Blood Pool"}
              value={`${cl.bloodPool.current ?? 0} / ${cl.bloodPool.max ?? 10}`}
            />
          )}
          {/* Humanity / Path */}
          <FieldRow
            label={strings.sheet_humanity || "Humanity"}
            value={<span className="font-mono">{dotsString((character as any).humanity || 0, 10)}</span>}
          />
          {isV5 && typeof v5?.bloodPotency === "number" && (
            <FieldRow
              label={strings.sheet_blood_potency || "Blood Potency"}
              value={<span className="font-mono">{dotsString(v5.bloodPotency, 10)}</span>}
            />
          )}
          {typeof character.experience === "number" && (
            <FieldRow
              label={strings.sheet_experience || "Experience"}
              value={String(character.experience)}
            />
          )}
        </div>
      </section>

      {/* Notes */}
      {character.notes && (
        <section className="break-inside-avoid mt-2">
          <SectionHeading>{strings.sheet_notes || "Notes"}</SectionHeading>
          <p className="whitespace-pre-wrap text-[11px]">{character.notes}</p>
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

  return (
    <AnimatePresence>
      <motion.div
        key="print-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Print character sheet"
      >
        {/* Print-specific CSS:
            - Hide everything except the print area when printing
            - Reset background to white, text to black
            - Tidy paper margins via @page */}
        <style>{`
          @media print {
            @page { margin: 1.2cm; }
            body * { visibility: hidden !important; }
            .vtm-print-area, .vtm-print-area * { visibility: visible !important; }
            .vtm-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: none !important;
            }
            .vtm-print-hide { display: none !important; }
          }
        `}</style>

        <div
          className="vtm-print-area max-w-3xl mx-auto my-6 bg-white text-black p-6 shadow-2xl rounded"
          onClick={e => e.stopPropagation()}
        >
          {/* Toolbar — hidden during print */}
          <div className="vtm-print-hide flex items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-300">
            <span className="text-xs uppercase tracking-widest text-zinc-500">Print preview</span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={printNow}
                className="gap-1.5 bg-black text-white hover:bg-zinc-800"
              >
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClose}
                aria-label="Close print preview"
                className="gap-1 text-zinc-700 border-zinc-400 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" /> Close
              </Button>
            </div>
          </div>

          <CharacterPrintLayout character={character} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
