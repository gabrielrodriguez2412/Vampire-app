# Ghoul regnant / domitor linking — audit & planning doc

**Batch BK · audit only · no runtime change**

Follows up on:

- [Batch AW — non-vampire character types audit](./non-vampire-character-types-audit.md)
- [Batch AZ — Human/Ghoul sheet refinement audit](./human-ghoul-sheet-refinement-audit.md)
- [Batch BF — Ghoul vitae tracking audit](./ghoul-vitae-tracking-audit.md)
- [Batch BI — Ghoul Disciplines/Powers audit](./ghoul-disciplines-powers-audit.md)

after AX (kind discriminator + creation), AY (basic mortal schemas),
BA (print/storage cleanup + Kind filter), BB (sheet identity refinement),
BC (kind-aware generator content), BD (ghoul regnant identity / ES
terminology), BE-1/BE-2 (opt-in morality), BG/BH (opt-in Vitae),
BI-1/BI-2 (opt-in classic Ghoul Powers) and BJ (dormant-data prompts)
shipped.

This batch answers one product question: **should Ghouls carry an
explicit link to a Vampire character that acts as their regnant /
domitor, and if so how?** No runtime files are touched.

Audience: future batch authors. Every finding cites a file and a
symbol so the next batch can act without re-running the survey.

---

## 1 · Current behavior

### Existing regnant surface (Batches BB / BD / BF / BI-1)

- `character.clan` on a Ghoul stores the **regnant clan id**, not the
  ghoul's own clan (Ghouls don't have one). Batch BD refined this in
  the ES terminology; Batch BB surfaces it as the "Regnant" prefix
  on the sheet header + card + print header, gated on `kind === 'ghoul'`
  and `clan !== ''`.
- Create-character dialog labels the clan select as "Regnant clan"
  when `kind === 'ghoul'`, and adds a "None / unknown" option that
  stores `clan: ''` for regnant-less ghouls (see
  [character.tsx:1856-1873](src/pages/character.tsx:1856)).
- Print (`CharacterPrintView.tsx`) uses `clan` to render the header
  clan name for ghouls with a regnant, and pills the "Ghoul" kind
  otherwise.
- Suggested-disciplines path in BI-1's Powers card calls
  `getSuggestedDisciplineIds(character.clan, edition, currentMap)`
  ([DynamicSheet.tsx:238](src/components/character/DynamicSheet.tsx:238))
  — the ghoul's `clan` (regnant clan) drives suggestions.

### There is NO character-to-character link today

- No field like `regnantCharacterId` / `domitorId` exists on
  `BaseCharacter`. Regnants are recorded only as a free-text /
  dropdown `clan` id, not as a reference to another character record.
- The relationships surface DOES exist for chronicles — see
  `ChronicleRelationship` at [types/index.ts:600](src/types/index.ts:600)
  — a directed source→target link with a `relationshipType` union
  (`'ally' | 'enemy' | 'sire' | 'childe' | 'rival' | 'contact' |
  'mawla' | 'touchstone' | 'coterie_mate' | 'other'`). **No
  `'regnant' | 'ghoul'` pair is currently in the union.** The
  relationships bucket is per-chronicle and lives in its own
  localStorage store (`chronicleRelationships` — see
  `characterStorage.ts` `getChronicleRelationships`). It gates on
  `chronicleId` and filters orphan rows.
- No sheet UI, card, print, or export path today reads
  ChronicleRelationships to surface a ghoul's regnant. The
  relationships store exists but has never been wired into the
  character sheet's regnant identity.

### Character-store API surface for linking

- [`getCharacterById(id)`](src/services/characterStorage.ts:340)
  already exists — a plain `find` over `getCharacters()`.
- `deleteCharacter(id)` at [:364](src/services/characterStorage.ts:364)
  removes the record from storage but does NOT scan other characters
  for references. Deleting the regnant today leaves nothing broken
  because nothing references them.

### Net result

