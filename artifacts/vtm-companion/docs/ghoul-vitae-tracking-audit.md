# Ghoul vitae / Blood Pool tracking — audit & planning doc

**Batch BF · audit only · no runtime change**

Follows up on:

- [Batch AW — non-vampire character types audit](./non-vampire-character-types-audit.md)
- [Batch AZ — Human/Ghoul sheet refinement audit](./human-ghoul-sheet-refinement-audit.md)
- [Batch BE — Human/Ghoul morality tracking audit](./human-ghoul-morality-tracking-audit.md)

after AX (kind discriminator + creation), AY (basic mortal schemas),
BA (print/storage cleanup + Kind filter), BB (sheet identity
refinement), BC (kind-aware generator content), BD (ghoul regnant
identity / ES terminology), BE-1 (opt-in morality toggle) and BE-2
(opt-in morality print parity) shipped.

This batch answers a single product question: **should Ghouls (and,
defensively, Humans) carry a Blood Pool / vitae tracker, and if so
how?** No runtime files are touched.

Audience: future batch authors. Every finding cites a file and a
symbol so the next batch can act without re-running the survey.

---

## 1 · Current behavior (post-Batch BE-2)

### Storage (`src/services/characterStorage.ts`)

- `createEmptyCharacter`: only seeds `bloodPool: { current: 10, max: 10 }`
  when `isVampire` ([:444](src/services/characterStorage.ts:444)).
  Brand-new V20 / Revised / 2ND / 1ST ghouls and humans never carry the
  field.
- `getCharacters` normalization: preserves any pre-existing
  `bloodPool` object on a classic character regardless of kind, and
  only injects the legacy 10/10 default when `isClassicVampire`
  ([:316-320](src/services/characterStorage.ts:316)). This means
  pre-Batch-BA ghouls / humans created via the old vampire-shaped
  pipeline can still carry a dormant `{ current: 10, max: 10 }` on
  disk that is hidden by the schema (since AY-era mortal schemas
  drop the field) and hidden by print (since BA's `cl?.bloodPool`
  branch is also gated on `isVampire` —
  [CharacterPrintView.tsx:490](src/components/character/CharacterPrintView.tsx:490)).

### Types (`src/types/index.ts`)

- `ClassicCharacter.bloodPool?: { current: number, max: number }`
  ([:424](src/types/index.ts:424)) — already optional since Batch BA.
  V5 has **no** equivalent on `V5Character`; V5 vampires use
  `hunger?: number` ([:360](src/types/index.ts:360)) which is a
  different mechanic entirely (a 0–5 deprivation track, not a 0–N pool).

### Sheet (`src/data/characterSheets/`)

- `classic.ts` vampire schema exposes
  `{ id: 'bloodPool', labelKey: 'sheet_blood_pool', type: 'special-health', special: 'bloodPool', gameplay: true }`
  in the `other_traits` section
  ([classic.ts:743](src/data/characterSheets/classic.ts:743)).
- `humanClassicSchema` and `ghoulClassicSchema` omit the field
  entirely ([ghoul.ts:29](src/data/characterSheets/ghoul.ts:29) is a
  re-export of `humanClassicSchema`).
- `DynamicSheet` renders the field via the
  `'special-health'` + `field.special === 'bloodPool'` branch
  ([DynamicSheet.tsx:1342-1370](src/components/character/DynamicSheet.tsx:1342))
  using `ClassicPoolTracker`. Vampires default to `max = 20`
  (Generation-1) when the stored shape is a bare number — ghouls
  would conceptually want a much smaller cap (the rulebooks land
  somewhere in the 1–3 dot range for most ghouls, more for those
  bonded to elder vampires; **the app intentionally does not encode
  any specific number — that's a rules-text surface and the audit
  defers it**).

### Print (`src/components/character/CharacterPrintView.tsx`)

- Blood Pool row pushed only when `!isV5 && isVampire && cl?.bloodPool`
  ([:490](src/components/character/CharacterPrintView.tsx:490)). Uses
  the `PrintBloodPoolDrops` SVG component with a 10-drop max.
- Ghouls and humans never print a Blood Pool row regardless of stored
  state — locked in by Batch BA tests at
  [CharacterPrintSections.test.tsx:544-548](src/components/character/__tests__/CharacterPrintSections.test.tsx:544).

