# Dormant optional-data prompt — audit & planning doc

**Batch BI-3 · audit only · no runtime change**

Follows up on:

- [Batch BE — Human/Ghoul morality tracking audit](./human-ghoul-morality-tracking-audit.md)
- [Batch BF — Ghoul vitae tracking audit](./ghoul-vitae-tracking-audit.md)
- [Batch BI — Ghoul Disciplines/Powers audit](./ghoul-disciplines-powers-audit.md)

after BE-1 (opt-in morality toggle), BE-2 (opt-in morality print),
BG (opt-in Ghoul Vitae toggle), BH (V20 Ghoul Vitae print parity),
BI-1 (opt-in classic Ghoul Powers section), and BI-2 (classic Ghoul
Powers print parity) shipped.

This batch answers one product question: **when a Human or Ghoul has
dormant optional data on disk but the matching opt-in flag is off,
how should we tell the user it's there?** No runtime files are
touched.

Audience: future batch authors. Every finding cites a file and a
symbol so the next batch can act without re-running the survey.

---

## 1 · Current behavior

The opt-in flags shipped in BE-1 / BG / BI-1 share an architectural
shape. Each pairs a boolean **visibility flag** on `BaseCharacter`
with a **data field** that already existed on `V5Character` or
`ClassicCharacter`:

| System | Flag (BaseCharacter) | Data field | Live-sheet gate | Print gate | Storage seeds the data? |
|---|---|---|---|---|---|
| Morality | `trackMorality` | `humanity?: number` (V5/classic) | DynamicSheet.tsx — `isMortalKind && character.trackMorality === true` ([:1080](src/components/character/DynamicSheet.tsx:1080)) | CharacterPrintView.tsx — `(kind === 'human' \|\| 'ghoul') && trackMorality === true` ([:526](src/components/character/CharacterPrintView.tsx:526)) | No (Batch BA stopped seeding for non-vampires) |
| Vitae | `trackVitae` | `bloodPool?: { current, max }` (classic) | DynamicSheet.tsx — `isGhoulClassic && character.trackVitae === true` ([:1111](src/components/character/DynamicSheet.tsx:1111)) | CharacterPrintView.tsx — `!isV5 && kind === 'ghoul' && trackVitae === true && cl?.bloodPool` (Batch BH branch) | No (Batch BA / BG keep non-vampires clean) |
| Powers | `trackGhoulPowers` | `disciplines: Record<string, DisciplineValue>` (always present) | DynamicSheet.tsx — `isGhoulClassic && character.trackGhoulPowers === true` ([:1137](src/components/character/DynamicSheet.tsx:1137)) | CharacterPrintView.tsx — `!isV5 && kind === 'ghoul' && trackGhoulPowers === true` (Batch BI-2 branch) | Yes (`createEmptyCharacter` always seeds `disciplines: {}`) |

All three flags are **default off** and **default invisible**.
Storage normalization in `getCharacters`
([characterStorage.ts:285-330](src/services/characterStorage.ts:285))
preserves dormant numeric / object values verbatim — nothing is
deleted on load — but the sheet and print paths never expose them
until the user opts in.

The three opt-in flags are **independent** — a Ghoul can have any
combination of (morality, vitae, powers) on/off. There is currently
**no inline UI** that tells the user a dormant value exists.

---

## 2 · Dormant data categories — concrete reproduction shapes

The audit must call out every shape we might surface a prompt for.

### 2.1 Mortal Humanity (`humanity?: number`)

- **Affected kinds:** `human`, `ghoul`.
- **Affected editions:** both (V5 `V5Character.humanity` and classic
  `ClassicCharacter.humanity`).
- **How it gets dormant:** AX/AY-era humans/ghouls were created via
  the vampire-shaped pipeline that always seeded `humanity: 7`. Batch
  BA stopped seeding for non-vampires but `getCharacters` keeps any
  number already on disk
  ([:285](src/services/characterStorage.ts:285),
  [:326](src/services/characterStorage.ts:326)).
- **Visible today?** No. The mortal schemas omit the field
  ([human.ts](src/data/characterSheets/human.ts)) and the print path
  gates on `trackMorality === true` for non-vampires.

### 2.2 V20 Ghoul Blood Pool (`bloodPool?: { current, max }`)

