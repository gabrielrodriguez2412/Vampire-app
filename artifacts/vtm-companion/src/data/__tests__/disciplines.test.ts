import { describe, it, expect } from 'vitest';
import { disciplines } from '../disciplines';
import { clans } from '../clans';
import { EDITION_LIST } from '../editions';
import { UI_STRINGS } from '../../i18n/ui';
import { getClanDisciplinesForEdition } from '../../utils/content';
import type { ClanEntry, EditionId } from '../../types';

const editionIds = new Set(EDITION_LIST.map(e => e.id));
const disciplineIds = new Set(disciplines.map(d => d.id));
const clanIds = new Set(clans.map(c => c.id));

describe('disciplines data', () => {
  it('has unique ids', () => {
    const ids = disciplines.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every discipline declares at least one edition and all editions are known', () => {
    for (const d of disciplines) {
      expect(d.editions.length, `${d.id} should declare at least one edition`).toBeGreaterThan(0);
      for (const ed of d.editions) {
        expect(editionIds.has(ed), `${d.id} references unknown edition ${ed}`).toBe(true);
      }
    }
  });

  it('every clan referenced in clansWhoUse exists', () => {
    for (const d of disciplines) {
      for (const cId of d.clansWhoUse) {
        expect(clanIds.has(cId), `${d.id}.clansWhoUse has unknown clan ${cId}`).toBe(true);
      }
    }
  });

  it('every power has level 1-5', () => {
    for (const d of disciplines) {
      for (const p of d.powers) {
        expect(p.level, `${d.id}.${p.name} level out of 1-5`).toBeGreaterThanOrEqual(1);
        expect(p.level, `${d.id}.${p.name} level out of 1-5`).toBeLessThanOrEqual(5);
      }
    }
  });

  // Phase 3: a discipline must surface either a flat powers list OR at least
  // one specialSystems section. Either prevents the silent-empty-array UX
  // problem; the latter is the model for paths/rituals/ceremonies/formulae.
  it('every discipline has at least one power entry or specialSystems section', () => {
    for (const d of disciplines) {
      const hasPowers = d.powers.length > 0;
      const hasSpecial = (d.specialSystems?.length ?? 0) > 0;
      expect(
        hasPowers || hasSpecial,
        `${d.id} has no power entries and no specialSystems sections`
      ).toBe(true);
    }
  });

  // For disciplines that DO use the flat powers list, still require full L1–5
  // coverage. Disciplines that only use specialSystems are exempt because
  // their content is grouped differently (paths, rituals, ceremonies,
  // formulae) and may not span every dot level.
  it('every powers-list discipline covers all five levels (1..5)', () => {
    for (const d of disciplines) {
      if (d.powers.length === 0) continue;
      const levels = new Set(d.powers.map(p => p.level));
      for (const lvl of [1, 2, 3, 4, 5]) {
        expect(levels.has(lvl), `${d.id} missing a power at level ${lvl}`).toBe(true);
      }
    }
  });

  it('every power has a non-empty english description (placeholders allowed)', () => {
    for (const d of disciplines) {
      for (const p of d.powers) {
        expect(
          (p.description.en || '').trim().length,
          `${d.id}.${p.name} missing an English description (use a "Needs review" placeholder if unsure)`
        ).toBeGreaterThan(0);
      }
    }
  });

  /**
   * Spanish coverage (Batch L).
   *
   * After Batch L every discipline's visible top-level fields
   * (description, type) and every power's description / tacticalUse
   * should be populated in Spanish, not silently falling back to the
   * English string baked into the ES slot by the old `fallbackStr`
   * helper.
   */
  it('every discipline description has a non-empty Spanish translation', () => {
    for (const d of disciplines) {
      expect(
        (d.description.es || '').trim().length,
        `${d.id}.description.es is empty — the disciplines page will silently render English in Spanish mode`,
      ).toBeGreaterThan(0);
      expect(
        d.description.es,
        `${d.id}.description.es is a verbatim copy of EN — translate it`,
      ).not.toBe(d.description.en);
    }
  });

  it('every discipline type label has a non-empty Spanish translation', () => {
    for (const d of disciplines) {
      expect(
        (d.type.es || '').trim().length,
        `${d.id}.type.es is empty — type chip will render English in Spanish mode`,
      ).toBeGreaterThan(0);
    }
  });

  it('every power description has a non-empty Spanish translation', () => {
    for (const d of disciplines) {
      for (const p of d.powers) {
        expect(
          (p.description.es || '').trim().length,
          `${d.id}.${p.name}.description.es is empty`,
        ).toBeGreaterThan(0);
        expect(
          p.description.es,
          `${d.id}.${p.name}.description.es is a verbatim copy of EN — translate it`,
        ).not.toBe(p.description.en);
      }
    }
  });

  it('every power tacticalUse has a non-empty Spanish translation', () => {
    for (const d of disciplines) {
      for (const p of d.powers) {
        expect(
          (p.tacticalUse.es || '').trim().length,
          `${d.id}.${p.name}.tacticalUse.es is empty`,
        ).toBeGreaterThan(0);
        expect(
          p.tacticalUse.es,
          `${d.id}.${p.name}.tacticalUse.es is a verbatim copy of EN — translate it`,
        ).not.toBe(p.tacticalUse.en);
      }
    }
  });

  /**
   * narrativeUses coverage (Batch O).
   *
   * `narrativeUses` is rendered as a small "ideas of play" list inside
   * the disciplines page. Previously three disciplines (blood_sorcery,
   * thaumaturgy, obtenebration) shipped content through `fallbackArr`,
   * which copies the same English item into every locale slot — so
   * Spanish users silently saw English text without even the EN
   * fallback chip firing (the chip only triggers on empty slots).
   *
   * Contract enforced here:
   *   - If the EN array has items, the ES array must have the same
   *     number of items (no half-translated lists).
   *   - Each ES item must be non-empty.
   *   - The ES list must not be a verbatim copy of EN (catches a
   *     `fallbackArr` regression directly).
   *
   * Disciplines that intentionally have no narrative-uses content
   * still ship `enEsArr([], [])` / `fallbackArr([])` (both empty)
   * and pass this test trivially.
   */
  it('every narrativeUses list with EN content has matching non-empty Spanish content', () => {
    for (const d of disciplines) {
      const en = d.narrativeUses.en ?? [];
      const es = d.narrativeUses.es ?? [];
      if (en.length === 0) continue;
      expect(
        es.length,
        `${d.id}.narrativeUses has ${en.length} EN item(s) but ${es.length} ES item(s) — either drop the EN entries or translate them`,
      ).toBe(en.length);
      for (let i = 0; i < es.length; i++) {
        expect(
          (es[i] || '').trim().length,
          `${d.id}.narrativeUses.es[${i}] is empty`,
        ).toBeGreaterThan(0);
      }
      // Deep-equal copy means the data shipped via fallbackArr —
      // the original problem this test guards against.
      const verbatim = en.length === es.length && en.every((v, i) => v === es[i]);
      expect(
        verbatim,
        `${d.id}.narrativeUses.es is a verbatim copy of EN — translate it (likely shipped via fallbackArr instead of enEsArr)`,
      ).toBe(false);
    }
  });

  /**
   * Batch-O priority drift guard.
   *
   * The user-flagged "remaining problem" disciplines must keep
   * meaningful, paraphrased Spanish descriptions instead of regressing
   * to one-liner placeholders like "Antigua magia de la sangre.".
   * Threshold: 60 characters in ES (short enough to allow concise
   * summaries, long enough to catch the single-clause placeholders
   * Batch O replaced).
   */
  const BATCH_O_PRIORITY_IDS = [
    'thaumaturgy',
    'quietus',
    'necromancy',
    'obtenebration',
    'dominate',
    'obfuscate',
    'oblivion',
    'thin_blood_alchemy',
    'blood_sorcery',
  ];

  it('Batch O priority disciplines all have informative (≥ 60 char) Spanish descriptions', () => {
    for (const id of BATCH_O_PRIORITY_IDS) {
      const d = disciplines.find(x => x.id === id);
      expect(d, `priority discipline ${id} missing from data`).toBeDefined();
      const es = (d!.description.es || '').trim();
      expect(
        es.length,
        `${id}.description.es is too short (${es.length} chars) — Batch O paraphrases run > 60 chars; this looks like a regression to a one-liner`,
      ).toBeGreaterThanOrEqual(60);
    }
  });
});

