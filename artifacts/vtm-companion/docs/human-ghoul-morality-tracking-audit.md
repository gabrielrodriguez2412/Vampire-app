# Human / Ghoul morality tracking — audit & planning doc

**Batch BE · audit only · no runtime change**

Follows up on:

- [Batch AW — non-vampire character types audit](./non-vampire-character-types-audit.md)
- [Batch AZ — Human/Ghoul sheet refinement audit](./human-ghoul-sheet-refinement-audit.md)

after AX (kind discriminator + creation), AY (basic mortal schemas),
BA (print/storage cleanup + Kind filter), BB (sheet identity refinement),
BC (kind-aware generator content) and BD (ghoul regnant identity / ES
terminology) shipped.

This batch answers a single product question: **should Humans and
Ghouls support Humanity / Morality / Path tracking, and if so, how?**
No runtime files are touched. Phase numbers in this document map to
future implementation batches.

Audience: future batch authors. Every finding cites a file and a
symbol so the next batch can act without re-running the survey.

---

## 1 · Current behavior (post-Batch BD)

### Schema (sheet UI)

| Surface | V5 Vampire | V5 Human / Ghoul | V20 Vampire | V20 Human / Ghoul |
|---|---|---|---|---|
| Humanity field on sheet | ✅ `sheet_humanity` dots-10 ([v5.ts:791](src/data/characterSheets/v5.ts:791)) | ❌ omitted in `humanV5Schema` ([human.ts:88](src/data/characterSheets/human.ts:88)) | ✅ `sheet_humanity_path` dots-10 ([classic.ts:741](src/data/characterSheets/classic.ts:741)) | ❌ omitted in `humanClassicSchema` ([human.ts:199](src/data/characterSheets/human.ts:199)) |
| Ghoul-specific schema | n/a | aliased to `humanV5Schema` ([ghoul.ts:28](src/data/characterSheets/ghoul.ts:28)) | n/a | aliased to `humanClassicSchema` ([ghoul.ts:29](src/data/characterSheets/ghoul.ts:29)) |

### Storage (defaults + normalization)

- `createEmptyCharacter` only seeds `humanity` when `kind === 'vampire'`
  ([characterStorage.ts:415-446](src/services/characterStorage.ts:415))
  — so a brand-new V5 Human / Ghoul has **no** `humanity` key, and a
  brand-new classic Human / Ghoul has **no** `humanity` key.
- `getCharacters` normalization (Batch BA):
  - On read, an existing numeric `humanity` value is **preserved**
    regardless of `kind`
    ([characterStorage.ts:285-289 / :326-330](src/services/characterStorage.ts:285)).
  - A default of 7 is **only** injected when `isVampire`.
  - **Consequence:** Humans / Ghouls created during the AX/AY window
    (before Batch BA stopped seeding) still have a dormant
    `humanity: 7` on disk. They round-trip through save/load with that
    value intact, but the schema never surfaces it on the sheet.
- The `BaseCharacter`-extending interfaces declare `humanity?: number`
  on both `V5Character` and `ClassicCharacter`
  ([types/index.ts:350](src/types/index.ts:350),
  [types/index.ts:412](src/types/index.ts:412)), so the field is
  schema-legal for every kind without forcing it on.

### Print

`CharacterPrintView` (Batch BA, post-Batch BD) gates the Humanity row
on `isVampire`
([CharacterPrintView.tsx:509-518](src/components/character/CharacterPrintView.tsx:509)):

```tsx
if (isVampire) {
  trackerRows.push({
    label: strings.sheet_humanity || "Humanity",
    value: <span className="font-mono">{dotsString((character as { humanity?: number }).humanity || 0, 10)}</span>,
  });
}
```

Humans and Ghouls thus print without a Humanity / Path row, even when
dormant `humanity: 7` lives in storage. Vampires are byte-for-byte
unchanged.

### Export / import

- `validateCharacterExport` and `validateCharacterBackup` (Batch AX
  relaxation, [characterStorage.ts:594-617](src/services/characterStorage.ts:594),
  [:690-713](src/services/characterStorage.ts:690)) check **clan**,
  not **humanity**. The on-disk `humanity` field is preserved through
  every round-trip via `JSON.parse(JSON.stringify(char))`
  ([characterStorage.ts:666](src/services/characterStorage.ts:666)).
- There is no humanity-specific validation rule today, and no version
  bump.

### Net result

- Vampires: identical to pre-BE behavior — Humanity is required, dotted,
  visible on sheet and print, seeded at 7.