- **Affected kinds:** `ghoul` only (classic editions).
- **Affected editions:** V20 / Revised / 2ND / 1ST — not V5.
- **How it gets dormant:** pre-BA ghouls created via the vampire
  pipeline carried `{ current: 10, max: 10 }`. `getCharacters`
  preserves the object verbatim
  ([:316](src/services/characterStorage.ts:316)).
- **Visible today?** No. The classic ghoul schema omits the field;
  the print path gates on `trackVitae === true`.

### 2.3 Classic Ghoul disciplines (`disciplines: Record<string, DisciplineValue>`)

- **Affected kinds:** `ghoul` (classic editions).
- **Affected editions:** classic. V5 ghouls also carry the field but
  the BI-1 implementation explicitly excludes V5 ghouls from the
  Powers card.
- **How it gets dormant:** pre-AX ghouls created as vampires retained
  arbitrary discipline maps. Every brand-new character also gets an
  **empty** `disciplines: {}` from `createEmptyCharacter`
  ([:404](src/services/characterStorage.ts:404)) — that is "extant
  but empty" and **not the dormant case we care about** (an empty map
  is not user content).
- **Visible today?** No. The mortal schemas omit `disciplines`; the
  print path gates on `trackGhoulPowers === true`.

### 2.4 Edge case: V5 Ghoul with classic-only dormant data

A V5 Ghoul who was previously a classic ghoul (edition flip via the
character editor) could carry a dormant `bloodPool: { current, max }`.
The V5 ghoul has no Vitae card to opt into and no print branch for
Vitae, so the data is currently invisible by design. **Should we
prompt to clean it up?** See §3.5.

### 2.5 Edge case: Human with vampire-only dormant data

A Human who was previously a vampire can carry many fields:
`bloodPool`, `disciplines`, `humanity`, `bloodPotency`, `hunger`,
`generation`, `predatorType`, etc. Currently all are hidden from
sheet and print for humans. Only `humanity` has a (deferred) opt-in
path — the rest of the vampire surface area is **not exposed to
humans by any toggle**, so a prompt would only realistically cover
the dormant Humanity case.

---

## 3 · Audit answers — direct responses to the brief

### 3.1 Should the app show a one-time prompt when dormant optional data exists?

**Yes, but only when (a) the relevant opt-in flag is off, (b) the
data field carries usable content (non-zero / non-empty), and (c) the
character's kind/edition can actually opt into the matching toggle.**
That last gate is critical: a V5 Ghoul with a dormant `bloodPool`
must NOT receive a Vitae prompt because the V5 ghoul has no Vitae
toggle to opt into. Same for humans with dormant `bloodPool` /
`disciplines`.

### 3.2 Separate per system or unified?

**Per-system, but co-located.** Each of the three trackers (Morality,
Vitae, Powers) has a different opt-in path and a different data
shape. A single "you have legacy data" prompt would be vague and
would force us to enumerate three different remediation flows inside
one component. Putting one prompt **inline at the top of the
relevant opt-in card** is clearer, smaller, and lets the user act
locally:

- Dormant `humanity` → inline prompt inside the Morality card.
- Dormant `bloodPool` → inline prompt inside the Vitae card.
- Dormant `disciplines` (non-empty) → inline prompt inside the Powers
  card.

### 3.3 Where should prompts appear?

**Inline on the sheet, in Edit Mode only.** Not on sheet open as a
modal, not on import, not in a separate maintenance area:

- Modals interrupt the user's workflow and would punish people who
  see them every time they open a legacy character.
- Import-time prompts blur the boundary between data-loading and
  data-editing and would force decisions on bulk imports.
- A separate maintenance area is invisible — users will not find it.

The inline-card placement keeps the prompt next to the control it
actually offers (the existing toggle), and Edit Mode keeps View Mode
clean for read-only sheets / print previews / sharing.

### 3.4 What user actions should the prompt offer?

Three actions. Each is unambiguous and does not destroy data without
asking again:

1. **Enable tracking** → flips the matching `track*` flag on. The
   data becomes visible immediately. The dormant value is preserved
   verbatim (the existing toggle handlers already do this — BE-1 §3
   answer 9, BG seed-only-when-absent, BI-1 no-seed).
2. **Keep hidden** → does not flip the toggle; instead persists a
   per-character dismissal flag (§3.5) so the prompt does not
   re-appear next time the character is opened in Edit Mode. The
   dormant data stays on disk.