describe('discipline specialSystems shape', () => {
  const KNOWN_KINDS = new Set(['paths', 'rituals', 'ceremonies', 'formulae', 'other']);

  it('section ids are unique across all disciplines', () => {
    const ids: string[] = [];
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) ids.push(s.id);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('item ids are unique within each section', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        const ids = s.items.map(i => i.id);
        expect(
          new Set(ids).size,
          `${d.id}.${s.id} has duplicate item ids`
        ).toBe(ids.length);
      }
    }
  });

  it('every section has a known kind and a non-empty english title', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        expect(KNOWN_KINDS.has(s.kind), `${d.id}.${s.id} unknown kind ${s.kind}`).toBe(true);
        expect(
          (s.title.en || '').trim().length,
          `${d.id}.${s.id} missing English title`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every item has a non-empty english summary and (if level set) level in 1..5', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        for (const item of s.items) {
          expect(
            (item.summary.en || '').trim().length,
            `${d.id}.${s.id}.${item.id} missing English summary`
          ).toBeGreaterThan(0);
          if (typeof item.level === 'number') {
            expect(item.level, `${d.id}.${s.id}.${item.id} level out of 1-5`).toBeGreaterThanOrEqual(1);
            expect(item.level, `${d.id}.${s.id}.${item.id} level out of 1-5`).toBeLessThanOrEqual(5);
          }
        }
      }
    }
  });

  /**
   * Pending-state contract (Batch K).
   *
   * Sections marked `needsReview: true` used to ship fake placeholder
   * items like "Ritual (Level 1) — Needs review" so the accordion
   * would not look empty. Those have been removed in favour of an
   * empty `items: []` list plus a localized `description` that
   * explains the section is pending review. These cases pin that
   * contract:
   *   - placeholder sections carry an empty items array (no fake
   *     entries leak back into the UI),
   *   - their title and description are populated in EN AND ES
   *     (so the disciplines page does not render English under a
   *     Spanish UI),
   *   - the description text differs between EN and ES (catches
   *     copy-paste regressions of the "we lied about translating"
   *     variety).
   */
  it('every needsReview section ships an empty items array', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (s.needsReview) {
          expect(
            s.items.length,
            `${d.id}.${s.id} is needsReview but still has placeholder items — drop them in favour of empty items: []`,
          ).toBe(0);
        }
      }
    }
  });

  it('every needsReview section title is populated in EN AND ES', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (!s.needsReview) continue;
        expect(
          (s.title.en || '').trim().length,
          `${d.id}.${s.id}.title.en is empty`,
        ).toBeGreaterThan(0);
        expect(
          (s.title.es || '').trim().length,
          `${d.id}.${s.id}.title.es is empty (Spanish UI would fall back to EN)`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('every needsReview section description is populated in EN AND ES and is not a copy-paste', () => {
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (!s.needsReview) continue;
        const desc = s.description;
        expect(
          desc,
          `${d.id}.${s.id} has no description — pending-state copy is required`,
        ).toBeDefined();
        const en = (desc?.en || '').trim();
        const es = (desc?.es || '').trim();
        expect(en.length, `${d.id}.${s.id}.description.en empty`).toBeGreaterThan(0);
        expect(es.length, `${d.id}.${s.id}.description.es empty`).toBeGreaterThan(0);
        expect(
          es,
          `${d.id}.${s.id}.description.es is a verbatim copy of EN — translate it`,
        ).not.toBe(en);
      }
    }
  });

  /**
   * Batch Q — production-polish pinning for pending special sections.
   *
   * The pending sections used to:
   *   - sometimes ship a placeholder `name: "Ritual (Level 1) — Needs review"`
   *     inside `items` (Batch K removed those),
   *   - end every `description` with a redundant "is pending review and
   *     will be added in a future content batch" tail in both languages,
   *     which read as a work-in-progress notice on a production page
   *     when the amber `Needs review` badge in the section header
   *     already conveyed that.
   *
   * Batch Q pins three additional contracts on top of the Batch K
   * contract already enforced above:
   *
   *   (1) The set of `needsReview: true` sections is exactly the known
   *       pending list. A future content edit that flips a normal
   *       section to `needsReview` (or quietly clears a known pending
   *       one without filling it in) fails this set-equality check.
   *
   *   (2) No pending section's `description.es` leaks English
   *       work-in-progress wording — "Needs review", "pending review",
   *       "placeholder", or "future content batch". A future edit that
   *       copies an English sentence verbatim into the ES slot trips
   *       this regex sweep.
   *
   *   (3) Non-pending special-systems sections (none today, but a
   *       future batch may add them) must not silently inherit the
   *       `needsReview` flag. The set-equality check in (1) handles
   *       both directions.
   */
  const EXPECTED_NEEDS_REVIEW_SECTIONS = new Set<string>([
    'blood_sorcery::blood-sorcery-rituals',
    'thaumaturgy::thaumaturgy-paths',
    'thaumaturgy::thaumaturgy-rituals',
    'necromancy::necromancy-paths',
    'necromancy::necromancy-rituals',
    'oblivion::oblivion-ceremonies',
    'thin_blood_alchemy::thin-blood-alchemy-formulae',
  ]);

  it('the set of needsReview special-systems sections is the pinned Batch-Q list', () => {
    const actual = new Set<string>();
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (s.needsReview) actual.add(`${d.id}::${s.id}`);
      }
    }
    // Asymmetric-diff so the failure message lists exactly what
    // drifted, instead of just "sets differ".
    const added: string[] = [];
    const removed: string[] = [];
    for (const key of actual) if (!EXPECTED_NEEDS_REVIEW_SECTIONS.has(key)) added.push(key);
    for (const key of EXPECTED_NEEDS_REVIEW_SECTIONS) if (!actual.has(key)) removed.push(key);
    expect(
      { added, removed },
      'needsReview drift — update EXPECTED_NEEDS_REVIEW_SECTIONS only when the change is intentional',
    ).toEqual({ added: [], removed: [] });
  });

  it('every needsReview section description.es contains no leaked English work-in-progress wording', () => {
    // Case-insensitive regex matches against the ES description text.
    // These phrases would only appear if someone copy-pasted EN text
    // verbatim into the ES slot, or re-introduced the apologetic
    // "future content batch" tail Batch Q removed.
    const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
      { pattern: /\bneeds\s+review\b/i,        label: '"needs review"' },
      { pattern: /\bpending\s+review\b/i,      label: '"pending review"' },
      { pattern: /\bplaceholder\b/i,           label: '"placeholder"' },
      { pattern: /\bfuture\s+content\s+batch\b/i, label: '"future content batch"' },
    ];
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (!s.needsReview) continue;
        const es = s.description?.es ?? '';
        for (const { pattern, label } of FORBIDDEN) {
          expect(
            pattern.test(es),
            `${d.id}.${s.id}.description.es leaks English ${label} — the amber badge already conveys "pending"; describe the system in Spanish only`,
          ).toBe(false);
        }
      }
    }
  });

  it('every needsReview section item carries no placeholder "Needs review" name (defensive — items[] is currently empty)', () => {
    // Catches the *next* regression class: if a future content batch
    // populates `items` on a still-pending section, none of those
    // items should ship the literal "Needs review" string as their
    // visible name (that's a Batch K placeholder pattern, not a
    // real entry).
    const FORBIDDEN_NAME_PATTERNS = [/\bneeds\s+review\b/i, /\bplaceholder\b/i];
    for (const d of disciplines) {
      for (const s of d.specialSystems ?? []) {
        if (!s.needsReview) continue;
        for (const item of s.items) {
          for (const pattern of FORBIDDEN_NAME_PATTERNS) {
            expect(
              pattern.test(item.name),
              `${d.id}.${s.id}.${item.id}.name is a Batch-K-style placeholder — remove it or finish the item`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it('"needs_review" badge string is fully localized in EN and ES (Batch-Q badge guard)', () => {
    // The amber "Needs review / Necesita revisión" badge in the
    // disciplines page section header reads `strings.needs_review`,
    // which routes through `UI_STRINGS[lang]`. If a future i18n
    // refactor empties the ES slot, Spanish users would see the EN
    // fallback "Needs review" on a pending section under a Spanish
    // UI — exactly the leak Batch Q forbids.
    const en = (UI_STRINGS.en.needs_review || '').trim();
    const es = (UI_STRINGS.es.needs_review || '').trim();
    expect(en.length, 'UI_STRINGS.en.needs_review empty').toBeGreaterThan(0);
    expect(es.length, 'UI_STRINGS.es.needs_review empty — Spanish badge would fall back to English').toBeGreaterThan(0);
    expect(
      es,
      'UI_STRINGS.es.needs_review is a verbatim copy of EN — translate it',
    ).not.toBe(en);
  });

  it('discipline-level powers list on flat-powers disciplines is untouched (Batch-Q sanity guard)', () => {
    // Catches a future cleanup PR that accidentally clears a flat
    // powers list while editing pending sections. Every discipline
    // that historically shipped a flat L1–5 powers list still does.
    const FLAT_POWERS_DISCIPLINES = [
      'animalism', 'auspex', 'celerity', 'dominate', 'fortitude',
      'obfuscate', 'potence', 'presence', 'protean',
      'blood_sorcery', 'oblivion',
      'obtenebration', 'quietus', 'serpentis', 'vicissitude', 'chimerstry', 'valeren',
    ];
    for (const id of FLAT_POWERS_DISCIPLINES) {
      const d = disciplines.find(x => x.id === id);
      expect(d, `${id} missing from disciplines data`).toBeDefined();
      expect(
        d!.powers.length,
        `${id}.powers list collapsed — flat-powers disciplines must keep their L1–5 entries`,
      ).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('clan -> discipline consistency', () => {
  // Forward direction: every discipline a clan claims must exist in the
  // disciplines table AND must list the clan back in clansWhoUse. This is the
  // direction that drives the UI (clan pages, character creation suggestions),
  // so drift here breaks user-facing flows.
  it('every clan discipline resolves to a known discipline that lists the clan', () => {
    for (const clan of clans) {
      for (const dId of clan.disciplines) {
        const d = disciplines.find(x => x.id === dId);
        expect(d, `Clan ${clan.id} references unknown discipline ${dId}`).toBeDefined();
        expect(
          d!.clansWhoUse.includes(clan.id),
          `Discipline ${dId} is missing clan ${clan.id} in clansWhoUse`
        ).toBe(true);
      }
    }
  });

  it('no duplicate clan ids in any discipline.clansWhoUse', () => {
    for (const d of disciplines) {
      expect(
        new Set(d.clansWhoUse).size,
        `${d.id}.clansWhoUse has duplicates`
      ).toBe(d.clansWhoUse.length);
    }
  });
});

/**
 * Batch S — edition-aware clan discipline trios.
 *
 * Pins the visible per-edition discipline list for each clan whose
 * canonical trio differs between V20 (or earlier classic editions) and
 * V5 in a way the natural `discipline.editions` filter alone cannot
 * route correctly. Resolution goes through
 * `getClanDisciplinesForEdition`, the same helper the clans page and
 * the character sheet's `getSuggestedDisciplineIds` call.
 *
 * What this catches:
 *   - Per-edition trios drift on the five clans currently using
 *     `disciplinesByEdition` (Giovanni / Ravnos / Tzimisce / Salubri /
 *     Followers of Set).
 *   - V5-only disciplines (Blood Sorcery, Oblivion, Thin-Blood Alchemy)
 *     leaking into classic editions for ANY clan — universal
 *     anti-leak guard.
 *   - Classic-only disciplines (Thaumaturgy, Obtenebration, Necromancy,
 *     Vicissitude, Chimerstry, Quietus, Serpentis, Valeren) leaking
 *     into V5 — universal anti-leak guard.
 *
 * What this deliberately does NOT pin:
 *   - Clans whose flat list + natural `discipline.editions` filter
 *     already produces the right set (Brujah, Gangrel, Malkavian,
 *     Nosferatu, Toreador, Ventrue, Tremere, Lasombra, Banu Haqim).
 *     The universal anti-leak guard below would still flag any
 *     regression there.
 */
describe('edition-aware clan discipline trios (Batch S)', () => {
  const find = (id: string): ClanEntry => {
    const c = clans.find(x => x.id === id);
    if (!c) throw new Error(`fixture: missing clan ${id}`);
    return c;
  };

  type Case = { clan: string; ed: EditionId; expected: string[] };
  const cases: Case[] = [
    // Ravnos: V20 trio is Animalism / Chimerstry / Fortitude; V5
    // dropped Chimerstry and Fortitude for Animalism / Obfuscate /
    // Presence.
    { clan: 'ravnos', ed: 'V20', expected: ['animalism', 'chimerstry', 'fortitude'] },
    { clan: 'ravnos', ed: 'V5',  expected: ['animalism', 'obfuscate', 'presence'] },

    // Giovanni → Hecata. Completely different trios; this is the
    // headline Batch S fix — the prior data had V5 Hecata's
    // Auspex/Fortitude leaking into V20.
    { clan: 'giovanni', ed: 'V20', expected: ['dominate', 'necromancy', 'potence'] },
    { clan: 'giovanni', ed: 'V5',  expected: ['auspex', 'fortitude', 'oblivion'] },

    // Tzimisce: V20 keeps Auspex/Vicissitude; V5 swaps in
    // Dominate/Protean.
    { clan: 'tzimisce', ed: 'V20', expected: ['animalism', 'auspex', 'vicissitude'] },
    { clan: 'tzimisce', ed: 'V5',  expected: ['animalism', 'dominate', 'protean'] },

    // Salubri: V20 Auspex/Fortitude/Valeren; V5 Auspex/Dominate/
    // Fortitude. The prior data shipped Obfuscate for both, which is
    // wrong in either edition.
    { clan: 'salubri', ed: 'V20', expected: ['auspex', 'fortitude', 'valeren'] },
    { clan: 'salubri', ed: 'V5',  expected: ['auspex', 'dominate', 'fortitude'] },

    // Followers of Set → The Ministry. V20 keeps Serpentis; V5 swaps
    // Serpentis for Protean.
    { clan: 'followers_of_set', ed: 'V20', expected: ['obfuscate', 'presence', 'serpentis'] },
    { clan: 'followers_of_set', ed: 'V5',  expected: ['obfuscate', 'presence', 'protean'] },

    // Lasombra: V20 Dominate/Potence/Obtenebration; V5 Dominate/
    // Potence/Oblivion. Already correct via the natural
    // `discipline.editions` filter (Obtenebration is classic-only,
    // Oblivion is V5-only) — pinned here as a regression guard since
    // the user listed it as a manual-QA target.
    { clan: 'lasombra', ed: 'V20', expected: ['dominate', 'potence', 'obtenebration'] },
    { clan: 'lasombra', ed: 'V5',  expected: ['dominate', 'oblivion', 'potence'] },

    // Banu Haqim / Assamite: V20 Celerity/Obfuscate/Quietus; V5
    // Blood Sorcery/Celerity/Obfuscate. Already correct via
    // `discipline.editions`; pinned for the same reason as Lasombra.
    { clan: 'assamite', ed: 'V20', expected: ['celerity', 'obfuscate', 'quietus'] },
    { clan: 'assamite', ed: 'V5',  expected: ['blood_sorcery', 'celerity', 'obfuscate'] },

    // Thin-Blood: V5 only, single discipline (the alchemy itself).
    { clan: 'thin_blood', ed: 'V5', expected: ['thin_blood_alchemy'] },
  ];

  for (const c of cases) {
    it(`${c.clan} @ ${c.ed} → [${c.expected.join(', ')}]`, () => {
      const actual = getClanDisciplinesForEdition(find(c.clan), c.ed).slice().sort();
      const expected = c.expected.slice().sort();
      expect(actual).toEqual(expected);
    });
  }

  // Universal anti-leak guard. Catches the next regression class:
  // a V5-only discipline (or vice versa) accidentally appearing for
  // the wrong edition for ANY clan — even ones we haven't enumerated
  // above. Pure consistency between `discipline.editions` and what
  // the helper returns.
  it('V5-only disciplines never leak into classic editions for any clan', () => {
    const V5_ONLY = disciplines
      .filter(d => d.editions.length === 1 && d.editions[0] === 'V5')
      .map(d => d.id);
    const classicEditions: EditionId[] = ['1ST', '2ND', 'REVISED', 'V20'];
    for (const clan of clans) {
      for (const ed of classicEditions) {
        const got = getClanDisciplinesForEdition(clan, ed);
        for (const id of V5_ONLY) {
          expect(
            got.includes(id),
            `${clan.id} @ ${ed} should not include V5-only discipline ${id}`,
          ).toBe(false);
        }
      }
    }
  });

  it('classic-only disciplines never leak into V5 for any clan', () => {
    const classicOnly = disciplines
      .filter(d => d.editions.length > 0 && !d.editions.includes('V5'))
      .map(d => d.id);
    for (const clan of clans) {
      const got = getClanDisciplinesForEdition(clan, 'V5');
      for (const id of classicOnly) {
        expect(
          got.includes(id),
          `${clan.id} @ V5 should not include classic-only discipline ${id}`,
        ).toBe(false);
      }
    }
  });
});