- Regnants exist only as a **clan id string** on the ghoul, which is
  enough for the current UI (Regnant clan label + suggestions +
  print) but insufficient for real character-to-character linking
  (no navigation, no cascade on delete, no "which ghouls belong to
  this vampire?" surface).
- The chronicle-scoped relationships infrastructure is close to what
  a linked-regnant would need shape-wise, but it's chronicle-scoped
  and its type union doesn't include the regnant/ghoul pairing.

---

## 2 · Audit answers — direct responses to the brief

### 2.1 Should Ghouls be able to link to an existing Vampire character?

**Yes — opt-in, and only when the vampire exists in the same
chronicle (see 2.9).** Linking unlocks navigation from the ghoul to
the regnant's sheet, cascades identity on regnant edits (name
changes, clan changes), and enables future features like
regnant-driven Blood Pool ceilings or per-regnant power lists — but
each of those is a separate batch. BK-1 (the recommended first
implementation) only ships the link + navigation + identity
derivation; nothing else changes state on the ghoul when the regnant
edits their sheet.

### 2.2 Field name — `regnantCharacterId`, `domitorId`, or other?

**`regnantCharacterId`** (recommended).

- `regnant` is the term the app already uses in EN and ES throughout
  the sheet header, card, print header, and identity prefix — Batch
  BB / BD locked it in. Adding `domitorId` alongside `clan` (which
  is *already* the regnant clan) would introduce a second name for
  the same concept.
- The `Id` suffix mirrors `chronicleId` — a widely-used pattern in
  the type system.
- Rejected alternatives:
  - `domitorId` — introduces new terminology the sheet doesn't use.
  - `regnantId` (bare) — ambiguous with `clan`-as-regnant. The
    `Character` suffix makes clear the reference is to another
    character record.
  - `sireId` — semantically wrong; sires embrace, regnants bond.

### 2.3 Should `clan` remain as a manual Regnant clan fallback?

**Yes — `clan` stays as the manual fallback for ghouls whose regnant
isn't a tracked character record.** Not every game group tracks the
regnant as a full sheet; many just want "my ghoul is bonded to a
Ventrue" without creating a Ventrue record. `clan` continues to hold
that use case verbatim.

Precedence order when both are set:

1. If `regnantCharacterId` resolves to an existing character, use
   that character's clan (via `regnantCharacter.clan`) as the ghoul's
   effective regnant clan.
2. Otherwise, fall back to `character.clan` (the manual entry).
3. Otherwise (`regnantCharacterId` unresolved AND
   `character.clan === ''`), the ghoul reads as regnant-less exactly
   as today.

Storage keeps both fields — never overwrites the manual `clan` when
the link resolves. This keeps unlinking safe and preserves the user's
prior choice.

### 2.4 If a linked regnant exists, should the app derive regnant clan from that character?

**Yes, at read time only.** The ghoul's `clan` field is NOT
overwritten on link; instead, a helper like
`resolveRegnantClan(character, allCharacters)` computes the effective
clan value for display, following the precedence in 2.3. Read-time
derivation:

- Keeps the storage layer simple (write once, read many).
- Prevents desync — if the vampire changes clan later, the ghoul's
  displayed regnant clan updates immediately without a stored
  migration.
- Lets the user unlink without losing their previous manual entry.

Storage/normalization implication: none. The character record is
unchanged; the resolver is a pure function that lives in
`src/utils/regnant.ts` (or similar) and takes both the character and
the character list as arguments.

### 2.5 What happens if the linked regnant is deleted, archived, or changes clan?

Three orthogonal cases; each has a clear rule.

- **Deleted.** The ghoul's `regnantCharacterId` is now dangling. The
  resolver returns "no linked regnant" and falls back to the manual
  `clan`. The stored `regnantCharacterId` is preserved (the user
  might restore the vampire from a backup) but the UI reads as
  "unlinked" until it resolves again. No cascade-delete.
- **Archived.** `character.status === 'archived'` already exists.
  The link resolves normally — archived characters still exist and
  can still be a regnant. The UI can surface a small "archived"
  badge next to the linked regnant name so the user knows the
  vampire isn't in active play.
- **Clan changed.** Since derivation is read-time, the ghoul's
  displayed regnant clan simply updates. No stored value on the
  ghoul changes. Suggestions in the BI-1 Powers card also update
  immediately.

Explicit non-goals: no automatic notification, no confirmation
dialog on regnant deletion, no forced update of the ghoul's Powers
map. Anything more elaborate belongs to a follow-up batch.

### 2.6 How should this appear across surfaces?