- Humans / Ghouls: Humanity is **invisible on sheet, invisible on
  print**, **not seeded for new characters**, but **silently preserved
  in storage** if a legacy AX/AY-era record carries it.

This is the cleanest starting point we can ask for. The audit's job is
to decide whether to surface morality tracking again — never to "fix"
it.

---

## 2 · Desired user-facing behavior — options

Three coherent options. Pick exactly one; mixing creates the worst
of all worlds.

### Option A — No morality tracking on mortals (status-quo, ship nothing)

Mortal sheets keep no Humanity / Morality / Path UI. Storage continues
to preserve any dormant values without surfacing them. Print stays
mortal-clean.

**Pros**
- Zero new code; the audit literally becomes "we considered this and
  declined."
- Cleanest Dark Pack stance — no rules surfaces are described.
- No new product decisions, no new locale strings, no new tests.

**Cons**
- Users who run Humanity-tracking mortal campaigns (Hunters, Mortal
  Coterie chronicles, V20 Sabbat ghouls) lose a fairly common knob.
- The dormant AX/AY `humanity: 7` data on existing humans / ghouls
  silently never gets exposed — users who *did* edit those values
  before Batch BA's print/storage cleanup lose the work.

### Option B — Per-character "Track morality" toggle (recommended)

A discreet header toggle on Human / Ghoul sheets: **"Track morality"**
(default **off**). When on, the sheet exposes a generic morality
tracker — by default labelled with the existing edition-appropriate
label (V5 → `sheet_humanity`, V20 → `sheet_humanity_path`) so we don't
introduce new copyright surface area. The user can edit the value
freely; nothing seeds it but they can set it to whatever their table
runs. Print mirrors the toggle (on → row visible, off → no row).

**Pros**
- Strictly opt-in; default-off preserves the BD-era mortal aesthetic.
- Reuses existing storage field (`humanity?: number`), schema field
  type (`dots-10`), and i18n keys. No new field types, no new
  serialization, no version bump.
- Plays well with the "dormant data on legacy mortals" problem: we
  *don't* auto-expose it; instead we ask the user before turning it on
  (see §9).
- Compatible with future ghoul rules-batch work (Phase 3c per AZ §6) —
  the toggle becomes a no-op "always on for ghouls" once that batch
  introduces a real ghoul morality model, with no migration.

**Cons**
- Adds a per-character flag to storage (`trackMorality?: boolean`) and
  one new toggle to the sheet header.
- Two new i18n keys (toggle label + tooltip), each EN + ES.

### Option C — Always-on generic morality tracker on mortals

Mortal sheets unconditionally expose a generic morality tracker (V5 →
Humanity, V20 → Humanity / Path), seeded at some default
(probably 7 for parity with vampires).

**Pros**
- Symmetrical with vampire UX; no new toggle.

**Cons**
- Forces a rules choice on tables that don't track morality for
  mortals — exactly the situation AW §9 and AZ §5.9 flagged.
- Reintroduces a default on storage we just removed in BA — every new
  V5 Human gets `humanity: 7` again.
- Dormant AX/AY humanity values would suddenly become first-class on
  reload after the update, **without user consent**. This violates the
  "don't turn dormant old data into visible data without user choice"
  constraint in the brief.

### Recommendation: **Option B**

Option B is the only one that:
1. Preserves the current default-off mortal experience the BA → BD
   batches deliberately built;
2. Gives Storytellers who want it a way to track morality on mortals
   without us picking a side on the rules;
3. Stays Dark Pack–safe (no new rulebook text, no per-edition rules
   tables);
4. Avoids surfacing dormant legacy data without consent.

Everything below assumes Option B is the target.

---

## 3 · Audit answers — direct responses to the brief

1. **Should Human characters support Humanity / Morality tracking?**
   Yes — but **opt-in**, not by default. A per-character toggle.
2. **Should Ghoul characters support Humanity / Morality tracking?**
   Yes — same model as Humans for the BE timeframe. A dedicated
   ghoul-rules batch (AZ §6 Phase 3c) may later make it always-on for
   ghouls; BE should not pre-empt that decision.
3. **V5 Humans / Ghouls — Humanity, a generic morality tracker, or
   nothing by default?**
   Default: **nothing**. When opted in: a single 0–10 dot tracker
   labelled with the existing `sheet_humanity` string. Storing the
   value on the existing `humanity?: number` field. No new field, no
   new label.
