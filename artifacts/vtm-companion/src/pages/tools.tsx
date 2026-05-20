import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Dices, AlertTriangle, ShieldAlert, Swords, Sparkles, RotateCcw, X } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import {
  rollDice,
  evaluateV5Roll,
  rollClassicDice,
  evaluateClassicRoll,
  V5RollResult,
  ClassicRollResult,
  DieValue,
} from "@/utils/diceRoller";

export default function Tools() {
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const isV5 = activeEdition === 'V5';

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">
      <div className="mb-2 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
          <Swords className="w-7 h-7 sm:w-8 sm:h-8" />
          {strings.toolsTitle}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">{strings.tools}</p>
      </div>

      {/* Dice Roller — edition-aware. Hunger lives inside the V5 roller. */}
      <div className="max-w-xl mx-auto w-full">
        {isV5 ? <V5DiceRoller strings={strings} /> : <ClassicDiceRoller strings={strings} />}
      </div>

      <div className="max-w-xl mx-auto w-full mt-6">
         <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {strings.combatSummary}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p>{strings.combat_melee}</p>
            <p>{strings.combat_ranged}</p>
            <p>{strings.combat_superficial}</p>
            <p>{strings.combat_aggravated}</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// V5 dice roller
// ---------------------------------------------------------------------------

interface HungerStateStripProps {
  hunger: number;
  /** Maximum allowed hunger (typically min(5, dicePool)). */
  maxHunger: number;
  onChange: (level: number) => void;
  strings: Record<string, string>;
}

function HungerStateStrip({ hunger, maxHunger, onChange, strings }: HungerStateStripProps) {
  const stateKey = `hunger_state_${Math.min(5, Math.max(0, hunger))}`;
  const stateText = strings[stateKey] || '';

  const pipTone = (level: number, active: boolean, disabled: boolean) => {
    if (disabled) return "bg-background border-border/40 text-muted-foreground/20 cursor-not-allowed";
    if (!active) return "bg-background border-border text-muted-foreground/50 hover:border-border/80 hover:text-muted-foreground";
    if (level === 1) return "bg-emerald-400/20 border-emerald-400/50 text-emerald-200";
    if (level === 2) return "bg-yellow-400/20 border-yellow-400/50 text-yellow-200";
    if (level === 3) return "bg-orange-400/20 border-orange-400/50 text-orange-200";
    if (level === 4) return "bg-red-500/25 border-red-500/60 text-red-200";
    return "bg-red-600/30 border-red-600/70 text-red-100";
  };

  return (
    <div className="rounded-md border border-border bg-black/20 p-2.5 sm:p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Droplet className="w-4 h-4 text-red-500 shrink-0" aria-hidden />
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {strings.hungerTracker}
        </span>
        <div className="ml-auto flex gap-1" role="group" aria-label={strings.hungerTracker}>
          {[1, 2, 3, 4, 5].map(level => {
            const active = hunger >= level;
            const disabled = level > maxHunger;
            // Clicking the currently-selected single level toggles down to one less
            // for fine control; clicking 0 isn't directly reachable but − button covers it.
            const target = hunger === level ? level - 1 : level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => !disabled && onChange(Math.max(0, Math.min(maxHunger, target)))}
                disabled={disabled}
                aria-pressed={active}
                aria-label={`${strings.dice_hunger} ${level}`}
                className={`w-7 h-7 rounded-sm border text-xs font-bold flex items-center justify-center transition-colors ${pipTone(level, active, disabled)}`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>
      {stateText && (
        <p className="text-sm text-foreground/80 italic leading-snug">{stateText}</p>
      )}
    </div>
  );
}

interface V5DiceRollerProps {
  strings: Record<string, string>;
}

function V5DiceRoller({ strings }: V5DiceRollerProps) {
  const [dicePool, setDicePool] = useState(5);
  const [hungerDice, setHungerDice] = useState(1);
  const [reason, setReason] = useState("");
  const [rollResult, setRollResult] = useState<V5RollResult | null>(null);
  const [lastReason, setLastReason] = useState<string>("");

  const handleRoll = () => {
    if (dicePool <= 0) return;
    const roll = rollDice(dicePool, hungerDice);
    setRollResult(evaluateV5Roll(roll));
    setLastReason(reason.trim());
  };

  const handleClear = () => {
    setRollResult(null);
    setLastReason("");
  };

  const clampedHungerDice = Math.min(hungerDice, dicePool);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Dices className="w-5 h-5" />
          {strings.quickRoll}
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70">V5</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label={strings.dice_pool}
            value={dicePool}
            onChange={v => {
              const next = Math.max(0, Math.min(20, v));
              setDicePool(next);
              if (hungerDice > next) setHungerDice(next);
            }}
            min={0}
            max={20}
            accent="muted"
          />
          <NumberInput
            label={strings.dice_hunger}
            value={clampedHungerDice}
            onChange={v => setHungerDice(Math.max(0, Math.min(dicePool, Math.min(5, v))))}
            min={0}
            max={Math.min(5, dicePool)}
            accent="hunger"
          />
        </div>

        <HungerStateStrip
          hunger={clampedHungerDice}
          maxHunger={Math.min(5, dicePool)}
          onChange={level => setHungerDice(Math.max(0, Math.min(dicePool, Math.min(5, level))))}
          strings={strings}
        />

        <ReasonInput strings={strings} value={reason} onChange={setReason} />

        <RollButtons
          strings={strings}
          hasResult={!!rollResult}
          onRoll={handleRoll}
          onClear={handleClear}
          disabled={dicePool <= 0}
        />

        <AnimatePresence mode="popLayout">
          {rollResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="bg-black/20 p-3 sm:p-4 rounded-lg border border-white/5 space-y-3"
            >
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums">
                    {rollResult.successes}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {rollResult.successes === 0 ? strings.dice_no_successes : strings.dice_successes}
                  </span>
                </div>
                {rollResult.criticalPairs > 0 && !rollResult.messyCritical && (
                  <Badge tone="critical" icon={<Sparkles className="w-3 h-3" />}>
                    {strings.dice_critical}
                  </Badge>
                )}
              </div>

              {lastReason && (
                <div className="text-xs italic text-muted-foreground">"{lastReason}"</div>
              )}

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {rollResult.normal.map((v, i) => (
                  <DieFace key={`n-${i}`} value={v} kind="normal" label={strings.dice_normal_die} />
                ))}
                {rollResult.hunger.map((v, i) => (
                  <DieFace key={`h-${i}`} value={v} kind="hunger" label={strings.dice_hunger_die} />
                ))}
                {rollResult.poolSize === 0 && (
                  <span className="text-xs text-muted-foreground">{strings.dice_no_pool}</span>
                )}
              </div>

              {(rollResult.messyCritical || rollResult.bestialFailure) && (
                <OutcomeBanner
                  tone={rollResult.messyCritical ? "messy" : "bestial"}
                  title={rollResult.messyCritical ? strings.dice_messy_critical : strings.dice_bestial_failure}
                  hint={rollResult.messyCritical ? strings.dice_messy_critical_hint : strings.dice_bestial_failure_hint}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Classic (V20 / Revised / 2nd / 1st) dice roller
// ---------------------------------------------------------------------------

interface ClassicDiceRollerProps {
  strings: Record<string, string>;
}

function ClassicDiceRoller({ strings }: ClassicDiceRollerProps) {
  const [dicePool, setDicePool] = useState(5);
  const [difficulty, setDifficulty] = useState(6);
  const [reason, setReason] = useState("");
  const [rollResult, setRollResult] = useState<ClassicRollResult | null>(null);
  const [lastReason, setLastReason] = useState<string>("");

  const handleRoll = () => {
    if (dicePool <= 0) return;
    const dice = rollClassicDice(dicePool);
    setRollResult(evaluateClassicRoll(dice, difficulty));
    setLastReason(reason.trim());
  };

  const handleClear = () => {
    setRollResult(null);
    setLastReason("");
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Dices className="w-5 h-5" />
          {strings.quickRoll}
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Classic
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label={strings.dice_pool}
            value={dicePool}
            onChange={v => setDicePool(Math.max(0, Math.min(20, v)))}
            min={0}
            max={20}
            accent="muted"
          />
          <NumberInput
            label={strings.dice_classic_difficulty}
            value={difficulty}
            onChange={v => setDifficulty(Math.max(2, Math.min(10, v)))}
            min={2}
            max={10}
            accent="classic"
          />
        </div>

        <ReasonInput strings={strings} value={reason} onChange={setReason} />

        <RollButtons
          strings={strings}
          hasResult={!!rollResult}
          onRoll={handleRoll}
          onClear={handleClear}
          disabled={dicePool <= 0}
        />

        <AnimatePresence mode="popLayout">
          {rollResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="bg-black/20 p-3 sm:p-4 rounded-lg border border-white/5 space-y-3"
            >
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums">
                    {rollResult.netSuccesses}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {rollResult.netSuccesses === 0
                      ? (rollResult.botch ? strings.dice_classic_botch : strings.dice_classic_failure)
                      : strings.dice_classic_net_successes}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider">
                  <span className="px-2 py-1 rounded-full bg-background border border-border text-muted-foreground">
                    {strings.dice_classic_difficulty}: {rollResult.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-background border border-border text-muted-foreground">
                    {strings.dice_classic_raw_successes}: {rollResult.rawSuccesses}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-background border border-border text-muted-foreground">
                    {strings.dice_classic_ones}: {rollResult.ones}
                  </span>
                </div>
              </div>

              {lastReason && (
                <div className="text-xs italic text-muted-foreground">"{lastReason}"</div>
              )}

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {rollResult.dice.map((v, i) => (
                  <DieFace
                    key={`c-${i}`}
                    value={v}
                    kind="classic"
                    label={strings.dice_normal_die}
                    difficulty={rollResult.difficulty}
                  />
                ))}
                {rollResult.poolSize === 0 && (
                  <span className="text-xs text-muted-foreground">{strings.dice_no_pool}</span>
                )}
              </div>

              {rollResult.botch && (
                <OutcomeBanner
                  tone="bestial"
                  title={strings.dice_classic_botch}
                  hint={strings.dice_classic_botch_hint}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  accent: "muted" | "hunger" | "classic";
}

function NumberInput({ label, value, onChange, min, max, accent }: NumberInputProps) {
  const accentClasses =
    accent === "hunger"
      ? "border-red-900/60 bg-red-950/20"
      : accent === "classic"
        ? "border-amber-900/40 bg-amber-950/10"
        : "border-border bg-background";
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className={`flex items-stretch rounded-md border ${accentClasses}`}>
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className="px-3 py-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed border-r border-inherit"
          aria-label="-"
        >
          −
        </button>
        <span className="flex-1 text-center font-bold tabular-nums py-2">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="px-3 py-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed border-l border-inherit"
          aria-label="+"
        >
          +
        </button>
      </div>
    </div>
  );
}

interface ReasonInputProps {
  strings: Record<string, string>;
  value: string;
  onChange: (s: string) => void;
}

function ReasonInput({ strings, value, onChange }: ReasonInputProps) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">
        {strings.dice_reason}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={strings.dice_reason_placeholder}
        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        maxLength={60}
      />
    </div>
  );
}

interface RollButtonsProps {
  strings: Record<string, string>;
  hasResult: boolean;
  disabled: boolean;
  onRoll: () => void;
  onClear: () => void;
}

function RollButtons({ strings, hasResult, disabled, onRoll, onClear }: RollButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onRoll}
        disabled={disabled}
        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Dices className="w-4 h-4 mr-2" />
        {hasResult ? strings.dice_reroll : strings.dice_roll}
      </Button>
      {hasResult && (
        <>
          <Button variant="outline" size="icon" onClick={onRoll} title={strings.dice_reroll}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onClear} title={strings.dice_clear}>
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}

interface BadgeProps {
  tone: "critical";
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Badge({ icon, children }: BadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-1">
      {icon}
      {children}
    </span>
  );
}

interface OutcomeBannerProps {
  tone: "messy" | "bestial";
  title: string;
  hint: string;
}

function OutcomeBanner({ tone, title, hint }: OutcomeBannerProps) {
  const cls =
    tone === "messy"
      ? "bg-red-500/15 text-red-300 border border-red-500/30"
      : "bg-orange-500/15 text-orange-300 border border-orange-500/30";
  return (
    <div className={`p-3 rounded-md flex items-start gap-2 text-sm ${cls}`}>
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-xs opacity-90">{hint}</div>
      </div>
    </div>
  );
}

interface DieFaceProps {
  value: DieValue;
  kind: "normal" | "hunger" | "classic";
  label: string;
  /** When kind === "classic", drives success styling. */
  difficulty?: number;
}

interface FaceStyle {
  /** Tailwind classes for color stops + border + glow. */
  classes: string;
  /** Two CSS colors used by the radial-gradient "shine" (highlight, body). */
  highlight: string;
  body: string;
  /** Inset hairline color (suggests a faceted edge). */
  inset: string;
}

function dieStyle(kind: "normal" | "hunger" | "classic", value: DieValue, difficulty: number): FaceStyle {
  const isTen = value === 10;
  const isOne = value === 1;

  if (kind === "normal") {
    const isSuccess = value >= 6;
    if (isTen) return {
      classes: "border-amber-200 text-black shadow-[0_2px_6px_rgba(0,0,0,0.4),0_0_14px_rgba(251,191,36,0.55)]",
      highlight: "#fef3c7", body: "#f59e0b", inset: "rgba(255,255,255,0.55)",
    };
    if (isSuccess) return {
      classes: "border-zinc-300 text-zinc-900 shadow-[0_2px_5px_rgba(0,0,0,0.35)]",
      highlight: "#ffffff", body: "#a1a1aa", inset: "rgba(255,255,255,0.6)",
    };
    return {
      classes: "border-zinc-700 text-zinc-400 shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
      highlight: "#3f3f46", body: "#18181b", inset: "rgba(255,255,255,0.05)",
    };
  }
  if (kind === "hunger") {
    const isSuccess = value >= 6;
    if (isTen) return {
      classes: "border-red-300 text-white shadow-[0_2px_6px_rgba(0,0,0,0.4),0_0_14px_rgba(239,68,68,0.6)]",
      highlight: "#fecaca", body: "#dc2626", inset: "rgba(255,255,255,0.45)",
    };
    if (isOne) return {
      classes: "border-red-500 text-red-200 shadow-[0_2px_5px_rgba(0,0,0,0.45),0_0_10px_rgba(239,68,68,0.45)]",
      highlight: "#7f1d1d", body: "#450a0a", inset: "rgba(239,68,68,0.45)",
    };
    if (isSuccess) return {
      classes: "border-red-700 text-red-50 shadow-[0_2px_5px_rgba(0,0,0,0.4)]",
      highlight: "#b91c1c", body: "#7f1d1d", inset: "rgba(255,255,255,0.18)",
    };
    return {
      classes: "border-red-950 text-red-300/80 shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
      highlight: "#3f0a0a", body: "#1a0303", inset: "rgba(239,68,68,0.12)",
    };
  }
  // classic
  const isSuccess = value >= difficulty;
  if (isTen) return {
    classes: "border-amber-200 text-black shadow-[0_2px_6px_rgba(0,0,0,0.4),0_0_14px_rgba(251,191,36,0.55)]",
    highlight: "#fef3c7", body: "#f59e0b", inset: "rgba(255,255,255,0.55)",
  };
  if (isOne) return {
    classes: "border-red-500 text-red-200 shadow-[0_2px_5px_rgba(0,0,0,0.45),0_0_10px_rgba(239,68,68,0.45)]",
    highlight: "#7f1d1d", body: "#450a0a", inset: "rgba(239,68,68,0.45)",
  };
  if (isSuccess) return {
    classes: "border-zinc-300 text-zinc-900 shadow-[0_2px_5px_rgba(0,0,0,0.35)]",
    highlight: "#ffffff", body: "#a1a1aa", inset: "rgba(255,255,255,0.6)",
  };
  return {
    classes: "border-zinc-700 text-zinc-400 shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
    highlight: "#3f3f46", body: "#18181b", inset: "rgba(255,255,255,0.05)",
  };
}

function DieFace({ value, kind, label, difficulty = 6 }: DieFaceProps) {
  const style = dieStyle(kind, value, difficulty);
  // Outer diamond (rotated 45°) gives a d10 silhouette; a radial-gradient
  // "shine" plus an inset hairline suggest a faceted, physical die.
  return (
    <div
      title={`${label}: ${value}`}
      aria-label={`${label} ${value}`}
      className="inline-flex items-center justify-center p-1.5"
    >
      <span
        className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rotate-45 rounded-[3px] border-2 ${style.classes}`}
        style={{
          backgroundImage: `radial-gradient(circle at 30% 25%, ${style.highlight} 0%, ${style.body} 70%)`,
          boxShadow: `inset 0 0 0 1px ${style.inset}`,
        }}
      >
        <span className="-rotate-45 font-bold text-sm sm:text-base leading-none tabular-nums drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {value}
        </span>
      </span>
    </div>
  );
}