| Surface | Behavior |
|---|---|
| **Ghoul creation** | Add an optional "Regnant" character selector below the existing Regnant clan select. Dropdown of chronicle-scoped vampires (see 2.9). Default value: none. Selecting a vampire disables the manual clan select (it becomes derived); a "Clear link" option restores manual mode. |
| **Ghoul sheet** | Add a small identity row in Basic Info: `Regnant: <vampire name>` with a click-through link that navigates to the vampire's sheet. When unset, the row is hidden — the existing "Regnant clan" surface stays intact for the manual case. |
| **Card** | The BB / BD ghoul card already shows `Regnant: <clan>` when clan is set. When linked, the card shows `Regnant: <vampire name>` instead (or in addition — see UI options §4). |
| **Print** | The existing `CharacterPrintView.tsx` "Regnant" identity row currently prints the clan display name; the linked variant prints the vampire's name. If both are set, print the name (more specific) and use the resolved clan for the header watermark. |
| **Export / import** | The `regnantCharacterId` field rides along in the JSON envelope. Export never resolves it to embedded data (avoids duplication, avoids stale copies, avoids leaking metadata about other characters into a single-character export). Import preserves the id verbatim; if the referenced vampire doesn't exist in the destination, the link resolves as dangling (§2.5). |
| **Chronicles** | See 2.9. |

### 2.7 Should a linked regnant suggest Ghoul powers?

**Yes, automatically — and it already works with the existing
BI-1 helper.** The `getSuggestedDisciplineIds(clan, edition, map)`
call in the Powers card reads the ghoul's *effective* regnant clan.
Once the resolver returns the linked vampire's clan when a link
resolves, the suggestions update with no additional wiring. The
BI-1 audit §7 already anticipated this.

### 2.8 Should the linked regnant affect V20 Vitae or V5 future powers?

**No coupling in BK-1.** The audit's guiding principle for every
recent tracker (Vitae in BF §7, Powers in BI §7) is that
Storyteller pacing varies too widely to encode. A linked regnant
does NOT auto-fill the ghoul's `bloodPool.max`, does NOT change the
BI-1 seed (still `{ current: 3, max: 3 }` on Vitae opt-in), and does
NOT alter V5 behavior (V5 ghouls remain deferred per the BI audit).

Future batches can add a "Suggest Vitae ceiling from regnant" chip
if users ask; that's a separate feature, not a coupling.

### 2.9 Per-chronicle or global?

**Per-chronicle scope for the selector; global storage for the
field.** Rationale:

- **Storage.** `regnantCharacterId` is a plain string on
  `BaseCharacter`. No chronicle scoping in the data model — same
  shape as `chronicleId` (which is optional and might not match the
  regnant's chronicle at all).
- **UI selector.** The regnant dropdown in the create dialog and the
  sheet's Regnant row filter candidates to `kind === 'vampire'` in
  the same chronicle as the ghoul (when the ghoul has a
  `chronicleId` set). This mirrors how the app already thinks about
  "characters that belong together" — the chronicle is the natural
  grouping.
- **Cross-chronicle links** — technically legal (the id points at any
  vampire record) but discouraged in the UI. If a user picks the
  ghoul's chronicle then changes the chronicle later, the previously
  selected regnant may end up in a different chronicle; the resolver
  still works (it looks up by id, not by chronicle), so behavior
  degrades gracefully.

### 2.10 Privacy / storage implications

- **All data stays local.** The current app already stores every
  character in localStorage under `STORAGE_KEY`; adding one more
  optional id field on `BaseCharacter` is not a new privacy surface.
- **No leakage on export.** A single-character export does NOT embed
  the regnant's full data — only the id. The regnant's own name,
  stats, or disciplines never appear in a ghoul's export.
- **Backup includes both characters** when the user runs the "backup
  everything" flow (already the case for every character in
  storage); the id-based link resolves correctly after restore.
- **Sharing a ghoul** with someone who doesn't have the regnant's
  record just yields a dangling link — no crash, no data leak, no
  reveal.

---

## 3 · Data model options

### Option D1 — `regnantCharacterId?: string` on `BaseCharacter` (recommended)