4. **V20 Humans / Ghouls — Humanity / Path, a generic morality tracker,
   or nothing by default?**
   Default: **nothing**. When opted in: a single 0–10 dot tracker
   labelled with the existing `sheet_humanity_path` string. Same
   storage field as V5 (`humanity?: number` on `ClassicCharacter`). No
   Path-specific UI, no Hierarchies of Sin — the *label* says "Humanity
   / Path" but the app remains rules-agnostic about which is being
   tracked. Storyteller picks. (Dark-Pack-safe: no copied rulebook text.)
5. **Should morality tracking be always visible, hidden by default,
   opt-in, edition-specific, kind-specific?**
   **Opt-in per character.** Available for `kind ∈ {human, ghoul}`
   only; **not** offered for `kind === 'vampire'` (vampires already
   have unconditional Humanity — the toggle would be confusing).
   Edition-specific in label only (V5 vs classic string), not in
   data shape.
6. **Should the tracker be printable?**
   Yes — mirror the toggle. If on, push the existing
   `sheet_humanity` / `sheet_humanity_path` print row (same row the
   vampire path emits today). If off, omit. This is a one-line
   widening of the `isVampire` guard in [CharacterPrintView.tsx:513](src/components/character/CharacterPrintView.tsx:513)
   to `(isVampire || character.trackMorality)`.
7. **Should it interact with existing vampire Humanity fields?**
   **No interaction.** Vampires never get the toggle (it's hidden in
   the editor UI when `kind === 'vampire'`). Storage uses the same
   `humanity?: number` field, but the *read* path for vampires is
   unchanged: `isVampire` still drives the default seed (7) and the
   print row. For humans / ghouls, the field is read only when the
   per-character toggle is on.
8. **New storage fields, or reuse existing?**
   - Reuse `humanity?: number` (already on both `V5Character` and
     `ClassicCharacter`, already optional since Batch BA).
   - Add **one** new optional flag: `trackMorality?: boolean` on
     `BaseCharacter`. Defaults to `false` when absent (humans / ghouls)
     and is ignored for vampires.
9. **What about old Human / Ghoul records with dormant `humanity`
   values from AX/AY?**
   **Preserve, do not expose.** `getCharacters` already preserves the
   stored value. The mortal sheet should NOT auto-show the dormant
   value just because we shipped the toggle. Instead, on the first
   load of the sheet after Batch BE, if `kind ∈ {human, ghoul}` and
   `typeof humanity === 'number'` and `trackMorality === undefined`,
   show a one-time inline hint in the sheet header: *"This character
   has a stored Humanity value (N). Track it on this sheet?"* with
   Yes / Dismiss. Yes → set `trackMorality: true`. Dismiss → set
   `trackMorality: false` (so the prompt doesn't re-appear; the data
   stays in storage in case the user reconsiders by toggling on
   later). This satisfies the brief's "do not turn dormant old
   humanity values into visible data without user choice" rule
   literally.
10. **Risks of adding this before ghoul Blood Pool / ghoul powers?**
    Low. The toggle is orthogonal to Blood Pool and Disciplines —
    enabling morality tracking changes one row on the sheet and one
    row on the print. The future ghoul-rules batch (AZ Phase 3c)
    can graduate the toggle from "user opt-in" to "always on for
    ghouls" with a one-line storage normalization, no migration:
    when `kind === 'ghoul'`, read `trackMorality` as `true` regardless
    of the stored value.

---

## 4 · Data model options

### Option D1 — Per-character flag (`trackMorality?: boolean`) on `BaseCharacter` (recommended)

```ts
interface BaseCharacter {
  …existing fields…
  /**
   * Batch BE — per-character toggle for the optional morality tracker
   * on Human / Ghoul sheets. Defaults to false when absent. Has no
   * effect on vampire characters (their Humanity is always shown).
   * Lets Storytellers run mortals with or without a morality track
   * without committing the app to either rules interpretation.
   */
  trackMorality?: boolean;
}
```

- **Storage:** existing `humanity?: number` field carries the value;
  the new `trackMorality?: boolean` carries the visibility flag.
- **Normalization:** untouched in `getCharacters` — both keys are
  passed through verbatim. No defaults injected for non-vampires.
- **Validation:** no new export rule; the optional boolean rides
  along in the export envelope and is preserved.
- **Backward compat:** A pre-BE client reading a BE backup of a human
  with `trackMorality: true` ignores the flag (it's not in their
  type) but preserves it on round-trip (envelope is JSON-cloned). A
  BE client reading a pre-BE human silently treats `trackMorality`
  as `false`, which is exactly the desired default.