### Export / import (`src/services/characterStorage.ts`)

- Validators check `name`, `edition`, `clan`. Nothing about
  `bloodPool`. Round-trip is lossless via
  `JSON.parse(JSON.stringify(char))` in `buildCharacterBackup`
  ([:666](src/services/characterStorage.ts:666)).
- No version bump would be required for any of the options below.

### i18n (`src/i18n/ui.ts`)

- `sheet_blood_pool` — EN "Blood Pool", ES "Reserva de Sangre"
  ([:400 / :918](src/i18n/ui.ts:400)). Used by both the live sheet and
  print.

### Net result

Vampires keep their full Blood Pool experience (sheet, print,
dormant-aware storage). Humans and Ghouls render no Blood Pool row on
sheet or in print regardless of dormant data. Storage carries the
field for any pre-Batch-BA mortal that was created via the old
vampire-shaped pipeline, but the app never surfaces those values
today.

**This is the cleanest starting point we can ask for.** The audit's
job is to decide whether to surface a vitae tracker for ghouls (and
explicitly reject it for humans), never to "fix" the silence.

---

## 2 · V20 / classic considerations

Ghouls in the V20 / Revised / 2ND / 1ST family of rules carry a
vampire-derived vitae reserve when bonded to a regnant. The reserve
is mechanically similar to vampire Blood Pool — spent to fuel
disciplines and physical exertion — but cap and refill mechanics
differ:

- **Cap is much smaller** than a vampire's. Mortal-bond ghouls land
  in the very low single digits; ancient-bond ghouls can carry more.
  The app **must not encode any specific number** — that's rules text
  and a Dark Pack tripwire. Make the cap user-editable, just like the
  existing `ClassicPoolTracker` already does for vampires.
- **Refill model is not "Rouse" or "feed"** — ghouls regain vitae by
  receiving it from the regnant. The app does not need to model the
  refill; it just needs to store a value the user can edit.
- **Bond intensity affects mechanics** at the table, but again that's
  rules-text territory. The app should expose a free-text current/max
  pair and let the Storyteller / player decide what it means at their
  table.

Practical implication: V20 ghouls SHOULD get a tracker. The shape is
nearly identical to the existing `ClassicPoolTracker` — only the
default `max` differs (vampires get 10–20 inferred from Generation;
ghouls should default to a small explicit number that the user can
edit on the fly).

---

## 3 · V5 considerations

V5 reworked vampires from "Blood Pool" to "Hunger" (a 0–5 deprivation
track) and Blood Potency (a 0–10 power tier). Neither maps cleanly
onto a ghoul.

Two product positions, each defensible:

### Position 3a — No V5 vitae tracker for ghouls (recommended)

V5 ghouls play closer to "favored mortals with a power or two" than
to "vampires with a reserve". The chronicle scaffolding around Stains
/ Remorse / Touchstones is also vampire-only in V5. A V5 ghoul who
needs to spend vitae is rare and table-dependent enough that a single
"Vitae" textarea note (which the user can already record in the
journal section, which BD shipped) covers the long tail.

### Position 3b — Optional generic vitae tracker for V5 ghouls

Same shape as the V20 tracker. Off by default. Available via an
opt-in toggle. Same `ClassicPoolTracker` visual (`droplet`) reused on
a V5 sheet — which is a minor consistency break (V5 doesn't use that
visual elsewhere) but inside the "ghoul" namespace it reads as the
ghoul's own tracker, not a vampire mechanic bolted on.

### Recommendation: **3a for BF-1; revisit only if users ask**

V5 ghouls get **no** tracker in the first ghoul-vitae batch. Saves us
from designing a V5-specific visual / data shape under uncertainty,
and avoids the temptation to copy V20 numbers wholesale onto a V5
sheet. We can graduate to 3b later via the same opt-in toggle pattern
we built for morality in BE-1.

---

## 4 · Human characters

No tracker. Ever. Humans in V20 don't carry vampiric vitae by
construction — surfacing the field on a human sheet would imply a
mechanic the rules don't grant them and would be a Dark Pack
tripwire. The existing tests at
[CharacterPrintSections.test.tsx:544-548](src/components/character/__tests__/CharacterPrintSections.test.tsx:544)
already lock the print side; the BF-1 implementation should add an
equivalent regression on the live-sheet side.