```ts
interface BaseCharacter {
  …existing fields…
  /**
   * Batch BK — optional reference to another character record that
   * acts as this ghoul's regnant / domitor. When set and resolvable,
   * the ghoul derives its regnant clan and identity display from the
   * referenced character. When unset (or dangling), the manual `clan`
   * field takes over. Has no effect on `kind !== 'ghoul'`. Additive
   * and backward-compatible; nothing seeds this field on creation.
   */
  regnantCharacterId?: string;
}
```

- Storage normalization untouched: the spread in `getCharacters`
  preserves the field verbatim.
- Validators unchanged (§5).
- Read-time derivation via a new helper (§4).

### Option D2 — Use `ChronicleRelationship` with a new `'regnant' | 'ghoul'` pair

Extends the existing chronicle relationships store instead of adding
a field to `BaseCharacter`.

**Rejected because:**

- Chronicle relationships are chronicle-scoped. A ghoul and its
  regnant may live in different chronicles today (legacy characters
  don't have `chronicleId`).
- The regnant link is a defining identity aspect of the ghoul — it
  belongs on the ghoul record itself, next to `clan`, not in a
  separate bucket that needs a join.
- Would require adding regnant/ghoul UI to the chronicle
  relationships editor, which is out of scope.
- Two authoritative sources (relationships store + `clan`) would
  invite desync.

Adding a `'regnant'` relationship type in a future chronicle-graph
batch is fine; that's parallel to, not a replacement for,
`regnantCharacterId`.

### Option D3 — Store the regnant's clan snapshot on the ghoul

"When a link is created, copy the regnant's clan into the ghoul's
`clan` field."

**Rejected because** it desyncs the moment the regnant changes clan.
Read-time derivation (§2.4) avoids this entirely.

### Recommendation: **D1**

One optional field on `BaseCharacter`, one pure resolver, zero
migrations. Same architectural shape as the four prior mortal
audits.

---

## 4 · UI options

### UI option U1 — Regnant selector in creation dialog + inline identity row on the sheet (recommended)

Two touch points, no modals, no new pages.

- **Create dialog.** Right below the existing Regnant clan select,
  add a searchable dropdown labelled `char_kind_regnant_character_label`
  ("Regnant character" / "Personaje regnant"). Options: "None /
  unknown" (default) + a list of vampires filtered by the ghoul's
  current `chronicleId` (if any), sorted by name. Selecting a vampire
  auto-fills the Regnant clan select (visibly, from the vampire's
  `clan`) and disables it — a "Clear link" chip restores manual mode.
- **Ghoul sheet identity row.** In Basic Info, add a read-only
  "Regnant" row that shows the linked vampire's name (with a
  click-through link that navigates to `/character/<vampireId>`).
  Hidden when unlinked. Below the row, a small "Change / Clear"
  affordance opens the same selector.
- **Card.** The BB / BD "Regnant" prefix already exists; extend it to
  show the vampire's name when linked, falling back to the clan
  display name otherwise.
- **Print.** No structural change: the existing Regnant row prints
  the resolved display value. Header watermark uses the resolved
  clan.

### UI option U2 — Dedicated "Bonds" page

A separate page listing all ghoul→regnant links across the library.
Overkill for the first implementation; better as a "features I want
after the basics work" backlog item.

### UI option U3 — Add a link-picker inside the existing character-list card menu

The three-dot menu on each character row already has "Duplicate /
Delete / Archive" options. Adding "Link to regnant…" here means the
user doesn't have to open the ghoul's sheet to link. **Rejected for
BK-1** because the primary path (open sheet, edit link) is the
normal flow; adding a shortcut can wait.

### Recommendation: **U1**

Two surfaces (create dialog + sheet identity row), both already
active in the mortal-editing flow. Users find the linker where they
already edit regnant identity.

---

## 5 · Regnant clan fallback strategy

The pure resolver — call it `resolveRegnantClan(character,
allCharacters)` — returns:

```ts
function resolveRegnantClan(
  character: Character,
  allCharacters: Character[],
): {
  clanId: string;                    // '' if regnant-less
  linkedRegnant: Character | null;   // null if unlinked / dangling
  displayName: string;               // '' if regnant-less
} {
  // Only ghouls have a regnant.
  if (character.kind !== 'ghoul') {
    return { clanId: '', linkedRegnant: null, displayName: '' };
  }

  const linkId = character.regnantCharacterId;
  if (typeof linkId === 'string' && linkId.length > 0) {
    const regnant = allCharacters.find(c => c.id === linkId);
    if (regnant && regnant.kind === 'vampire') {
      return {
        clanId: regnant.clan || '',
        linkedRegnant: regnant,
        displayName: regnant.name,
      };
    }
  }

  // Fallback: manual regnant-clan entry.
  return {
    clanId: character.clan || '',
    linkedRegnant: null,
    displayName: '',
  };
}
```

