# Human / Ghoul sheet refinement — audit & next-step plan

**Batch AZ · audit only · no runtime change**

Follows up on [Batch AW's planning doc](./non-vampire-character-types-audit.md)
after AX (data model + creation option) and AY (basic mortal schemas)
landed. This audit inventories what is now correct on Human / Ghoul
sheets, what remains awkward, and which decisions are needed before
the next implementation batch.

Audience: future batch authors. Every finding cites a file and a
symbol so the next batch can act without re-running the survey.

---

## 1 · Current Human / Ghoul behavior after Batch AY

| Surface | V5 Human | V5 Ghoul | V20 Human | V20 Ghoul |
|---|---|---|---|---|
| **Kind on storage** | `kind: 'human'` (AX) | `kind: 'ghoul'` (AX) | `kind: 'human'` | `kind: 'ghoul'` |
| **Clan on storage** | `clan: ''` (creation form hides clan) | `clan: <regnant id>` or `''` (creation offers optional Regnant clan) | `clan: ''` | `clan: <regnant id>` or `''` |
| **Sheet schema used** | `humanV5Schema` (AY) | `ghoulV5Schema` (currently aliased to human) | `humanClassicSchema` | `ghoulClassicSchema` (aliased to human) |
| **Sheet fields visible** | identity (name/player/chronicle/concept), V5 attrs, V5 skills, Health, Willpower, Experience, Advantages, Flaws, Inventory, Journal | same as Human | identity + Nature + Demeanor, classic attrs, classic abilities, Virtues, Health, Willpower, Merits, Flaws, Inventory, Journal | same as V20 Human |
| **Vampire-only fields stripped from schema** | Hunger, Blood Potency, Predator Type, Resonance, Touchstones, Convictions, Sire, Generation, Disciplines, Ambition, Desire, Humanity | same | Blood Pool, Generation, Sire, Disciplines, Humanity / Path | same |
| **Create form vampire-only fields hidden** | Ambition, Desire, Predator Type (AY polish) | same | Sire, Generation (AY polish) | same |
| **Card kind pill** | "Human" pill, amber tint, no clan watermark | "Ghoul" pill, amber tint, regnant-clan watermark if set, neutral mortal glyph otherwise | "Human" pill, no clan watermark | "Ghoul" pill, regnant watermark if set |
| **Storage normalization** | clan empty preserved (no `'brujah'` fallback); `kind` defaulted to `'vampire'` only for legacy entries | same | same | same |
| **Export / import** | Validators accept missing clan when `kind !== 'vampire'`; backups round-trip the kind | same | same | same |
| **Print view** | Still uses the vampire-shaped layout (see §3) | same | same | same |
| **Character list filters** | No Kind facet (only edition / clan / type / chronicle / status) | same | same | same |
| **Random generator (Suggest)** | Hidden alongside the field rows; pools themselves are not kind-aware | same | same | same |

---

## 2 · What is already acceptable

- **Kind discriminator + creation flow.** The Phase 1 data layer is
  solid — every existing test passes; legacy vampires load unchanged;
  the new Kind selector and clan-hide / Regnant-clan-relabel rules
  behave as designed.
- **Sheet schemas (AY).** `humanV5Schema` / `humanClassicSchema` and
  the ghoul aliases drop every audited vampire-only field. The
  `getSchemaForCharacter` selector routes cleanly.
- **Create-form gating (AY polish).** Predator Type / Ambition /
  Desire (V5) and Sire / Generation (classic) disappear on
  human/ghoul; Nature + Demeanor stay on all classic kinds.
- **Card visuals.** Vampires unchanged. Humans get a neutral mortal
  watermark and no clan-icon identity row. Ghouls with a regnant
  show the regnant's clan visuals; without a regnant they look like
  humans. The kind pill always surfaces non-vampire nature.
- **Export / import.** Mixed-kind libraries round-trip losslessly via
  `buildCharacterBackup` / `importCharacterBackup`; relaxed clan
  validation never triggers for legacy vampires.
- **Localization.** EN + ES are mirrored for every new key
  introduced by AX / AY (`char_kind_*`, `name_required`,
  `char_kind_regnant_clan_*`).
- **Generator gating side-effect.** Because each `SuggestButton`
  lives inside its field row, hiding the row also hides the Suggest
  chip. No new gating code was needed in AY.

---

## 3 · Remaining problems / awkward fields

### 3a — Print sheet still emits vampire-only sections for non-vampires *(real bug)*

`src/components/character/CharacterPrintView.tsx` branches only on
`character.edition`, never on `character.kind`. Concretely:

- **Hunger row** is pushed unconditionally for every V5 character
  (lines 465–469). A V5 human or ghoul prints a Hunger dots row even
  though `humanV5Schema` does not expose Hunger on the sheet — the
  underlying `hunger: 1` default seeded by `createEmptyCharacter`
  surfaces here.
- **Blood Pool row** is pushed unconditionally for any classic
  character with a `bloodPool` object (line 470). `createEmptyCharacter`
  seeds `{ current: 10, max: 10 }` on every classic kind, so
  humans / ghouls print a "10 / 10" blood-pool row.
- **Humanity row** is always pushed (lines 489–492). The mortal
  schemas omit Humanity on the sheet, but print emits it for every
  character regardless of `kind`.
- **Blood Potency row** is pushed whenever `typeof v5?.bloodPotency
  === 'number'` (line 493). Default V5 humans / ghouls have
  `bloodPotency: 1` from `createEmptyCharacter`, so the row prints.
- **Clan name in header** uses `getClanDisplayNameById(character.clan,
  …)` (lines 339–343, 537). A human with `clan: ''` prints a clan
  string that's either blank or "unknown clan" depending on the
  helper's behavior.

This is the most visible "still feels like a vampire sheet" issue and
should be the first item in the next implementation batch.

### 3b — Backgrounds section is exposed via print but not via sheet for classic mortals *(minor consistency gap)*

Print emits `backgroundEntries` whenever the character is classic
(line 353). `humanClassicSchema` / `ghoulClassicSchema` do NOT
include a backgrounds section. The user can't author backgrounds on
a mortal sheet but if one was set (e.g., from an import or from a
pre-AX character that the user later set to `kind: 'human'`) it
would still print. Harmless today but inconsistent.

### 3c — Mortal schemas have no Humanity / Path field at all *(open product decision)*

AW §9 flagged this. AY confirmed it deferred. The question stands —
see §5.

### 3d — Mortal schemas have no Background / Influence / Allies notes *(real gap)*

V20 humans (and most ghouls) historically have small Backgrounds /
Influence-style traits. The Phase 2 mortal classic schema dropped
the `backgrounds` section entirely. For now there's no place on the
sheet to record "this human has a contact at the police". A user
can use the free-text journal or Inventory, but a dedicated
backgrounds-lite section would be more discoverable.

### 3e — Ghoul Blood Pool deferred but storage still seeds a vampire-sized pool

`createEmptyCharacter('V20', clan, name, 'ghoul')` flows through the
classic branch and seeds `bloodPool: { current: 10, max: 10 }`. The
schema doesn't expose it on the sheet, so the player never sees it
— but the value lives in storage forever, prints (see 3a), and would
surface if a future feature naively reads `cl.bloodPool` for any
classic character. This is dormant tech debt.

### 3f — V5 humans still have `bloodPotency: 1` / `hunger: 1` in storage

Same shape as 3e but for V5. The schema hides them on the sheet,
but they exist in storage, print (see 3a), and would surface to any
naïve V5-only reader (e.g., the character-card V5 branding logic, if
it ever grows kind-blindness).

### 3g — Character list has no Kind facet

AW §10 flagged this as a Phase 4 item. With AX/AY shipped, users
can now create mixed libraries (vampires + humans + ghouls) but
can't filter by Kind. The clan filter only lists clans that appear
on saved characters, so humans (with `clan: ''`) are never first-
class in the filter UI. Sorting by Kind doesn't exist either.

### 3h — Random generator pools are not kind-aware

Each `SuggestButton` is hidden alongside its row, so a V5 human
never sees a Predator Type suggestion. But the existing **Concept**
pool (rendered for every kind via the always-visible Concept row)
draws from a vampire-flavored pool ("Anarch fixer", "Camarilla
chamberlain", etc. in some entries). A human reading those concepts
might find them out-of-tone. Low priority; surfaces only on the
Suggest chip, which the user can dismiss.

### 3i — Nature / Demeanor inputs on V5 humans / ghouls are unavailable

The audit accepted that Nature / Demeanor are general Storyteller
personality prompts, so AY kept them on every classic kind. The
**V5** branch of the create form has no Nature / Demeanor at all
(they're classic-only by V5 convention). V5 humans have only
"Concept" as their personality prompt — somewhat thin compared to
classic. Probably acceptable for Phase 2 but worth a note.

### 3j — Mobile layout on mortal sheets

The mortal schemas have fewer sections than the vampire schemas,
which means more whitespace on tall mobile viewports. Not broken,
just less dense. No code change suggested in this batch.

### 3k — EN / ES coverage

Every existing key used by mortal schemas already has EN + ES.
Section labels reuse `sheet_section_basic`, `sheet_section_attributes`,
`sheet_section_skills`, `sheet_section_abilities`,
`sheet_section_trackers`, `sheet_section_merits_flaws`, etc. — all
already mirrored. No locale gaps were introduced.

---

## 4 · Which issues are simple UI / schema cleanup

Items in §3 split cleanly:

**Simple cleanup (no rules / product decisions needed):**
- 3a — Print view: gate Hunger / Blood Pool / Humanity / Blood Potency
  rows on `kind === 'vampire'` (or treat them like ambition / desire
  identity rows that only push when set + appropriate). Pure UI fix.
- 3e + 3f — Storage seeding: skip `bloodPool` / `bloodPotency` /
  `hunger` defaults in `createEmptyCharacter` for non-vampire kinds.
  Tiny conditional, backward-compatible.
- 3g — Add a Kind facet to the character list filter row. Mirrors
  the existing `filterType` (PC/NPC) shape; no new data needed.
- 3b — Decide whether mortal schemas should expose a small Backgrounds
  textarea (this overlaps with 3d).
- 3i — Status quo is acceptable; defer.
- 3j — No action.
- 3k — No action.

**Needs rules / product decisions:**
- 3c — Humanity / Path for mortals: include? Where? Per kind?
- 3d — Backgrounds-lite section for mortals: shape, naming, edition split.
- 3h — Kind-aware generator pools: how much human / ghoul flavor to
  ship, in which languages.

---

## 5 · Decisions needed (asked by the brief, answered here)

### 5.1 — Should Human V5 keep Humanity / Willpower / Health only, or also Ambition / Desire-style personal fields?

**Recommendation: Health + Willpower only, plus a single free-text
"Personal Aspiration" field if we want a V5 mortal hook.**

Rationale: Ambition / Desire are V5 vampire chronicle traits with
specific mechanical meaning. Adopting them for humans would muddy
the cross-edition picture. A single generic "Aspiration" textarea
(reusing an existing key like `sheet_concept`) preserves narrative
hooks without rules implications.

Decline Humanity until we resolve §3c — see 5.5.

### 5.2 — Should Ghoul V5 keep Humanity / Willpower / Health and Regnant clan / note, but no Hunger / Blood Potency?

**Recommendation: yes — Health + Willpower + Regnant clan (already
stored, surface as a read-only identity row on the sheet). Defer
Humanity until §5.5. Hunger / Blood Potency stay omitted.**

The regnant-clan-as-read-only-row is a small win — the value is
already in storage and on the card; surfacing it on the sheet
header makes the bond visible during play. No new mechanics.

### 5.3 — Should V20 Human keep Nature / Demeanor, Humanity / Path, Willpower, Health?

**Recommendation: yes for Nature / Demeanor / Willpower / Health.
Decide Humanity / Path per §5.5.**

Nature / Demeanor are general Storyteller-system personality
prompts (the V20 core book documents them for any character).
Already in the V20 mortal schema. No change.

### 5.4 — Should V20 Ghoul keep Nature / Demeanor, Humanity / Path, Willpower, Health, and Regnant clan / note?

**Recommendation: same as 5.3 + add a read-only regnant-clan row in
identity. Defer Humanity per §5.5.**

### 5.5 — Should Ghoul Blood Pool be deferred until a dedicated rules batch?

**Yes. Defer.** Blood Pool requires a per-kind cap (≈1–3 dots for
classic ghouls vs 10–20 for vampires), a daily-refresh model, and
clear UX about who refreshes it. None of this is in scope for a
schema-cleanup batch. Storage already carries a 10/10 pool on every
classic character (see 3e); the storage cleanup in §6 will fix that
so the seeded default doesn't surface in print.

### 5.6 — Should Ghoul Disciplines / Powers be deferred until a dedicated rules batch?

**Yes. Defer.** Brief §7 of AW already deferred this, and AY
explicitly omitted Disciplines from the ghoul schema. A dedicated
batch would model ghouls' single discipline at level 1, possibly
tied to the regnant's clan.

### 5.7 — Should print sheets show kind-specific labels now or later?

**Now, as part of the next batch.** This is the most user-visible
problem today (§3a). The fix is small (~10–20 lines), pure UI, no
rules required: branch the existing `isV5` / `cl?.bloodPool`
conditions on `kind` so non-vampire sheets stop emitting Hunger /
Blood Pool / Blood Potency / Humanity rows.

A "Human" or "Ghoul" pill in the print header (mirroring the card
pill) would also be cheap to add and finishes the print parity
story.

### 5.8 — Should the character list get a Kind filter soon?

**Yes — in the same next batch.** The data lives on every character;
the existing filter row already has a Type (PC / NPC) facet that
serves as a template. Three options (All / Vampire / Human / Ghoul)
plus i18n keys. ~30 lines plus a focused test.

### 5.9 — Should mortal sheets expose Humanity?

**Defer; add as an optional, per-character toggle in a later batch.**

Different tables run mortals with and without a morality track.
The least disruptive path is a per-character "Track Humanity?"
toggle on the sheet header that, when on, surfaces the existing
Humanity field for `kind ∈ {human, ghoul}`. No new data model;
the existing `humanity: 7` default is already in storage.

### 5.10 — Should mortal sheets get a Backgrounds-lite section?

**Recommend a single free-text "Backgrounds" textarea on the
classic-edition mortal schema** (mirrors how Merits / Flaws are
modeled today). V5 mortals get nothing extra — V5's mortal play
typically maps backgrounds to free-text concept anyway. Cheap, no
new schema field types, no rules implications.

---

## 6 · Recommended implementation phases

Re-anchored after AX / AY.

| Phase | Scope | Risk | Approx. files |
|---|---|---|---|
| **3a — Print + storage cleanup** (next batch — see §7) | Print view kind-aware; `createEmptyCharacter` skips vampire-only seeds for non-vampires; Kind filter on the character list. | Low — surgical, pure additive. | ~5–7 |
| **3b — Mortal sheet polish** | Read-only Regnant clan row on ghoul sheets; classic-mortal Backgrounds textarea; optional Humanity-track toggle. | Low | ~4–5 |
| **3c — Ghoul mechanics batch** | Single-discipline-at-level-1 surface, Blood Pool capped tracker, regnant-character link. | Medium — touches discipline + new tracker. | ~6–8 |
| **3d — Generator content** | Human / Ghoul-flavored pool entries in EN + ES for Concept, Appearance, Personality. Mark pools by kind in `isFieldAvailable`. | Low | content + tests |

Phases 3a and 3b are independently shippable. 3c depends on 3b's
Regnant work. 3d is content-only and slots between any pair.

---

## 7 · Recommended next implementation batch

**Phase 3a — print parity + storage cleanup + Kind filter.**

Scope it explicitly to:

1. **Print view (`CharacterPrintView.tsx`).** Gate the Hunger, Blood
   Pool, Blood Potency, Humanity, and clan-name-in-header rows on
   `character.kind === 'vampire'` (or absent). Push a discreet
   "Human" / "Ghoul" pill in the print header for non-vampires.
   No layout overhaul; the existing identity-row machinery already
   uses conditional pushes.

2. **Storage defaults (`createEmptyCharacter` in
   `services/characterStorage.ts`).** For `kind === 'human'`:
   skip `bloodPool`, `bloodPotency`, `hunger`, `humanity` seeds.
   For `kind === 'ghoul'`: skip `hunger`, `bloodPotency`; keep
   storage for `bloodPool` deferred to Phase 3c. Existing humans /
   ghouls in storage are unaffected — `getCharacters` normalization
   continues to preserve whatever's there.

3. **Character list Kind filter.** Add a four-way facet (All /
   Vampire / Human / Ghoul) alongside the existing Type filter in
   `pages/character.tsx`. Reuse the `characterFilter.ts` helper
   shape.

Acceptance gates:
- Every existing test still passes.
- A V5 human prints with **no** Hunger, **no** Blood Potency, **no**
  Humanity, **no** clan name; print header shows "Human".
- A V20 ghoul with no regnant prints with **no** Blood Pool, **no**
  Humanity, **no** Generation; print header shows "Ghoul".
- Selecting "Human" in the new Kind filter shows only humans;
  selecting "Vampire" shows only vampires.
- A newly created V5 human has no `hunger` / `bloodPotency` /
  `humanity` in its stored JSON (existing humans are untouched).

Out of scope for the next batch (defer to 3b / 3c):
- Regnant-clan-as-identity-row on ghoul sheets.
- Backgrounds textarea on classic mortals.
- Humanity-track toggle.
- Generator-pool kind awareness.
- Ghoul disciplines / blood pool mechanics.

---

## 8 · Testing strategy

Per phase, ship these test groups.

### Phase 3a

- `CharacterPrintView` for a V5 human: no Hunger row, no Blood Potency
  row, no Humanity row, no clan name in header.
- `CharacterPrintView` for a V20 ghoul without regnant: no Blood Pool
  row, no Humanity row, no Generation row.
- `createEmptyCharacter('V5', '', 'X', 'human')` returns an object
  with no `hunger`, no `bloodPotency`, no `humanity` keys.
- `createEmptyCharacter('V20', '', 'X', 'human')` returns an object
  with no `bloodPool`, no `humanity` keys (but still seeds `health`
  and `willpower`).
- Backward compat: an existing pre-3a saved human (whose stored JSON
  still has `hunger: 1`) loads without error and the storage shape
  is preserved verbatim on save — we don't strip on read.
- Vampire regression: `createEmptyCharacter('V5', 'brujah', 'X')`
  still seeds `hunger`, `bloodPotency`, `humanity` exactly as it
  always has.
- Character list Kind facet: 3-way switching shows / hides the right
  rows. Filter persistence (if implemented like `filterType`).
- EN + ES print pill labels.

### Phase 3b

- Regnant clan identity row on a ghoul sheet renders read-only,
  shows the localized clan name, never appears on vampires or
  humans.
- Backgrounds textarea on classic mortal sheets persists round-trip.
- Humanity-track toggle: off by default for new mortals; on persists
  through save / reload; when on, the existing Humanity field
  renders.

### Phase 3c

- Single-discipline-at-level-1 ghoul UI: cap at 1, suggestion list
  filtered to the regnant's clan disciplines.
- Blood Pool tracker on ghouls: default max ≈ 1–3, capped, doesn't
  refill mechanically (player-adjustable).

---

## 9 · Dark Pack / copyright safety notes

- All names, mechanics, and labels surfaced by the next batches must
  remain **app implementation terminology** — no copied rulebook
  prose, no clan symbols, no licensed artwork. Existing strings
  ("Hunger", "Humanity", "Blood Pool", "Generation") are accepted
  generic terms used by the app since launch; new strings added by
  these batches should follow the same pattern.
- The mortal/ghoul implementation must never *describe* rules — only
  surface fields the player fills in. Defer any "what is humanity?"
  copy to the existing Rules / Compendium section, which is already
  Dark Pack–audited.
- New i18n strings introduced for Phase 3a (e.g., `char_kind_filter_*`)
  should be short noun phrases like the existing `char_type_*` keys.
- No new image assets or clan symbols are required by any phase in
  this audit.

---

*End of audit. No runtime files were modified in this batch. See §7
for the next-batch entry point.*