If a future batch ever wants a "mortal under blood bond" sheet, that
character should be modelled as a `kind: 'ghoul'` (or a new
`kind: 'bonded-mortal'` discriminator), not by relaxing humans.

---

## 5 · Audit answers — direct responses to the brief

1. **Should Ghouls have a Blood Pool / vitae tracker in V20 / classic?**
   **Yes — opt-in by default; ship the toggle in BF-1.** Once on, the
   tracker renders the existing classic blood-drop visual with a
   user-editable current/max pair. Default `max` when first enabled:
   3 (small, clearly not a vampire number, easy to bump up). Default
   `current` when first enabled: equal to `max` (full reserve, as
   recently received from regnant — narratively neutral starting
   point).
2. **Should Ghouls have any equivalent vitae tracker in V5?**
   **No, for BF-1.** Defer per §3. Revisit if a real user requests it.
3. **Should Human characters ever have this tracker?**
   **No, ever.** See §4. Add live-sheet regression tests in BF-1 to
   match the BA print regression.
4. **Name?**
   The audit prefers **"Vitae"** for ghouls — distinct from
   "Blood Pool" (vampire label) without inventing new copyright
   surface. Edition-aware: V20 ghouls see "Vitae" in EN and
   "Vitae" in ES (the Latin term is identical in both languages and
   matches the existing `sheet_resonance` "Resonance / Resonancia"
   precedent of keeping a loanword loanword). BF-1 adds one new i18n
   key: `sheet_vitae` (EN "Vitae", ES "Vitae"). Why **not**
   "Regnant Vitae" / "Vitae reserve" — those phrasings imply specific
   rules-text framings; the bare "Vitae" stays neutral.
5. **Edition-specific?**
   Yes — classic only. V5 ghouls do not get the field per §3.
6. **Always visible vs opt-in?**
   **Opt-in via a per-character `trackGhoulVitae?: boolean` toggle.**
   Default off. Same pattern as BE-1's `trackMorality`. Rationale:
   not every table runs ghoul vitae mechanically; tables that don't
   should not see the tracker.
7. **Default / max?**
   When the toggle flips on for the first time, seed
   `bloodPool: { current: 3, max: 3 }`. **3 is the most neutral
   "small ghoul reserve" the app can offer without invoking specific
   tier text.** The user can edit both numbers freely.
8. **Visual — same blood drops as vampires, or distinct?**
   **Reuse the existing `ClassicPoolTracker` blood-drop visual.** It
   already supports a user-editable max, and reusing it keeps the
   binary asset / SVG footprint at zero. The visual is
   widely-understood "vitae" iconography, not a vampire-only mark.
   The sheet header already pills the character as "Ghoul" (Batch
   AZ), so the tracker reads correctly in context.
9. **Should it print?**
   **Yes when the toggle is on.** Mirror the BE-2 print contract:
   only print the row when `trackGhoulVitae === true`, never expose
   the toggle in print, use the same `PrintBloodPoolDrops` SVG.
10. **Export / import?**
    **Yes, with zero validator changes.** Both `bloodPool` and
    `trackGhoulVitae` ride through the existing JSON envelope. No
    `EXPORT_VERSION` / `BACKUP_VERSION` bump. Pre-BF clients ignore
    the new flag; BF clients treat absent flag as `false`.
11. **New field or reuse existing `bloodPool`?**
    **Reuse `bloodPool`.** The field is already on `ClassicCharacter`
    as optional. The data shape (`{ current, max }`) is identical to
    what the vampire branch uses. The new `trackGhoulVitae?: boolean`
    flag controls visibility — exactly mirroring the BE-1
    `trackMorality` / `humanity` split.
12. **Old Ghoul records with dormant `bloodPool` values?**
    **Preserve, do not expose.** Same contract as BE-1's dormant
    humanity. `getCharacters` already preserves the value verbatim.
    The sheet should NOT auto-show the dormant reserve when the
    toggle is off. **A one-time inline prompt is out of scope for
    BF-1** — defer to a future polish batch (call it BF-2, alongside
    or after the BE-2 follow-up dormant-data prompt). For BF-1, the
    user opts in manually; on opt-in, the existing dormant value is
    preserved verbatim (do **not** overwrite it with the 3/3 seed).