- **Pure.** Takes the character list as an argument; no localStorage
  access; unit-testable without React.
- **Handles dangling links.** A `regnantCharacterId` pointing at a
  deleted record simply returns the fallback.
- **Handles kind flips.** If the referenced record is no longer a
  vampire (kind changed to human/ghoul), fall through to the fallback
  — a non-vampire regnant is not a valid regnant.
- **Never writes.** No side effects on the ghoul or on the regnant.

Consumers (sheet identity row, card, print, Powers-card suggestions,
CharacterPrintView regnant header) all call this helper and read
either `linkedRegnant?.name || clanId`-derived clan display name, or
the raw `clanId` when they just need the clan.

---

## 6 · Export / import implications

- **No `EXPORT_VERSION` / `BACKUP_VERSION` bump.** One optional
  string field is additive.
- **No validator changes.** `validateCharacterExport` /
  `validateCharacterBackup` continue to check name / edition / clan.
- **Round-trip.** `regnantCharacterId` rides through
  `JSON.parse(JSON.stringify(char))` in
  [`buildCharacterBackup`](src/services/characterStorage.ts:666).
  Single-character export from Ghoul A carrying
  `regnantCharacterId: '<vampire-uuid>'` preserves the id verbatim.
- **Cross-installation import.** The referenced vampire may not exist
  in the destination; the link resolves as dangling (§2.5). The user
  can either re-import the vampire from a separate export, or re-link
  manually.
- **Full backup + restore.** Both characters ride through together;
  the ids match after restore (importCharacterBackup preserves the
  original id when there's no collision, else assigns a new UUID and
  the reader is expected to re-link — matches how
  `chronicleId` behaves on full-library restore today).
- **Privacy.** A single-character export of the ghoul does NOT embed
  the regnant's data. Users sharing a ghoul don't leak metadata
  about their other characters.

---

## 7 · Backward compatibility concerns

| Concern | Likelihood | Mitigation |
|---|---|---|
| Legacy ghouls have no `regnantCharacterId` field | Guaranteed | Field is optional; helper falls through to manual `clan`. Zero migration. |
| Existing manual `clan` is now "the fallback" | Guaranteed | Preserved verbatim. UI still edits it directly when no link is set. |
| Vampire → Human/Ghoul kind flip breaks a link | Possible via manual edit | Helper checks `regnant.kind === 'vampire'` at resolve time; if false, falls through to manual `clan`. No stored change. |
| Cross-chronicle links | Rare but legal | Selector filters candidates by chronicle; existing links keep working regardless. |
| Deleting a linked regnant | Possible | `regnantCharacterId` becomes dangling; helper returns `null` for `linkedRegnant`; UI shows unlinked state. No cascade. |
| Old client reads new-format ghoul | Common on stale builds | Unknown `regnantCharacterId` is preserved through JSON envelope but ignored by the old client. Loss-free round trip. |

**No storage normalization changes needed.** No `EXPORT_VERSION`
bump. No cascade-delete on the regnant record. The link is
intentionally soft.

---

## 8 · Testing strategy

### Pure helper tests (`src/utils/regnant.test.ts`)

Lock down `resolveRegnantClan(character, allCharacters)` with the
following cases:

- Vampire input → returns `{ '', null, '' }` (unreachable identity
  for non-ghouls).
- Human input → same.
- Ghoul with no `regnantCharacterId`, `clan: ''` → regnant-less.
- Ghoul with no `regnantCharacterId`, `clan: 'brujah'` → manual
  fallback (`clanId: 'brujah'`, `linkedRegnant: null`).
- Ghoul with `regnantCharacterId` resolving to a vampire (Ventrue) →
  linked (`clanId: 'ventrue'`, `linkedRegnant: <vampire>`,
  `displayName: <vampire.name>`).
- Ghoul with `regnantCharacterId` resolving to a **non-vampire** →
  falls through to manual `clan`.