3. **Permanently clear dormant data** → **DEFERRED to a separate
   later batch**. The first prompt implementation should NOT offer
   destructive cleanup. A "Clear" action belongs in a follow-up batch
   so we can ship Confirm dialogs, undo affordance, and per-system
   reasoning without bundling it into the prompt MVP. (Brief §
   "Recommended angle to evaluate" explicitly directs this.)

### 3.5 Should dismissals be stored per character?

**Yes.** Two reasons:

- Per-character is the only granularity that works without inventing
  new global settings or a per-account / per-app state surface. The
  existing data model is per-character — keep it.
- A user with N legacy characters wants to make N independent
  decisions. A global dismissal forces one all-or-nothing choice.

Persist dismissals on `BaseCharacter` so the field rides through the
existing JSON envelope and export/import path. Three flags, one per
prompt, mirror the three opt-in flags:

```ts
interface BaseCharacter {
  …existing fields…
  trackMorality?: boolean;
  trackVitae?: boolean;
  trackGhoulPowers?: boolean;
  /** Batch BI-3 — set to true when the user dismisses the inline
   *  dormant-Humanity prompt for this character. Suppresses the
   *  prompt on future Edit Mode opens; does NOT delete the dormant
   *  `humanity` value. */
  dismissedDormantMoralityPrompt?: boolean;
  /** Batch BI-3 — same shape as above, for the dormant `bloodPool`
   *  prompt on classic Ghouls. */
  dismissedDormantVitaePrompt?: boolean;
  /** Batch BI-3 — same shape as above, for the dormant `disciplines`
   *  prompt on classic Ghouls. */
  dismissedDormantPowersPrompt?: boolean;
}
```

### 3.6 Three flags vs one generic structure?

**Three flags.** A generic structure (e.g.
`dismissedPrompts: Record<PromptKey, boolean>`) is tempting but adds
serialization complexity for no real win at three entries. The flat
booleans:

- Mirror the existing `trackMorality` / `trackVitae` /
  `trackGhoulPowers` pattern exactly.
- Round-trip through `JSON.parse(JSON.stringify(char))` with zero
  validator changes.
- Stay grep-able by name, which matters when a future batch wants to
  reset / migrate a single flag.

If a fourth prompt ever ships (very unlikely — V5 ghoul powers is the
only currently-deferred audit recommendation, see §11 below), we can
revisit. Until then, three flat booleans wins.

### 3.7 Should dormant data ever be auto-enabled?

**No.** Surprising users by suddenly showing data they didn't author
is exactly the failure mode the dormant-prompt UX exists to avoid.
The opt-in is the user's choice every time. This matches every
prior audit (BE §9, BF §10, BI §10).

### 3.8 Should dormant data ever be auto-deleted?

**No.** Deleting user data on load — even data that's "definitely
wrong" — violates the brief's "preserve user data" guidance and the
universal "do not silently delete user data" rule. Storage
normalization stays preservative-only.

A user-initiated explicit cleanup action is fine — but ships in a
later batch, not in the first prompt implementation (§3.4 above).

### 3.9 How should this behave after import/export?

- **Export:** the new dismissal flags ride through
  `JSON.parse(JSON.stringify(char))`
  ([characterStorage.ts:666](src/services/characterStorage.ts:666))
  losslessly. No `EXPORT_VERSION` / `BACKUP_VERSION` bump needed
  (additive optional fields, same rule the three `track*` flags
  already follow).
- **Import:** a backup containing `dismissedDormantMoralityPrompt:
  true` simply suppresses the prompt on the next Edit Mode open. A
  backup without the flag (pre-BI-3 client export) behaves as if the
  dismissal had never happened — the prompt re-appears on the first
  Edit Mode open, giving the user a fresh decision. **That is the
  correct behavior** — a user re-importing into a clean install
  should be re-asked. No special-case logic needed.
- **Cross-version:** pre-BI-3 clients silently drop the unknown
  dismissal flags on save (they're not in the type, so they don't
  get serialized back) → re-importing into a BI-3 client would lose
  the dismissal. Acceptable read-degradation; matches the prior
  cross-version policy for `trackMorality` / `trackVitae` /
  `trackGhoulPowers`.

### 3.10 EN / ES wording