13. **What should be deferred until Ghoul Disciplines / Powers and
    Regnant linking are implemented?**
    - Spending vitae to fuel a discipline (no UI plumbing for the
      cost; the user adjusts the pool manually).
    - Receiving vitae from a linked regnant character (no link
      between the ghoul's `bloodPool` and the regnant character's
      `bloodPool` until regnant-character linking ships).
    - Bond-intensity mechanics, vinculum dots, or any "blood bond"
      tier on the sheet — all out of scope for BF-1.
    - Generation-derived caps. Vampires read their max from
      Generation; ghouls do not, in this app. Keep the cap a free
      user-editable number.

---

## 6 · Data model options

### Option D1 — Per-character `trackGhoulVitae?: boolean` on `BaseCharacter` (recommended)

```ts
interface BaseCharacter {
  …existing fields…
  /**
   * Batch BF-1 — per-character toggle for the optional Vitae tracker
   * on Ghoul sheets (classic editions only). Defaults to false when
   * absent. Has no effect on `kind === 'vampire'` (vampires always
   * show Blood Pool via the schema) or `kind === 'human'` (humans
   * never get a vitae tracker, period).
   */
  trackGhoulVitae?: boolean;
}
```

- Visibility flag lives on `BaseCharacter` so it survives any future
  edition / kind plumbing without resurfacing this audit.
- The `bloodPool` data shape stays on `ClassicCharacter` exactly as
  today (`{ current: number, max: number }`).
- Normalization in `getCharacters` does **not** auto-set the flag,
  even for ghouls that carry dormant `bloodPool` data.

### Option D2 — Schema-level field in `ghoulClassicSchema` (rejected)

Add a `'special-health'`+`special: 'bloodPool'` field to
`ghoulClassicSchema`. Rejected because:
- The visibility decision is per-character (opt-in), not per-schema.
  Tables that don't run ghoul vitae would have to live with a row
  they don't want.
- Exposes the dormant `bloodPool: { current: 10, max: 10 }` data
  Batch BA neutralized — violates the "don't surface dormant data
  without user consent" principle.

### Option D3 — Edition-keyed default in `getCharacters` (rejected)

"If `kind === 'ghoul'` and edition is classic, seed
`bloodPool: { current: 3, max: 3 }` on read."

Rejected because:
- Re-introduces a normalization seed Batch BA removed.
- Conflates "I am a ghoul" with "I want to track vitae" — those are
  separate decisions.

### Recommendation: **D1**

Smallest surface, fully additive, no migration. Identical pattern to
BE-1's `trackMorality` so reviewers and future contributors
recognize it on sight.

---

## 7 · UI / sheet options

### UI option U1 — Mortal-only Vitae card after Morality (recommended)

Reuse the BE-1 placement pattern. The mortal Morality card sits right
after Basic Info ([DynamicSheet.tsx — Batch BE-1 polish](src/components/character/DynamicSheet.tsx)).
The Vitae card sits right after the Morality card and renders only
for **classic-edition ghouls**:

- When the toggle is off → the card shows just the
  `sheet_track_ghoul_vitae` label + Switch.
- When the toggle is on → the card shows the toggle plus the existing
  `ClassicPoolTracker` rendering of `bloodPool` (current/max
  editable, blood-drop visual).

Why a separate card rather than co-locating with Morality:
- Different rules-domain (morality is universal-Storyteller-system,
  vitae is ghoul-specific). Conflating them would imply they always
  ship together, which they don't.
- Mirrors how Humans never see the card at all (their sheet ends at
  the Morality card and continues to the schema sections).

### UI option U2 — Inline in the existing Trackers / Other Traits section (rejected)

Inject the `bloodPool` field into the existing classic trackers
section when the toggle is on, mirroring the BE-1 *original*
implementation that was later moved out (see BE-1 placement fix).
Rejected for the same reason: the toggle is a per-character config,
not a per-section field, and surfacing the toggle inside Trackers
would clutter the trackers row on opt-out ghouls.

### UI option U3 — Sheet-level controls area (rejected)

Same anti-pattern called out in the BE-1 placement fix. Don't put a
per-character feature toggle next to "Collapse all".

### Recommendation: **U1**

Card after Morality. Classic ghouls only. V5 ghouls render nothing.
Humans render nothing. Vampires render nothing.