- Ghoul with `regnantCharacterId` resolving to a vampire that has
  archived status → still returns the link (archived is still a
  valid record).
- Ghoul with dangling `regnantCharacterId` (id not found) → falls
  through to manual `clan`.

### Sheet UI tests

- Create-dialog: selecting a regnant character auto-fills the clan
  select and disables it; "Clear link" re-enables manual mode.
- Ghoul sheet identity row shows "Regnant: <name>" only when linked;
  a click navigates to `/character/<vampireId>`.
- Card row shows the linked name over the manual clan when both are
  set.

### Print tests

- Ghoul print header uses the resolved clan for watermark.
- Ghoul print Regnant row uses the resolved display name (linked
  regnant's name if linked, clan display name if manual, hidden if
  neither).
- Vampire print unaffected.

### Storage round-trip

- Ghoul with `regnantCharacterId` set survives export/import
  losslessly.
- Deleting the referenced vampire preserves `regnantCharacterId` on
  the ghoul (soft link).
- Backup + restore of a mixed library re-links correctly by id.

### Integration with existing BI-1 Powers suggestions

- A ghoul linked to a Brujah vampire shows Brujah suggestions in the
  Powers card (Celerity / Potence / Presence), even if the ghoul's
  own `clan` is `''`.
- A ghoul linked to a Tremere vampire shows Tremere suggestions
  regardless of the manual `clan` value.
- A ghoul with a dangling link falls back to the manual `clan`
  suggestions.

---

## 9 · Recommended implementation phases

| Phase | Scope | Risk | Approx. files |
|---|---|---|---|
| **BK-1 — Field + resolver + sheet identity row (next batch — see §10)** | Add `regnantCharacterId?: string` to `BaseCharacter`. Add pure `resolveRegnantClan` helper in `src/utils/regnant.ts`. Add a small identity row on the ghoul sheet ("Regnant: <name>", clickable) that shows when linked. Add regnant-character selector to the create dialog. Two new i18n keys. Focused tests. | Medium — new selector UI; needs care with the chronicle-scoped filter and the disabled-when-linked clan behavior. | ~7–9 |
| **BK-2 — Card + print regnant name** | Extend the BB / BD "Regnant" prefix on cards and the print Regnant row to show the linked vampire's name when a link resolves. | Low | ~2–3 |
| **BK-3 — Powers card wires to resolved regnant clan** | Update the BI-1 Powers card to call `resolveRegnantClan(...)` for the suggestions call instead of raw `character.clan`. Suggestion behaviour becomes link-aware. | Low | ~1 file + tests |
| **Future — chronicle-scoped `ChronicleRelationship` regnant/ghoul pair** | Optional: adds a `'regnant'` entry to the `ChronicleRelationshipType` union so the chronicle relationships graph surfaces the link too. Independent of the `regnantCharacterId` field. | Medium — separate audit. | not scoped here |
| **Future — regnant-driven Vitae ceiling suggestion** | Optional: a chip on the Vitae card that fills `bloodPool.max` from a heuristic tied to the regnant's Generation. | Medium — needs a rules discussion. | not scoped here |

BK-1, BK-2 and BK-3 are independently shippable. Recommend shipping
them in order because BK-2 and BK-3 are trivial once BK-1's helper
exists.

---

## 10 · Recommended next implementation batch

**Batch BK-1 — regnant-character field + resolver + sheet identity row.**

Scope it explicitly to:

1. **Type:** add `regnantCharacterId?: string` to `BaseCharacter`.
2. **Helper:** new `src/utils/regnant.ts` exporting the pure
   `resolveRegnantClan(character, allCharacters)` function described
   in §5.
3. **Create dialog:** below the existing Regnant clan select, add a
   dropdown labelled by a new key `char_kind_regnant_character_label`
   ("Regnant character" / "Personaje regnant"). Options: default
   "None" + chronicle-filtered list of `kind: 'vampire'` characters,
   sorted by name. Selecting one auto-fills + disables the clan
   select (visibly derived from the vampire); a "Clear link" chip
   restores manual mode.
4. **Ghoul sheet identity row:** a read-only "Regnant" row in Basic
   Info that shows `<vampire.name>` when linked, clickable → routes
   to that character's sheet. Hidden when unlinked. A small
   "Change / Clear" affordance below re-opens the selector.