- **Per prompt, two short strings** — body + the two action labels.
  Use the existing label keys for the actions where possible to
  avoid translation drift:
  - "Enable tracking" → reuse the existing `sheet_track_morality` /
    `sheet_track_vitae` / `sheet_track_ghoul_powers` strings via a
    `t('enable_tracking', { label: strings[…] })` template, OR
    introduce a single new key per prompt action: e.g.
    `sheet_dormant_morality_enable`, `sheet_dormant_morality_dismiss`.
  - "Keep hidden" / "Dismiss" → one new key per prompt action.
- Suggested copy (Dark-Pack-safe — describes app behavior, not rules):
  - Morality body: EN "This character has stored Humanity data. Track
    it on this sheet?" / ES "Este personaje tiene datos de
    Humanidad guardados. ¿Mostrarlos en esta hoja?"
  - Vitae body: EN "This character has stored Vitae data. Track it on
    this sheet?" / ES "Este personaje tiene datos de Vitae guardados.
    ¿Mostrarlos en esta hoja?"
  - Powers body: EN "This character has stored Powers data. Track it
    on this sheet?" / ES "Este personaje tiene datos de Poderes
    guardados. ¿Mostrarlos en esta hoja?"
  - Actions: EN "Enable" / "Dismiss"; ES "Activar" / "Descartar".

Five new i18n keys total (one body per system + two shared action
verbs). Lighter than a per-system action-label set.

### 3.11 Lowest-risk implementation phase

**One single-system prompt first.** Pick the most-likely-affected
case — dormant Humanity on humans/ghouls — and ship the inline-prompt
UX there. Once that pattern is proven, copy it to Vitae and Powers in
follow-up batches. This is identical to how BE-1 / BG / BI-1 shipped
sequentially.

See §10 for the explicit recommendation.

---

## 4 · User-experience options

### Option U1 — Inline per-card prompt in Edit Mode (recommended)

A small inset banner inside each opt-in card (Morality, Vitae,
Powers), rendered when:

```
isEligibleKindAndEdition          // gate matches the card's existing gate
  && trackingFlagIsFalse           // user hasn't already opted in
  && dormantDataExists             // see §5 for "exists" predicates
  && !dismissedDormantPromptFlag   // user hasn't already dismissed
  && editMode                      // View Mode stays clean
```

Two buttons: **Enable** (flips the matching `track*` flag on) and
**Dismiss** (sets the matching `dismissedDormant*Prompt` flag to
true). The prompt body explains what data was found.

**Pros**
- One UX pattern, applied three times (mirrors the BE-1/BG/BI-1
  sequential rollout strategy).
- Banner is local to the card the user can already see in Edit Mode.
- No new modal infrastructure. No new global state.
- Per-character decisions stay per-character.

**Cons**
- Three near-identical components / branches if not factored
  carefully.
- Banner adds vertical space on the card when the toggle is off,
  which is the most common case for legacy mortals. The dismissal
  flag fixes this after the first interaction.

### Option U2 — One unified "Legacy data" prompt at the top of the sheet

Single banner above Basic Info covering all three systems with one
"Review" affordance that opens a per-system table.

**Pros**
- One UI surface to maintain.

**Cons**
- Forces a separate decision UI (table / modal), which contradicts
  "avoid annoying popups".
- Distance between the prompt and the relevant toggle makes the
  cause-effect relationship less obvious.
- Granular dismissal becomes more code, not less.

**Rejected.**

### Option U3 — Modal on sheet open

Loud, interruptive, exactly the pattern the brief tells us to avoid.
**Rejected.**

### Option U4 — Maintenance area in Settings

Invisible to the user. Power-user only. Useful for the deferred
explicit-cleanup action but **not** for the first dormant-prompt UX.
**Rejected for BI-3-1.**

### Recommendation: **U1**

The inline per-card prompt is the only option that:
1. Lives next to the existing opt-in toggle (already-validated UX
   from BE-1).
2. Honors the per-character / per-system decision granularity.
3. Surfaces decisions in the surface the user is already editing.
4. Composes with View Mode read-only behavior.

---

## 5 · Data model options

### Option D1 — Three flat `dismissedDormant*Prompt?: boolean` flags on `BaseCharacter` (recommended)

```ts
interface BaseCharacter {
  …
  dismissedDormantMoralityPrompt?: boolean;
  dismissedDormantVitaePrompt?: boolean;
  dismissedDormantPowersPrompt?: boolean;
}
```

Rationale spelled out in §3.5–3.6. No storage normalization needed —
the spread in `getCharacters` already preserves the flags verbatim.
No validator changes. No version bumps.