---

## 8 · Print / PDF implications

Mirror the BE-2 contract for the Blood Pool row in
[CharacterPrintView.tsx:490](src/components/character/CharacterPrintView.tsx:490):

```tsx
- } else if (!isV5 && isVampire && cl?.bloodPool) {
+ } else if (!isV5 && isVampire && cl?.bloodPool) {
+   // (vampire branch, unchanged)
+ } else if (
+   !isV5 &&
+   kind === 'ghoul' &&
+   character.trackGhoulVitae === true &&
+   cl?.bloodPool
+ ) {
    // Print the ghoul vitae row using the same drop SVG but the
    // ghoul-specific `sheet_vitae` label.
  }
```

Key invariants:

- Vampire path is byte-for-byte unchanged.
- The mortal branch uses a new `sheet_vitae` label, not
  `sheet_blood_pool`. (Labels are the *only* surface where "this is
  ghoul vitae, not vampire blood" reads through to the print sheet.)
- Humans never enter either branch.
- V5 ghouls never enter either branch.
- A dormant `bloodPool` on a `trackGhoulVitae !== true` ghoul does
  NOT print.

Visual: reuse `PrintBloodPoolDrops` with the same 10-drop max.
Smaller real-world vitae caps still read correctly on the 10-drop
strip because `buildClassicPoolBoxes` clamps to max.

---

## 9 · Export / import implications

- **No `EXPORT_VERSION` bump, no `BACKUP_VERSION` bump.** Adding an
  optional boolean and continuing to round-trip the existing
  `bloodPool` field is purely additive.
- **No validator changes.** `validateCharacterExport` /
  `validateCharacterBackup` keep checking name / edition / clan
  ([characterStorage.ts:594-617](src/services/characterStorage.ts:594)).
- Cross-version compat:
  - Pre-BF client reads a BF export of a ghoul with
    `trackGhoulVitae: true` and `bloodPool: { current: 2, max: 3 }`:
    `bloodPool` loads but is suppressed because pre-BF
    `getCharacters` normalization only injects classic Blood Pool
    for vampires; the unknown `trackGhoulVitae` is ignored. The data
    survives the round trip in the JSON envelope.
  - BF client reads a pre-BF backup of a ghoul with dormant
    `bloodPool: { current: 10, max: 10 }`: see §10.

---

## 10 · Backward compatibility — dormant `bloodPool` data

Pre-Batch-BA ghouls (and pre-AX "ghouls who were vampires") may have
`bloodPool: { current: 10, max: 10 }` on disk from the time when
ghouls were created via the vampire pipeline. Today the schema and
print both ignore it. BF-1 must continue to ignore it **unless the
user opts in.**

Contract:

| Stored shape | Toggle | Sheet | Print |
|---|---|---|---|
| `bloodPool` absent, no toggle | `undefined` | no card body | no row |
| `bloodPool` absent, toggle `false` | `false` | toggle visible, no body | no row |
| `bloodPool` absent, toggle `true` | `true` | toggle + tracker (seeds `{ current: 3, max: 3 }`) | row prints |
| `bloodPool: { current: 10, max: 10 }`, no toggle | `undefined` | no card body | no row |
| `bloodPool: { current: 10, max: 10 }`, toggle `false` | `false` | toggle visible, no body | no row |
| `bloodPool: { current: 10, max: 10 }`, toggle `true` | `true` | toggle + tracker (preserves stored 10/10) | row prints |
| `bloodPool: { current: 2, max: 3 }`, toggle `true` | `true` | preserves stored 2/3 | row prints |

The seeding rule is the BE-1 rule, mirrored: **seed
`{ current: 3, max: 3 }` only when the toggle flips on AND no
`bloodPool` object already exists**. A dormant 10/10 is never
overwritten by the seed.

A one-time inline dormant-data prompt (matching the BE-1 audit
recommendation for Humanity) is out of scope for BF-1. Defer to a
future polish batch — possibly batched with the equivalent morality
prompt so we ship one prompt experience covering both cases.

---

## 11 · Testing strategy

### Schema / data invariants

- `humanV5Schema`, `humanClassicSchema`, `ghoulV5Schema`,
  `ghoulClassicSchema` continue to **not** contain a `bloodPool`
  field (the toggle layer lives above the schema). Lock in via the
  existing `getSchemaForCharacter.test.ts` audit pattern.
- `createEmptyCharacter('V20', '', 'X', 'ghoul')` continues to
  return an object with no `bloodPool` and no `trackGhoulVitae`.
  No dormant data is auto-injected.
- `getCharacters` normalization preserves dormant `bloodPool` on a
  ghoul; does NOT auto-set `trackGhoulVitae`.

### Sheet rendering

- **Vampires (V5 + V20)** render no Vitae card. Their existing Blood
  Pool field is unchanged in the schema-driven `other_traits`
  section.
- **Humans (any edition)** render no Vitae card. Even with a
  hand-stamped `trackGhoulVitae: true`, the card stays hidden
  (visibility is gated on `kind === 'ghoul'`).
- **V5 ghouls** render no Vitae card per §3.
- **V20 ghouls** with no toggle → card with just the toggle, no
  tracker.
- **V20 ghouls** with `trackGhoulVitae: true` and dormant
  `bloodPool: { current: 10, max: 10 }` → card with toggle + tracker
  showing 10/10.
- **V20 ghouls** with `trackGhoulVitae: true` and no `bloodPool` →
  card with toggle + tracker showing 3/3 (seeded on opt-in).
- Toggling off preserves `bloodPool`; toggling on a second time
  reuses the preserved value.
- Toggle is disabled in View Mode (mirrors BE-1's `readonly` check).

### Print

- V5 ghouls never print Vitae.
- V20 ghouls with no toggle never print Vitae, even with dormant data.
- V20 ghouls with toggle true print a Vitae row using
  `sheet_vitae`, not `sheet_blood_pool`.
- Humans never print Vitae.
- Vampires print the existing Blood Pool row using
  `sheet_blood_pool` — byte-for-byte identical to pre-BF.

### i18n

- `sheet_vitae` EN + ES present and stable.

### Storage round-trip

- A ghoul with `trackGhoulVitae: true` and
  `bloodPool: { current: 2, max: 3 }` survives a JSON envelope
  round-trip.

---

## 12 · Recommended implementation phases

| Phase | Scope | Risk | Approx. files |
|---|---|---|---|
| **BF-1 — Toggle data + V20 ghoul sheet card** (next batch — see §13) | Add `trackGhoulVitae?: boolean` to `BaseCharacter`. Render a classic-ghoul-only Vitae card after the Morality card. Reuses `ClassicPoolTracker`. Seeds `{ current: 3, max: 3 }` on opt-in if no stored value. Adds `sheet_vitae` + `sheet_track_ghoul_vitae` i18n strings (EN + ES). | Low — strictly additive, opt-in. | ~5–7 |
| **BF-2 — Print parity + dormant-data prompt** | Mirror BE-2: add the print branch gated on `trackGhoulVitae === true`. Add the one-time inline prompt for ghouls with dormant `bloodPool` (consider co-shipping with the BE-1 humanity dormant prompt as a single prompt experience). | Low | ~2–3 |
| **Future — Ghoul disciplines / powers + regnant linking** | Not BF's concern. The Vitae toggle composes cleanly with these because nothing wires the pool to a discipline cost or to a regnant in BF-1. | Medium — separate audit. | not scoped here |

Phases BF-1 and BF-2 are independently shippable; BF-2 depends on
BF-1's flag.

---

## 13 · Recommended next implementation batch

**Batch BF-1 — opt-in Vitae tracker for classic ghouls (data + sheet only).**

Scope it explicitly to:

1. **Type:** add `trackGhoulVitae?: boolean` to `BaseCharacter` in
   [types/index.ts](src/types/index.ts). Document that it has no
   effect on vampires (their Blood Pool is schema-driven) and no
   effect on humans (no vitae, ever) or V5 ghouls (deferred per §3).
2. **Storage:** no normalization changes in `getCharacters`. No
   defaults injected. The flag rides through `JSON.parse(JSON.stringify(char))`
   in backup / export.
3. **Sheet card:** add a mortal-only card that renders right after
   the BE-1 Morality card. The card:
   - Shows only the toggle when `trackGhoulVitae !== true`.
   - Shows toggle + `ClassicPoolTracker` (reusing the existing
     blood-drop visual) when `trackGhoulVitae === true`.
   - Only renders when `kind === 'ghoul'` AND `edition !== 'V5'`.
4. **Toggle handler:** on flip-on, if no `bloodPool` value exists,
   seed `{ current: 3, max: 3 }`. If one already exists (dormant or
   user-set), preserve it.
5. **i18n:** add `sheet_vitae` (EN "Vitae", ES "Vitae") and
   `sheet_track_ghoul_vitae` (EN "Track vitae", ES "Registrar vitae")
   in `ui.ts`.
6. **Tests:** the test groups in §11 — schema invariants, default-off,
   dormant-data, enable/disable, vampire compatibility, human
   exclusion, V5 ghoul exclusion, View-Mode lock, EN/ES, JSON
   round-trip.
7. **Out of scope for BF-1:** print view (BF-2), dormant-data inline
   prompt (BF-2), regnant linking, disciplines, vinculum tier,
   Generation-derived caps.

Acceptance gates for BF-1:

- Every existing test still passes.
- Creating a V20 ghoul → no `trackGhoulVitae`, no `bloodPool`, no
  Vitae card body.
- Toggling on a V20 ghoul with no dormant data → "Vitae" tracker
  appears with 3/3, fully editable. Edit, save, reload — value
  persists.
- Toggling on a V20 ghoul with dormant `bloodPool: { current: 10, max: 10 }`
  → preserved verbatim, NOT overwritten by 3/3.
- Toggling off → tracker hidden, `bloodPool` value preserved on
  storage, re-enabling restores the same value.
- V5 ghoul, V5 human, V20 human, V5 vampire, V20 vampire — no Vitae
  card, no behavior change.

Once BF-1 is verified, BF-2 wires up print parity (mirroring BE-2)
and the dormant-data inline prompt.

---

## 14 · Risks and decisions needed before implementation

1. **Label choice.** "Vitae" vs "Blood Pool" vs "Regnant Vitae" vs
   "Vitae reserve". Recommendation: **"Vitae"** (per §5 answer 4).
   Stays distinct from the vampire label without inventing rules
   text. Single i18n string; same in EN and ES.
2. **Default `{ current, max }` on opt-in.** "3/3" vs "1/1" vs
   leaving the user to set both. Recommendation: **3/3** — a
   neutral small number that reads as "you have a few points" and
   keeps the tracker visually non-empty on first reveal.
3. **V5 ghoul vitae.** Punt now, build later. Recommendation:
   **Punt** (§3). Easy to add later via the same toggle.
4. **Whether to share the toggle with BE-1's `trackMorality`.**
   Tempting to bundle them into a single "Optional trackers" submenu.
   Recommendation: **keep them separate flags**, but the *cards* can
   sit next to each other in the sheet so the visual story reads as
   "optional ghoul knobs live here".
5. **Whether to ship the dormant-data prompt with BF-1.**
   Recommendation: **defer to BF-2**, possibly co-shipping with the
   BE-1 humanity prompt as a single unified prompt experience.
6. **Future regnant linking.** Designed-out for BF-1 — the pool is a
   free user-editable number. If a future batch links a ghoul to a
   regnant character record, the regnant's `bloodPool` can be used
   as a hint for the ghoul's max but should not be wired in
   automatically (Storyteller preference).

None of these block the audit. All six can be settled when BF-1
starts.

---

## 15 · Dark Pack / copyright safety notes

- BF-1 introduces **no rules text, no tables, no Hierarchy of Sin
  equivalents, no licensed discipline lists.** Surfaces a 0–10 dot
  pool the user can set freely.
- The new i18n strings are short noun phrases:
  - `sheet_vitae` — EN "Vitae", ES "Vitae"
  - `sheet_track_ghoul_vitae` — EN "Track vitae", ES "Registrar vitae"
  No rulebook prose. The Latin term *vitae* is widely used outside
  any specific game's IP and is the most neutral choice the app can
  ship.
- Reuses the existing `ClassicPoolTracker` blood-drop SVG visual. No
  new image assets, no new clan symbols, no new licensed artwork.
- The mortal Vitae card never describes *what* vitae is or how it
  works — it just stores a value. Defer "what is vitae?" copy to the
  existing Rules / Compendium section, which is already Dark
  Pack–audited.

---

*End of audit. No runtime files were modified in this batch. See §13
for the next-batch entry point.*
