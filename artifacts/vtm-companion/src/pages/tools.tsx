import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Droplet, Dices, AlertTriangle, ShieldAlert, Swords, Sparkles, RotateCcw, X, History, Trash2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import {
  getToolsEditionShortName,
  shouldShowClassicLegacyReviewHint,
} from "@/utils/toolsEdition";
import {
  rollDice,
  evaluateV5Roll,
  rollClassicDice,
  evaluateClassicRoll,
  rollRouseCheck,
  V5RollResult,
  ClassicRollResult,
  RouseCheckResult,
  DieValue,
} from "@/utils/diceRoller";
import {
  recordRoll,
  clearHistory,
  RollHistoryEntry,
} from "@/utils/diceHistory";

// Batch AL — tiny template substitution for history-summary strings. Each
// placeholder is `{key}`; values are coerced to string. Kept local because
// the dice page is the only consumer and a heavier i18n message-formatter
// would be overkill.
function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/**
 * Tools page edition policy (Batch F):
 *
 *  - The dice roller and combat summary each render an `editionLabel`
 *    chip pulled from `EDITION_LIST` via `getToolsEditionShortName`.
 *    Previously these chips were hardcoded to "V5" / "Classic", which
 *    made the Combat Summary look identical between V20, Revised, 2nd,
 *    and 1st Edition. The chip now always reflects whatever the user
 *    picked in the header edition selector.
 *  - V5 has its own dedicated combat copy block (contested rolls,
 *    Superficial / Aggravated split, Hunger die outcomes).
 *  - V20 and Revised render the shared classic copy block (pool vs.
 *    difficulty, ones cancelling successes, Stamina/Fortitude soak).
 *  - 1st and 2nd Edition render the same shared classic copy *plus*
 *    an extra user-visible "pending detailed review" hint, because
 *    the shared copy abstracts away their genuinely different rules
 *    (Bashing damage track, botch escalation). See
 *    `shouldShowClassicLegacyReviewHint` for the rationale.
 *
 *  TODO(batch-f-tools): expand `combat_classic_*` into per-edition
 *  variants for 1st / 2nd if/when verified short rule summaries land.
 *  When that ships, remove `shouldShowClassicLegacyReviewHint` and
 *  the matching `combat_classic_legacy_review_note` i18n strings, and
 *  update `src/i18n/__tests__/combatSummary.test.ts` accordingly.
 */