### Option D2 — Single `Record<PromptKey, boolean>` map

Rejected per §3.6.

### Option D3 — Per-character `events`/`audit` log

Wildly overscoped. Rejected.

### "Data exists" predicates — exact logic per system

The prompt should only fire when the dormant **content is non-trivial**.
A `humanity: 0` or `bloodPool: { current: 0, max: 0 }` is "dormant
but empty"; surfacing a prompt to opt into nothing wastes the user's
attention. Exact rules:

- **Morality** → `typeof character.humanity === 'number' && character.humanity > 0`.
  - `humanity === 0` → no prompt.
  - `humanity === 7` → prompt (the Batch BA-era seed value, the most
    common "dormant 7" case).
- **Vitae** → `cl?.bloodPool && (cl.bloodPool.current > 0 || cl.bloodPool.max > 0)`.
  - A {current:0, max:0} object that somehow lives on disk → no
    prompt (nothing useful to enable).
  - Any non-zero current OR max → prompt.
- **Powers** → `Object.keys(character.disciplines || {}).length > 0`.
  - Empty `disciplines: {}` (the `createEmptyCharacter` seed) →
    **no prompt** — every brand-new mortal carries an empty
    disciplines map and we must NOT spam every new character with a
    "you have stored Powers data" banner.
  - Any non-empty map (`disciplines: { potence: 1 }`) → prompt.

These "exists" predicates are pure data and should be unit-tested as
plain helpers in a `dormantData.ts` module so the UI layer can call
one named function per system.

### Cross-kind safety predicates

In addition to "exists", every prompt must also gate on the
character's eligibility for the matching toggle. The relevant
combinations:

| System | Required `kind` | Required `edition` |
|---|---|---|
| Morality | `human` or `ghoul` | any |
| Vitae | `ghoul` | not `V5` |
| Powers | `ghoul` | not `V5` |

V5 Ghouls with dormant `bloodPool` or `disciplines` (§2.4): the
prompt is **suppressed** because they can't opt in. The data stays on
disk untouched; if the user changes the character's edition to V20
later, the prompt fires at that point.

Humans with dormant `bloodPool` / `disciplines` (§2.5): the prompt is
suppressed because they can't opt in. Same upgrade-path behavior if
the user changes kind to `ghoul`.

---

## 6 · Import / export implications

- **No `EXPORT_VERSION` / `BACKUP_VERSION` bump.** Three optional
  boolean fields are additive.
- **No validator changes.** `validateCharacterExport` /
  `validateCharacterBackup` keep checking name / edition / clan
  ([characterStorage.ts:594-617](src/services/characterStorage.ts:594)).
- **Cross-version:** see §3.9. A pre-BI-3 client silently drops the
  unknown dismissal flags through its type system on save → BI-3
  client re-shows the prompt after the round trip, which is the
  correct behavior (user gets re-asked).
- **Bulk imports:** the prompt only fires inside Edit Mode for the
  character the user has opened. Importing a backup of 50 mortals
  does NOT cause 50 prompts to appear simultaneously; each character
  shows the prompt only the first time the user opens it in Edit
  Mode.

---

## 7 · Print / PDF implications

**None.** Print is read-only and never renders any inline prompt UI;
the BE-2 / BH / BI-2 print branches already gate on the matching
`track*` flag, so dormant data still never leaks into print
regardless of whether the prompt has been shown / dismissed /
enabled. The prompt is purely a sheet-edit affordance.

---

## 8 · Backward compatibility

- **Vampires:** unaffected. `isVampire` characters never enter the
  Morality / Vitae / Powers card branches; the prompt is structurally
  unreachable for vampires.
- **New mortal characters (post-BA):** ship with no dormant data.
  - Humanity: not seeded for non-vampires since Batch BA.
  - bloodPool: not seeded for non-vampires since Batch BA.
  - disciplines: seeded as empty `{}` by `createEmptyCharacter`. Per
    the §5 predicates, an empty map does NOT trigger the Powers
    prompt.
  - So a brand-new V20 Ghoul opens to a clean sheet with three
    toggles (all off) and **zero prompts**. ✓
- **Legacy mortals (pre-BA):** ship with potentially dormant
  `humanity: 7` / `bloodPool: {10,10}` / non-empty `disciplines`. On
  first Edit Mode open after BI-3-1, the matching inline prompts
  appear inside the matching cards. Three independent decisions; no
  modal interruption.