### Option D2 — Schema-level flag on `humanV5Schema` / `humanClassicSchema` (rejected)

A schema field type like `'optional-humanity'` that DynamicSheet
renders only when the field's stored bool is true.

Rejected because:
- Adds a new field type to the DynamicSheet renderer just to gate one
  existing field type — over-abstraction.
- Doesn't generalize to print (which doesn't read schema, it reads
  characters).

### Option D3 — Edition-keyed default in `getCharacters` (rejected)

"For mortals on edition V20, seed `humanity: 7` if absent."

Rejected because:
- Re-introduces the seed Batch BA removed, undoing the dormant-data
  cleanup we just did.
- Makes "do I track Humanity?" a global config instead of a per-
  character decision, the opposite of what Storytellers want.

### Recommendation: **D1**

Smallest possible surface, fully additive, zero migration, plays well
with both opt-in (Phase BE) and the future ghoul-rules batch.

---

## 5 · UI options

### UI option U1 — Sheet header toggle (recommended)

On the Human / Ghoul sheet header, next to the Kind pill, render a
small switch labelled `sheet_track_morality` (e.g. "Track Humanity"
on V5, "Track Humanity / Path" on classic). Default off. When on:

- A new Humanity / Path field appears in the existing **Trackers**
  section, using the existing dots-10 renderer and the existing
  `sheet_humanity` / `sheet_humanity_path` strings.
- The CSS / layout reuses the vampire path 1:1; we are not designing
  a new tracker visual.
- When off: no row, no input, no header decoration besides the
  toggle itself.

### UI option U2 — Modal in the create / edit dialog (rejected)