5. **i18n:** two new keys — `char_kind_regnant_character_label`,
   `char_kind_regnant_character_none` (EN "None" / ES "Ninguno"). No
   changes to existing regnant strings.
6. **Tests:** the test groups in §8 (helper cases, create-dialog
   behavior, sheet row visibility + navigation).
7. **Out of scope for BK-1:**
   - Card / print name display (BK-2).
   - BI-1 Powers-card suggestions consuming the resolver (BK-3).
   - `ChronicleRelationship` union changes (future).
   - Vitae ceiling suggestions (future).
   - Cascade-delete on regnant delete.
   - Any change to the manual `clan` field's semantics — it stays
     the fallback.

Acceptance gates for BK-1:

- Every existing test still passes.
- Creating a new ghoul with no regnant selected → same as today.
- Selecting a vampire in the regnant selector → the ghoul stores
  `regnantCharacterId: <vampire.id>`; the clan select shows the
  vampire's clan and is disabled.
- Reopening a linked ghoul → Regnant row shows the vampire's name;
  clicking navigates to the vampire's sheet.
- Clearing the link → `regnantCharacterId` becomes undefined; the
  clan select re-enables with whatever value was there before the
  link (unchanged).
- Deleting the linked vampire → the ghoul's link dangles; the Regnant
  row falls back to hidden (or "Unknown regnant" — decision at
  implementation time); the manual `clan` fallback still works.
- Vampire / Human / V5 Ghoul sheets are unchanged — no selector, no
  identity row.
- Export/import: `regnantCharacterId` round-trips losslessly; a
  dangling link after single-character import degrades gracefully.

Once BK-1 lands, BK-2 (~2 files) and BK-3 (~1 file) follow the same
recipe with the helper already in place.

---

## 11 · Risks and decisions needed before implementation

1. **Where to render the regnant selector in the create dialog.**
   Below the Regnant clan select vs. replacing it when a link is set.
   Recommendation: **below**, with the clan select becoming disabled
   (still visible for context) when a link is active.
2. **Behavior when `chronicleId` is unset.** The regnant selector's
   candidates list should probably show all vampires in that case
   (fewer users, edge case). Recommendation: **show all vampires**;
   the search-in-dropdown handles large libraries.
3. **Should archived vampires appear in the selector?** Yes but
   flagged (small "archived" badge next to the name). Users often
   record regnants once and archive when the chronicle ends;
   preventing them from selecting an archived regnant would be
   surprising.
4. **Dangling-link display.** Show "Unknown regnant" text vs. hide
   the row entirely. Recommendation: **hide by default**, with an
   optional small warning icon if we can fit it — dangling links are
   almost always the result of a deleted or renamed record, not a
   user oversight.
5. **Whether the field belongs on `BaseCharacter` or only on
   `GhoulCharacter`.** `BaseCharacter` is the current shape; there's
   no `GhoulCharacter` today (the union is by edition, not by kind).
   Adding a ghoul-only discriminated union just for this field is
   overkill. **Recommendation: BaseCharacter, optional, ignored for
   non-ghouls.**
6. **Cross-chronicle links.** Allowed (soft), but the selector
   filters by chronicle. Users doing weird things can still hand-edit.
7. **Cascade-delete on regnant delete.** Deliberately NOT shipped in
   BK-1. Dangling links are a valid soft-fail state; forcing users
   to confirm every regnant deletion is punitive.

None of these block the audit. All seven can be settled when BK-1
starts.

---

## 12 · Dark Pack / copyright safety notes

- BK-1 introduces no rules text, no mechanics coupling to blood
  bonds, no vampiric-power inheritance. The link is a **UX
  affordance** — it just makes navigation between two records
  easier and lets the ghoul's regnant clan derive from an actual
  record rather than a manual dropdown.
- New i18n strings are short noun phrases:
  - `char_kind_regnant_character_label` — EN "Regnant character",
    ES "Personaje regnant"
  - `char_kind_regnant_character_none` — EN "None", ES "Ninguno"
- Reuses the existing regnant terminology the app has shipped since
  Batch BB/BD. No new rulebook prose, no per-power text, no clan
  symbols, no licensed artwork.

---

*End of audit. No runtime files were modified in this batch. See §10
for the next-batch entry point.*