- **First open after a migration that re-imports a legacy backup:**
  prompts appear (the dismissal flag is absent from the backup, see
  §3.9). User gets re-asked. Correct.

---

## 9 · Testing strategy

### Pure helper tests (`src/utils/dormantData.test.ts`)

Lock down the "exists" predicates as plain data functions so the UI
layer can compose them without re-deriving the same checks in three
places.

```ts
hasDormantHumanity(character)  // §5 predicate
hasDormantVitae(character)     // §5 predicate
hasDormantPowers(character)    // §5 predicate
```

For each helper:
- Returns `false` when the matching `track*` flag is `true` (data is
  no longer "dormant" — the user opted in).
- Returns `false` when the matching `dismissedDormant*` flag is
  `true`.
- Returns `false` when the kind/edition doesn't qualify (V5 ghoul for
  Vitae/Powers, human for Vitae/Powers, vampire for any).
- Returns `false` for the trivial-empty cases (humanity 0, bloodPool
  {0,0}, disciplines {}).
- Returns `true` for the canonical dormant cases (humanity 7,
  bloodPool {10,10}, disciplines {potence:1}).

### Sheet rendering tests

For each card:
- Brand-new mortal → no prompt rendered.
- Legacy mortal with dormant data + matching toggle off + no
  dismissal → prompt rendered inside the matching card, above the
  toggle.
- Click "Enable" → matching `track*` flag flips to true, prompt
  disappears, tracker appears with the preserved dormant value.