Adding a "Track morality?" radio to the new-character dialog. Rejected
because Storytellers commonly enable it mid-chronicle ("this NPC just
became important"), and locking it to creation would force a delete /
recreate.

### UI option U3 — Inline-add affordance ("+ Add tracker") (deferred)

A generic "+ Add tracker" mortal-sheet affordance that opens a small
menu (Track morality / Track sanity / Track tilts / …). Strictly
larger scope; punt until we know users want more than one optional
tracker.

### Recommendation: **U1**

One toggle, default off, exposes a single existing field. Smallest
possible UX surface area; reversible.

---

## 6 · Print / PDF implications

`CharacterPrintView.tsx` (Batch BA → BD) currently gates Humanity on
`isVampire`. The Phase BE change is:

```tsx
- if (isVampire) {
+ if (isVampire || character.trackMorality) {
    trackerRows.push({
      label: isV5 ? strings.sheet_humanity : strings.sheet_humanity_path,
      value: <span className="font-mono">{dotsString(humanity || 0, 10)}</span>,
    });
  }
```

Notes:

- The vampire branch keeps using `strings.sheet_humanity` regardless
  of edition because that's what it does today; we only need the
  `_path` variant when the mortal opts in on V20. (Vampires on V20
  *also* historically take Path; that's a pre-existing label
  decision, not BE's to revisit.) **Defer the V20 vampire label
  question** — don't lump it into this batch.
- No new print components, no new layout, no new PDF assets.
- The "Human" / "Ghoul" kind pill in the print header (introduced in
  Batch BA) is unaffected.

---

## 7 · Export / import implications

- No `EXPORT_VERSION` bump, no `BACKUP_VERSION` bump. Both are
  permitted to stay at 1 because:
  - `humanity?: number` is already exported / imported losslessly.
  - `trackMorality?: boolean` is an additive optional field; a missing
    value parses cleanly as `undefined` → `false`.
- No new validator rules. `validateCharacterExport` /
  `validateCharacterBackup` continue to check name / edition / clan
  only.
- Cross-version compat:
  - Pre-BE client reads BE export of a human with
    `trackMorality: true` and `humanity: 5`: the human loads with
    `humanity` preserved but the toggle is ignored (the pre-BE schema
    has no place for it). On save, the pre-BE client preserves the
    field through the JSON-clone envelope, so re-exporting and
    re-importing on a BE client lights the toggle back up. **Lossless
    round-trip.**
  - BE client reads pre-BE export of a human with dormant
    `humanity: 7`: see §3 answer 9 — the first-load inline hint asks
    the user.

---

## 8 · Backward compatibility concerns

| Concern | Likelihood | Mitigation |
|---|---|---|
| Dormant AX/AY `humanity` values surface unexpectedly | Medium | Inline hint on first sheet load asks the user (§3 answer 9). |
| Vampire Humanity behavior changes | Zero | The `isVampire` arm of every relevant branch stays byte-for-byte identical; we only widen the *humans / ghouls* guard. |
| `trackMorality: true` exported but humanity missing | Possible | Sheet renders the tracker with `humanity ?? 0`; user can edit. No crash. |
| Per-character toggle stored on `BaseCharacter` accidentally surfaces on `vampire` characters | Low | Sheet header only renders the toggle for `kind ∈ {human, ghoul}`. Vampire reads / writes never touch the flag. |
| Pre-BE client opens BE backup | Always (for users on stale builds) | Additive field; ignored on pre-BE clients; preserved on round-trip. |
| Future ghoul-rules batch makes the toggle redundant | High (by design) | The future batch can either remove the toggle for ghouls (make it always on) or hide it; either way the data shape doesn't change. |

No migration is required at any phase.

---

## 9 · Testing strategy

### Unit / integration

- `getSchemaForCharacter` test (extends [getSchemaForCharacter.test.ts](src/data/characterSheets/__tests__/getSchemaForCharacter.test.ts)):
  - Human / Ghoul schemas still **do not** include a Humanity field in
    the schema itself — the toggle layer lives above the schema, not
    inside it. Locks in that we didn't accidentally reintroduce a
    schema-level Humanity.
- `createEmptyCharacter` test (extends [createEmptyCharacterKind.test.ts](src/services/__tests__/createEmptyCharacterKind.test.ts)):
  - New V5 Human → no `trackMorality` key, no `humanity` key.
  - New V20 Ghoul → no `trackMorality` key, no `humanity` key.
  - New vampire (V5 + classic) → unchanged (still no `trackMorality`,
    still `humanity: 7`).
- `getCharacters` normalization test (extends [characterStorage.test.ts](src/services/__tests__/characterStorage.test.ts)):
  - Pre-BE human with dormant `humanity: 7` → loads with
    `humanity: 7` preserved, `trackMorality` undefined. (No auto-set
    to true.)
  - Vampire with `humanity: 7` → unchanged.
- Sheet renderer (`DynamicSheet`) test:
  - Human sheet, `trackMorality === undefined` → no Humanity input
    rendered.
  - Human sheet, `trackMorality === true`, `humanity === 4` → exactly
    one dots-10 Humanity input rendered with value 4.
  - Vampire sheet ignores `trackMorality` entirely.
- Print view (extends [CharacterPrintView.test.tsx](src/components/character/__tests__/CharacterPrintView.test.tsx)):
  - V5 Human + `trackMorality: false` → no Humanity row.
  - V5 Human + `trackMorality: true` + `humanity: 5` → exactly one
    Humanity row with dots-10 = 5.
  - V20 Ghoul + `trackMorality: true` → row labelled
    `sheet_humanity_path`.
  - V20 / V5 vampire → identical to pre-BE output.
- Backup round-trip:
  - Export / import a human with `trackMorality: true` and `humanity: 6`
    → both fields survive losslessly.
  - Pre-BE backup containing a human with dormant `humanity: 7` →
    imports cleanly; `trackMorality` stays undefined.

### Manual QA

- Toggle on / off on a Human and a Ghoul, verify sheet and print
  mirror.
- Switch edition on a human (V5 → V20) with `trackMorality: true` →
  label changes from "Humanity" to "Humanity / Path".
- Open a pre-BE legacy mortal with dormant `humanity: 7` → inline
  hint appears; both Yes and Dismiss paths persist correctly.
- Vampire QA spot check: open any vampire (V5 + V20), confirm
  Humanity unchanged on sheet and print.

---

## 10 · Recommended implementation phases

| Phase | Scope | Risk | Approx. files |
|---|---|---|---|
| **BE-1 — Toggle data + sheet** (next batch — see §11) | Add `trackMorality?: boolean` to `BaseCharacter`. Render an opt-in toggle on Human / Ghoul sheet header. When on, expose the existing Humanity / Path field in the Trackers section. No new field types, no new locale strings beyond toggle label + tooltip. | Low — strictly additive, opt-in. | ~5–7 |
| **BE-2 — Print parity + dormant-data prompt** | Mirror the toggle in `CharacterPrintView`. Show the one-time inline hint for legacy mortals with dormant `humanity`. | Low | ~2–3 |
| **Future — Ghoul rules batch** (AZ §6 Phase 3c, not BE's job) | Replace the per-character toggle for ghouls with a rules-aware default-on (and possibly a regnant-linked Path notion). | Medium | not scoped here |

Phases BE-1 and BE-2 are independently shippable; BE-2 depends on
BE-1 for the storage flag.

---

## 11 · Recommended next implementation batch

**Batch BE-1 — opt-in Humanity / Path tracker for mortals (data + sheet only).**

Scope it explicitly to:

1. **Type:** add `trackMorality?: boolean` to `BaseCharacter` in
   [types/index.ts](src/types/index.ts). Document that it has no
   effect on `kind === 'vampire'`.
2. **Storage:** no normalization changes in `getCharacters`. No
   defaults injected. The field rides along through
   `JSON.parse(JSON.stringify(char))` in backup / export.
3. **Sheet header:** add a small toggle (label key
   `sheet_track_morality`, tooltip key `sheet_track_morality_hint`)
   rendered only when `kind ∈ {human, ghoul}`. Wire it to a
   `setCharacterTrackMorality(id, boolean)` helper that mirrors the
   existing `setCharacterType` pattern in
   [characterStorage.ts:452](src/services/characterStorage.ts:452).
4. **Sheet body:** when `trackMorality === true`, push a single
   Humanity / Path field into the rendered field list at the same
   index the vampire schemas use. **Do this in DynamicSheet
   conditionally — do not add a schema-level field.** Reuse
   `sheet_humanity` (V5) or `sheet_humanity_path` (classic). Use the
   existing dots-10 renderer.
5. **i18n:** add EN + ES for `sheet_track_morality` and
   `sheet_track_morality_hint`. No new label for the tracker itself
   (we reuse the vampire keys).
6. **Tests:** the test groups in §9 (storage, schema, sheet render).
7. **Out of scope for BE-1:** print view (BE-2), legacy-data inline
   hint (BE-2), ghoul rules mechanics, Blood Pool, Disciplines, V20
   vampire label question.

Acceptance gates for BE-1:

- Every existing test still passes.
- Creating a V5 Human → no `trackMorality`, no `humanity`, no
  Humanity row on sheet.
- Toggling on a V20 Ghoul → "Humanity / Path" dots-10 input appears
  in Trackers. Edit, save, reload — value persists.
- Every vampire (V5 + classic) sheet renders identical bytes to
  pre-BE-1.
- A V20 mortal with `trackMorality: true` shows "Humanity / Path"
  label; a V5 mortal shows "Humanity" label.

Once BE-1 is verified, BE-2 wires up the print view and the dormant-
data prompt.

---

## 12 · Risks and decisions needed before implementation

1. **Toggle label.** "Track morality", "Track humanity", "Show
   Humanity / Path"? Recommendation: **"Track morality"** in copy,
   with the tracker itself still labelled with the existing
   per-edition vampire label. Keeps the toggle generic; keeps the
   field-level label faithful to what the user is editing.
2. **Where the toggle lives.** Sheet header (recommended) vs. a
   "More…" submenu vs. the create dialog. Header keeps it
   discoverable without bloating the dialog.
3. **Dormant-data prompt copy.** Wording should be neutral
   ("This character has a stored Humanity value. Track it?") and
   must not imply that the rules require tracking. EN + ES.
4. **Should `trackMorality` ever be a chronicle-level default?** Out
   of scope for BE-1. Could revisit if multiple users ask, but per-
   character is correct for the audit window.
5. **Vampires never see the toggle — confirmed.** Don't surface it
   even as a disabled control; that just begs the question.
6. **Future ghoul-rules batch behavior.** When AZ Phase 3c ships,
   should it (a) remove the toggle for ghouls and make tracking
   always-on, or (b) leave the toggle but default it to on? Either
   is fine; AZ should decide.

None of these block the audit. All six can be settled when BE-1
starts.

---

## 13 · Dark Pack / copyright safety notes

- BE-1 introduces **no new label text** for the tracker — it reuses
  the existing `sheet_humanity` / `sheet_humanity_path` strings,
  which the app has shipped since launch.
- The two new strings (`sheet_track_morality`,
  `sheet_track_morality_hint`) are short noun phrases, mirroring
  `char_type_*` and `sheet_section_*`. No rulebook prose, no
  "what is Humanity?" explanation. Refer the player to the existing
  Rules / Compendium section if needed.
- No tables, no Hierarchies of Sin, no Path-specific lists — the app
  just exposes a 0–10 dot value the user can set freely.
- No new images, no new clan-or-path symbols, no new licensed assets.

---

*End of audit. No runtime files were modified in this batch. See §11
for the next-batch entry point.*