export default function Tools() {
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const isV5 = activeEdition === 'V5';
  const editionLabel = getToolsEditionShortName(activeEdition);
  const showLegacyReviewHint = !isV5 && shouldShowClassicLegacyReviewHint(activeEdition);

  // Batch AL — recent roll history shared across the two roller cards (V5,
  // classic, rouse). Component-local state: when the user navigates away
  // from /tools the history naturally resets, which the user explicitly
  // signed off on ("History may be session/local state").
  const [history, setHistory] = useState<RollHistoryEntry[]>([]);
  const pushHistory = useCallback((entry: RollHistoryEntry) => {
    setHistory(prev => recordRoll(prev, entry));
  }, []);
  const handleClearHistory = useCallback(() => {
    setHistory(clearHistory());
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">
      <div className="mb-2 sm:mb-8">
        <BackLink to="/compendium" label={strings.back_to_compendium || "Back to Compendium"} className="mb-4" />
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
          <Swords className="w-7 h-7 sm:w-8 sm:h-8" />
          {strings.toolsTitle}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">{strings.tools}</p>
      </div>

      {/* Dice Roller — edition-aware. Hunger lives inside the V5 roller.
          Batch AL review polish: the Recent Rolls card sits immediately
          below this so the history reads as attached to the roller. The
          V5-only Rouse Check card comes after the history, not between
          it and the roller. */}
      <div className="max-w-xl mx-auto w-full space-y-3">
        {isV5
          ? <V5DiceRoller strings={strings} editionLabel={editionLabel} pushHistory={pushHistory} />
          : <ClassicDiceRoller strings={strings} editionLabel={editionLabel} pushHistory={pushHistory} />}

        {/* Recent rolls — visually tied to the roller above. Collapsed by
            default (shows only the latest entry); the Show all / Show less
            toggle reveals the rest of the capped 10. Batch AL review #2
            polish: the visible list is filtered by the active edition so
            V5 hunger rolls and classic difficulty rolls never appear in
            the same view. The underlying store still caps at 10 entries
            regardless of edition — switching back surfaces the other
            edition's history again, untouched. */}
        <RollHistoryCard
          strings={strings}
          history={history}
          isV5={isV5}
          onClear={handleClearHistory}
        />
      </div>

      {/* Batch AL — Rouse Check card. V5-only by design: the brief asks
          us NOT to render it (or any "V5 only" hint) on classic editions.
          The card is simply absent there, matching how the V5 Hunger
          tracker hides itself on classic editions. */}
      {isV5 && (
        <div className="max-w-xl mx-auto w-full">
          <RouseCheckCard
            strings={strings}
            editionLabel={editionLabel}
            pushHistory={pushHistory}
          />
        </div>
      )}

      <div className="max-w-xl mx-auto w-full mt-6">
         <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              {strings.combatSummary}
              {/* Chip used to be a fixed "V5"/"Classic" label, which made
                  the Combat Summary feel identical across every classic
                  edition. We now show the *active* edition's short name
                  (V5, V20, REVISED, 2ND, 1ST) so the chip always
                  reflects the user's edition selector in the header. */}
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70">
                {editionLabel}
              </span>
            </CardTitle>
          </CardHeader>
          {/* Combat summary text is edition-aware: V5 covers contested rolls,
              superficial/aggravated split, and the Hunger die outcomes the
              app already exposes in the dice roller. The shared classic
              copy covers pool vs. difficulty, ones cancelling successes,
              and damage soak — broadly correct for V20 / Revised. When 1st
              or 2nd is selected we render an extra italic line warning
              that the summary abstracts edition-specific differences
              (Bashing damage track, botch escalation) — see the
              `classicEditionNeedsLegacyReviewHint` helper above. */}
          <CardContent className="space-y-3 text-sm text-foreground/80">
            {isV5 ? (
              <>
                <p>{strings.combat_v5_melee || strings.combat_melee}</p>
                <p>{strings.combat_v5_ranged || strings.combat_ranged}</p>
                <p>{strings.combat_v5_superficial || strings.combat_superficial}</p>
                <p>{strings.combat_v5_aggravated || strings.combat_aggravated}</p>
                {strings.combat_v5_hunger_note && (
                  <p className="text-xs text-muted-foreground italic">
                    {strings.combat_v5_hunger_note}
                  </p>
                )}
              </>
            ) : (
              <>
                <p>{strings.combat_classic_pool}</p>
                <p>{strings.combat_classic_ones}</p>
                <p>{strings.combat_classic_damage}</p>
                {strings.combat_classic_note && (
                  <p className="text-xs text-muted-foreground italic">
                    {strings.combat_classic_note}
                  </p>
                )}
                {showLegacyReviewHint && strings.combat_classic_legacy_review_note && (
                  <p
                    className="text-xs text-amber-300/80 italic"
                    data-testid="combat-legacy-review-hint"
                  >
                    {strings.combat_classic_legacy_review_note}
                  </p>
                )}
              </>
            )}
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
  /** Short edition name shown in the corner chip — always "V5" here,
      but threaded as a prop for symmetry with `ClassicDiceRoller`
      and so the chip stays in sync with `EDITION_LIST` automatically
      if the V5 short name ever changes. */
  editionLabel: string;
  /** Batch AL — record this roll into the shared recent-rolls history. */
  pushHistory: (entry: RollHistoryEntry) => void;
}

function V5DiceRoller({ strings, editionLabel, pushHistory }: V5DiceRollerProps) {
  const [dicePool, setDicePool] = useState(5);
  const [hungerDice, setHungerDice] = useState(1);
  const [reason, setReason] = useState("");
  const [rollResult, setRollResult] = useState<V5RollResult | null>(null);
  const [lastReason, setLastReason] = useState<string>("");

  const handleRoll = () => {
    if (dicePool <= 0) return;
    const roll = rollDice(dicePool, hungerDice);
    const evaluated = evaluateV5Roll(roll);
    const trimmedReason = reason.trim();
    setRollResult(evaluated);
    setLastReason(trimmedReason);
    pushHistory({
      id: `v5-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: 'v5',
      summary: fmt(strings.dice_history_summary_v5 || 'Pool {pool} / Hunger {hunger} — {successes} success(es)', {
        pool: dicePool,
        hunger: Math.min(hungerDice, dicePool),
        successes: evaluated.successes,
      }),
      reason: trimmedReason || undefined,
      timestamp: Date.now(),
    });
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
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {editionLabel}
          </span>
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
  /** Short edition name shown in the corner chip ("V20", "REVISED",
      "2ND", "1ST"). Previously hardcoded to "Classic" which made the
      same roller render identically for every classic edition. */
  editionLabel: string;
  /** Batch AL — record this roll into the shared recent-rolls history. */
  pushHistory: (entry: RollHistoryEntry) => void;
}

function ClassicDiceRoller({ strings, editionLabel, pushHistory }: ClassicDiceRollerProps) {
  const [dicePool, setDicePool] = useState(5);
  const [difficulty, setDifficulty] = useState(6);
  const [reason, setReason] = useState("");
  const [rollResult, setRollResult] = useState<ClassicRollResult | null>(null);
  const [lastReason, setLastReason] = useState<string>("");

  const handleRoll = () => {
    if (dicePool <= 0) return;
    const dice = rollClassicDice(dicePool);
    const evaluated = evaluateClassicRoll(dice, difficulty);
    const trimmedReason = reason.trim();
    setRollResult(evaluated);
    setLastReason(trimmedReason);
    pushHistory({
      id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: 'classic',
      summary: fmt(strings.dice_history_summary_classic || 'Pool {pool} / Diff {difficulty} — {net} net success(es)', {
        pool: dicePool,
        difficulty: evaluated.difficulty,
        net: evaluated.netSuccesses,
      }),
      reason: trimmedReason || undefined,
      timestamp: Date.now(),
    });
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
            {editionLabel}
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
  // Batch AM — show a small blood-drop next to the label when this input
  // controls Hunger dice, so the V5 Hunger affordance reads as such at a
  // glance. Purely visual; the numeric value remains the same and stays
  // accessible.
  const isHungerInput = accent === "hunger";
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
        {isHungerInput && (
          <Droplet
            className="w-3 h-3 text-red-500 fill-current shrink-0"
            aria-hidden
            data-testid="hunger-input-icon"
          />
        )}
        {label}
      </label>
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

// ---------------------------------------------------------------------------
// Batch AL — V5 Rouse Check card.
//
// V5-only. Classic editions never had rouse checks (they spent Blood Pool
// instead), so following Batch AL review polish the card is simply not
// rendered for non-V5 editions — no fallback hint, mirroring the Hunger
// tracker which is also V5-only.
// ---------------------------------------------------------------------------

interface RouseCheckCardProps {
  strings: Record<string, string>;
  editionLabel: string;
  pushHistory: (entry: RollHistoryEntry) => void;
}

function RouseCheckCard({ strings, editionLabel, pushHistory }: RouseCheckCardProps) {
  const [result, setResult] = useState<RouseCheckResult | null>(null);

  const handleRoll = () => {
    const next = rollRouseCheck();
    setResult(next);
    const outcomeWord = next.success
      ? (strings.dice_history_summary_rouse_success || 'success')
      : (strings.dice_history_summary_rouse_failure || 'failure');
    pushHistory({
      id: `rouse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: 'rouse',
      summary: fmt(strings.dice_history_summary_rouse || 'Rouse check — {outcome} (die {die})', {
        outcome: outcomeWord,
        die: next.die,
      }),
      timestamp: Date.now(),
    });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Droplet className="w-4 h-4 text-red-500" aria-hidden />
          {strings.dice_rouse_check || 'Rouse check'}
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {editionLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground/80">
        <p className="text-xs text-muted-foreground italic">
          {strings.dice_rouse_help || 'Roll one die — 6+ no Hunger increase, 1–5 Hunger increases by 1.'}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={handleRoll}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="rouse-check-roll"
          >
            <Droplet className="w-4 h-4 mr-2" />
            {strings.dice_rouse_check || 'Rouse check'}
          </Button>
          {result && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleRoll}
              title={strings.dice_reroll || 'Reroll'}
              data-testid="rouse-check-reroll"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
        <AnimatePresence mode="popLayout">
          {result && (
            <motion.div
              key={`rouse-${result.die}-${result.success}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`p-3 rounded-md border text-sm flex items-start gap-2 ${
                result.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-red-500/15 border-red-500/30 text-red-200'
              }`}
              data-testid="rouse-check-result"
              role="status"
              aria-live="polite"
            >
              <span className="font-bold tabular-nums text-base shrink-0 mt-0.5">
                {result.die}
              </span>
              <div>
                <div className="font-bold">
                  {result.success
                    ? (strings.dice_rouse_success || 'Success — Hunger does not increase')
                    : (strings.dice_rouse_failure || 'Failure — Hunger increases by 1')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Batch AL — Recent rolls history list.
//
// In-memory only: navigating away from /tools clears the list. The summary
// strings on each entry are captured at record time so we never re-localize
// a historic roll. The clear button mirrors the existing dice "Clear" UX so
// users don't have to learn a new affordance.
//
// Batch AL review polish:
//   * Collapsed by default — the latest roll is the only entry rendered
//     until the user hits "Show all". This keeps the section calm directly
//     under the roller while still surfacing the most recent result.
//   * Deferred follow-up: render the underlying dice as compact faces /
//     chips per entry. The current `RollHistoryEntry` shape only stores a
//     pre-formatted summary string (no per-die values), and the brief
//     asked us NOT to expand the data model in this batch. Pencilled in
//     for the upcoming dice visual redesign batch alongside the ankh /
//     special-symbol work.
// ---------------------------------------------------------------------------

interface RollHistoryCardProps {
  strings: Record<string, string>;
  history: RollHistoryEntry[];
  /** Active edition flag. Drives the V5-vs-classic filter so the visible
   *  list never mixes hunger rolls and difficulty rolls. The full store
   *  is preserved untouched — switching editions just changes what is
   *  rendered. */
  isV5: boolean;
  onClear: () => void;
}

function RollHistoryCard({ strings, history, isV5, onClear }: RollHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  // Filter the rendered list by edition-relevance (Batch AL review #2):
  //   * V5 view shows kind 'v5' + 'rouse' — both are V5-specific.
  //   * Classic view shows kind 'classic' only.
  // The underlying `history` array stays full-fidelity so a quick edition
  // toggle in the header never loses the other edition's rolls.
  const filteredHistory = history.filter(entry =>
    isV5 ? (entry.kind === 'v5' || entry.kind === 'rouse') : entry.kind === 'classic'
  );
  // Default view: just the latest roll. The full filtered list appears
  // once the user expands.
  const visible = expanded ? filteredHistory : filteredHistory.slice(0, 1);
  const canExpand = filteredHistory.length > 1;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <History className="w-4 h-4" aria-hidden />
          {strings.dice_history_title || 'Recent rolls'}
          {filteredHistory.length > 0 && (
            <span className="text-[11px] font-sans tabular-nums text-muted-foreground/70">
              {filteredHistory.length}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {canExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
                aria-controls="dice-history-list"
                className="h-7 px-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                data-testid="dice-history-toggle"
              >
                {expanded
                  ? (strings.dice_history_show_less || 'Show less')
                  : (strings.dice_history_show_all || 'Show all')}
              </Button>
            )}
            {/* Clear wipes the whole underlying store (both editions). The
                button only appears when SOMETHING is stored — even rolls
                from the other edition keep it available so the user can
                explicitly reset their session. */}
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onClear(); setExpanded(false); }}
                className="h-7 px-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground gap-1"
                title={strings.dice_history_clear || 'Clear history'}
                aria-label={strings.dice_history_clear || 'Clear history'}
                data-testid="dice-history-clear"
              >
                <Trash2 className="w-3 h-3" />
                {strings.dice_history_clear || 'Clear history'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic" data-testid="dice-history-empty">
            {strings.dice_history_empty || 'No rolls yet.'}
          </p>
        ) : (
          <ol
            id="dice-history-list"
            className="space-y-1.5"
            data-testid="dice-history-list"
          >
            {visible.map((entry, idx) => (
              <li
                key={entry.id}
                className="flex items-start gap-2 text-sm py-1.5 border-b border-border/40 last:border-0"
                data-testid={`dice-history-entry-${idx}`}
              >
                <span
                  aria-hidden
                  className="text-[10px] uppercase tracking-wider text-muted-foreground/70 shrink-0 mt-1 w-12"
                >
                  {entry.kind === 'rouse' ? 'Rouse' : entry.kind === 'v5' ? 'V5' : 'Pool'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-foreground/85 break-words">{entry.summary}</div>
                  {entry.reason && (
                    <div className="text-xs italic text-muted-foreground truncate">
                      "{entry.reason}"
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
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