- Click "Dismiss" → matching `dismissedDormant*` flag flips to true,
  prompt disappears, dormant data stays on disk (verified by reading
  the character's storage shape post-dismiss).
- View Mode → prompt is suppressed regardless of state.
- Vampire sheets → prompt never appears even with stray dormant data.

### Round-trip tests

- A mortal with `dismissedDormantVitaePrompt: true` and
  `bloodPool: { current: 10, max: 10 }` survives JSON serialization
  losslessly.
- A backup containing the dismissal flag re-renders the matching
  card without the prompt after import.
- A pre-BI-3 backup re-renders the prompt after import. (Verifies
  the "fresh decision after migration" contract.)

---

## 10 · Recommended implementation phases

| Phase | Scope | Risk | Approx. files |
|---|---|---|---|
| **BI-3-1 — Dormant Humanity prompt (next batch — see §11)** | Add `dismissedDormantMoralityPrompt?: boolean` to `BaseCharacter`. Add `hasDormantHumanity(character)` helper. Render inline banner inside the Morality card on Human/Ghoul sheets in Edit Mode. Two new i18n keys (body + dismiss). | Low — purely additive, opt-in. | ~5–7 |
| **BI-3-2 — Dormant Vitae prompt** | Same pattern, in the Vitae card on classic Ghouls. Add `dismissedDormantVitaePrompt`. Two new i18n keys. | Low | ~3–4 |
| **BI-3-3 — Dormant Powers prompt** | Same pattern, in the Powers card on classic Ghouls. Add `dismissedDormantPowersPrompt`. Two new i18n keys. | Low | ~3–4 |
| **Future — explicit "Clear dormant data" action** | Adds a destructive button (with confirm) to the maintenance / character options area. Out of scope for the inline-prompt UX; separate audit. | Medium — touches storage writes for delete-on-purpose flows. | not scoped here |

Phases BI-3-1 / BI-3-2 / BI-3-3 are independently shippable; ordering
is just convenience.

---

## 11 · Recommended next implementation batch

**Batch BI-3-1 — inline dormant-Humanity prompt for Humans and Ghouls.**

Scope it explicitly to:

1. **Type:** add `dismissedDormantMoralityPrompt?: boolean` to
   `BaseCharacter` in [types/index.ts](src/types/index.ts).
2. **Helper:** add `hasDormantHumanity(character)` in a new
   `src/utils/dormantData.ts` returning `true` only when:
   - `character.kind === 'human' || 'ghoul'`,
   - `character.trackMorality !== true`,
   - `character.dismissedDormantMoralityPrompt !== true`,
   - `typeof character.humanity === 'number' && character.humanity > 0`.
3. **Sheet UI:** inside the Morality card in
   [DynamicSheet.tsx](src/components/character/DynamicSheet.tsx),
   when `!readonly && hasDormantHumanity(character)`, render a small
   amber-tinted banner ABOVE the toggle with:
   - Body: `strings.dormant_morality_body` (new key).
   - Buttons: "Enable" (calls the existing `toggleTrackMorality(true)`
     handler) and "Dismiss" (calls a new
     `dismissDormantMoralityPrompt(character)` handler that flips
     the dismissal flag).
4. **No storage normalization changes**, no migrations, no validator
   changes, no version bumps.
5. **i18n:** add two new keys:
   - `dormant_morality_body` (EN/ES — body copy per §3.10).
   - `dormant_dismiss` (EN "Dismiss" / ES "Descartar"). The Enable
     button can reuse the existing `sheet_track_morality` /
     `enable_tracking` style — see decision #1 below.
6. **Tests:** the test groups in §9 — pure helpers, sheet rendering,
   round-trip. Plus a regression that brand-new mortals (humanity
   not set) show no prompt.
7. **Out of scope for BI-3-1:** Vitae prompt (BI-3-2), Powers prompt
   (BI-3-3), explicit "Clear" action, print changes, vampire path,
   View Mode prompt, modals.

Acceptance gates for BI-3-1:

- Every existing test still passes.
- Brand-new V5 Human → no prompt.
- Brand-new V20 Ghoul → no prompt.
- Pre-BA Human with `humanity: 7` → prompt appears in Edit Mode
  inside the Morality card. "Enable" flips `trackMorality` to true
  and reveals the dots-10 tracker with value 7. "Dismiss" sets the
  dismissal flag, hides the prompt, keeps `humanity: 7` on disk.
- After dismissal, reopening the character in Edit Mode shows no
  prompt and no tracker.
- View Mode shows no prompt regardless of state.
- Vampire (V5 + V20) sheets show no prompt under any condition.

Once BI-3-1 is verified, BI-3-2 and BI-3-3 follow the same recipe.

---

## 12 · Risks and decisions needed before implementation

1. **Action button wording / key reuse.** Reuse
   `sheet_track_morality` / `sheet_track_vitae` /
   `sheet_track_ghoul_powers` as the "Enable" button label, OR ship
   one shared `dormant_enable` key. Recommendation: **shared
   `dormant_enable` key** ("Enable" / "Activar") to keep the prompt
   visually distinct from the toggle's own label.
2. **Banner placement inside the card.** Above the toggle (clearest
   relationship to the control) vs. below (less disruptive). The
   audit recommends **above the toggle** — readers see the call to
   action before they see the toggle.
3. **Color / styling.** Reuse an existing pattern (e.g. the inline
   chip / suggestion strip from the discipline UI) to avoid
   introducing a new color token. Audit recommends amber for
   "attention needed but not destructive" — but final colour is a
   design decision at implementation time.
4. **Edit Mode vs always-visible.** Audit recommends Edit Mode only.
   Hard requirement — must not appear in View Mode / print.
5. **Per-character vs global dismissal.** Per-character (§3.5). Hard
   requirement — global would erase legitimate decisions about other
   characters.
6. **Whether to ship `hasDormantHumanity` as a separately exported
   pure helper.** Audit recommends **yes**, in a new
   `src/utils/dormantData.ts`. Makes the predicate independently
   testable and lets BI-3-2 / BI-3-3 reuse the same module pattern.
7. **Whether to gate the prompt on Edit Mode only OR on Edit Mode +
   user-not-already-in-progress-typing.** Recommendation: Edit Mode
   only — the prompt is a passive banner, not a popup, so it doesn't
   interrupt typing.

None of these block the audit. All seven can be settled when
BI-3-1 starts.

---

## 13 · Dark Pack / copyright safety notes

- BI-3-1 introduces no rules text, no per-system mechanics
  description. The prompt body is purely a UX explainer ("This
  character has stored Humanity data. Track it on this sheet?") — it
  does not say *what Humanity is* or *how it works*.
- Two new i18n keys per phase. All are short noun phrases or simple
  questions; no rulebook prose, no licensed terminology beyond the
  word "Humanity" / "Vitae" / "Powers", which the app has shipped
  since launch in the BE-1 / BG / BI-1 batches.
- No new image assets, no new clan symbols, no new licensed artwork.
- The prompt never asks the user to make a rules decision — only a
  UX decision about visibility.

---

*End of audit. No runtime files were modified in this batch. See §11
for the next-batch entry point.*
