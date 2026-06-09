import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { clans } from "@/data/clans";
import { FEATURED_CLAN_IDS } from "@/data/featuredClans";
import { getClanDisplayName, getClanDisplayNameById, getText, getClanSummaryRecord } from "@/utils/content";
import { getCharacters } from "@/services/characterStorage";
import { getChronicles } from "@/services/chronicleStorage";
import { getAllChronicleSessions } from "@/services/chronicleSessionStorage";
import { getClanImageSrc, getClanHeroObjectPosition } from "@/utils/clanImage";
import type { Character, Chronicle, ChronicleSession, EditionId } from "@/types";
import {
  User, ScrollText, CalendarDays, BookOpen, Flame, ArrowRight, ChevronLeft, ChevronRight,
} from "lucide-react";

/*
 * Home featured-strip clan images.
 *
 * Previously this file carried a private `clanImages: Record<string, string>`
 * map that hard-coded the legacy `/images/<slug>.png` paths under canonical
 * clan ids. The map duplicated `clan.bannerImage` from `data/clans.ts`,
 * which made keeping the two sources of truth in sync error-prone.
 *
 * Batch M unified that path resolution into `utils/clanImage.ts`. The
 * featured strip now calls `getClanImageSrc(clan)` like every other
 * consumer; when final WebP files are dropped under
 * `public/images/clans/final/`, all three rendering sites pick them up
 * by flipping a single switch in the helper.
 */

// `FEATURED_CLAN_IDS` lives in `@/data/featuredClans` so the regression test
// can lock its ids against `clans.ts` without pulling in this React module.

/** Newer items first using `updatedAt` if present, otherwise `createdAt`. */
function byRecency<T extends { updatedAt?: string; createdAt?: string }>(a: T, b: T): number {
  const ta = Date.parse(a.updatedAt || a.createdAt || '') || 0;
  const tb = Date.parse(b.updatedAt || b.createdAt || '') || 0;
  return tb - ta;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const [characters, setCharacters] = useState<Character[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [sessions, setSessions] = useState<ChronicleSession[]>([]);

  useEffect(() => {
    try { setCharacters(getCharacters()); } catch { setCharacters([]); }
    try { setChronicles(getChronicles()); } catch { setChronicles([]); }
    try { setSessions(getAllChronicleSessions()); } catch { setSessions([]); }
  }, []);

  const recentCharacters = useMemo(() => [...characters].sort(byRecency).slice(0, 3), [characters]);
  const recentChronicles = useMemo(() => [...chronicles].sort(byRecency).slice(0, 3), [chronicles]);
  const recentSessions = useMemo(() => [...sessions].sort(byRecency).slice(0, 3), [sessions]);
  const continueCharacter = recentCharacters[0];

  const chronicleNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of chronicles) m.set(c.id, c.name);
    return m;
  }, [chronicles]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setLocation('/buscar');
  };

  const openCharacter = (id: string) => {
    try { sessionStorage.setItem('vtm-open-character-id', id); } catch { /* ignore */ }
    setLocation('/personaje');
  };

  const openChronicle = (id: string, tab: 'overview' | 'sessions' = 'overview') => {
    try {
      sessionStorage.setItem('vtm-open-chronicle-id', id);
      sessionStorage.setItem('vtm-open-chronicle-tab', tab);
    } catch { /* ignore */ }
    setLocation('/cronica');
  };

  const featuredClans = FEATURED_CLAN_IDS
    .map(id => clans.find(c => c.id === id))
    .filter(Boolean) as typeof clans;

  // Clan strip horizontal scroller — programmatic scroll for desktop chevron
  // buttons. The native scrollbar is hidden via Tailwind utilities below.
  const clanScrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollClanStrip = (dir: 1 | -1) => {
    const el = clanScrollerRef.current;
    if (!el) return;
    // Roughly one card + gap; uses clientWidth so the step scales with viewport.
    const step = Math.max(280, Math.round(el.clientWidth * 0.7));
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  const clanIcon = (clanId: string | undefined) => {
    if (!clanId) return '🦇';
    return clans.find(c => c.id === clanId)?.icon || '🦇';
  };

  // Batch AU (post-review rework) — "At the Table" play-support helpers.
  //
  // The earlier Recommended-Next iteration duplicated the Continue card,
  // Recent Activity rows, and the Tools nav card. Manual review asked for
  // a section that complements (not repeats) the rest of Home, so this
  // bottom row is now a fixed set of edition-aware rules/play references:
  //
  //   • V5:       Dice & Rouse Check, Hunger, Willpower, Humanity, Health
  //   • Classic:  Dice,               Blood Pool, Willpower, Humanity, Health
  //
  // Card titles are kept short to avoid mid-row truncation on the 5-up
  // desktop grid; the longer concepts ("Path", "damage tracks", "soak")
  // live in the subtitle, which is line-clamped to 2 lines.
  //
  // No character/chronicle/session data flows through these cards on
  // purpose — the top of Home already covers "continue / resume" via the
  // hero card and Recent Activity columns. The Tools/Rules/Disciplines
  // secondary rail above still owns broad navigation; this row is for the
  // specific rules a Storyteller or player reaches for during a session.
  //
  // Rule-id deep links exist for everything except the dice cards (the
  // Tools page itself is the play surface for dice and the V5 Rouse Check
  // card), which is the routing the brief asked us to use.
  const atTheTable = useMemo(() => {
    const isV5 = activeEdition === 'V5';

    type AtCard = {
      key: string;
      icon: string;
      title: string;
      subtitle: string;
      onClick: () => void;
    };

    if (isV5) {
      return [
        {
          key: 'dice-rouse',
          icon: 'casino',
          title: strings.home_at_dice_rouse_title || 'Dice & Rouse Check',
          subtitle: strings.home_at_dice_subtitle || 'Open the dice roller and play helpers.',
          onClick: () => setLocation('/compendium/herramientas'),
        },
        {
          key: 'hunger',
          icon: 'bloodtype',
          title: strings.hunger || 'Hunger',
          subtitle: strings.home_at_hunger_subtitle || 'How V5 Hunger feeds the Beast.',
          onClick: () => setLocation('/compendium/reglas/hunger-dice'),
        },
        {
          key: 'willpower',
          icon: 'psychology',
          title: strings.willpower || 'Willpower',
          subtitle: strings.home_at_willpower_subtitle || 'Resolve, resisting frenzy, rerolls.',
          onClick: () => setLocation('/compendium/reglas/willpower'),
        },
        {
          key: 'humanity',
          icon: 'heart_broken',
          title: strings.humanity || 'Humanity',
          subtitle: strings.home_at_humanity_subtitle || 'Tracking conscience and stains.',
          onClick: () => setLocation('/compendium/reglas/humanity-loss'),
        },
        {
          key: 'health',
          icon: 'healing',
          title: strings.health || 'Health',
          subtitle: strings.home_at_health_subtitle || 'Damage tracks, soak, and healing.',
          onClick: () => setLocation('/compendium/reglas/healing-v5'),
        },
      ] satisfies AtCard[];
    }

    // V20 / REVISED / 2ND / 1ST — classic play support set. Rouse Check is
    // omitted by design (it does not exist outside V5), Hunger swaps to
    // Blood Pool, and Willpower / Humanity / Health route to the classic
    // rule splits.
    return [
      {
        key: 'dice',
        icon: 'casino',
        title: strings.home_topic_dice || 'Dice',
        subtitle: strings.home_at_dice_subtitle || 'Open the dice roller and play helpers.',
        onClick: () => setLocation('/compendium/herramientas'),
      },
      {
        key: 'blood-pool',
        icon: 'bloodtype',
        title: strings.home_topic_blood_pool || 'Blood Pool',
        subtitle: strings.home_at_blood_pool_subtitle || 'How classic Blood points are spent.',
        onClick: () => setLocation('/compendium/reglas/blood-pool'),
      },
      {
        key: 'willpower',
        icon: 'psychology',
        title: strings.willpower || 'Willpower',
        subtitle: strings.home_at_willpower_subtitle || 'Resolve, resisting frenzy, rerolls.',
        onClick: () => setLocation('/compendium/reglas/willpower-classic'),
      },
      {
        key: 'humanity',
        icon: 'heart_broken',
        title: strings.humanity || 'Humanity',
        subtitle: strings.home_at_humanity_classic_subtitle || 'Conscience, morality, or the chosen Path.',
        onClick: () => setLocation('/compendium/reglas/humanity-classic'),
      },
      {
        key: 'health',
        icon: 'healing',
        title: strings.health || 'Health',
        subtitle: strings.home_at_health_subtitle || 'Damage tracks, soak, and healing.',
        onClick: () => setLocation('/compendium/reglas/healing-classic'),
      },
    ] satisfies AtCard[];
  }, [activeEdition, strings, setLocation]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col gap-8">

      {/* Compact search bar */}
      <section className="w-full">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-primary-container transition-colors text-xl">search</span>
          </div>
          <input
            className="w-full bg-black border border-zinc-900 py-3 pl-12 pr-4 text-on-surface focus:ring-0 focus:border-primary-container/60 outline-none font-serif text-base placeholder:text-zinc-700 transition-colors"
            placeholder={strings.searchGlobalPlaceholder}
            type="text"
            onKeyDown={handleSearchKeyDown}
            onClick={() => setLocation('/buscar')}
          />
        </div>
      </section>

      {/* Continue card + Quick Actions side-by-side on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {continueCharacter ? (
          <button
            type="button"
            onClick={() => openCharacter(continueCharacter.id)}
            className="lg:col-span-2 text-left bg-gradient-to-br from-primary/15 via-zinc-950 to-zinc-950 border border-primary/30 hover:border-primary/60 transition-colors p-5 group flex items-center gap-4"
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-primary/15 border border-primary/40 text-2xl">
              {clanIcon(continueCharacter.clan)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-primary-container mb-0.5">
                {strings.home_continue || 'Continue'}
              </p>
              <h3 className="font-serif text-xl md:text-2xl text-on-surface truncate">
                {continueCharacter.name?.trim() || (strings.unnamed_character || 'Unnamed Character')}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                {getClanDisplayNameById(continueCharacter.clan, continueCharacter.edition as EditionId, activeLanguage)}
                <span className="mx-2 text-zinc-700">•</span>
                <span className="uppercase tracking-wider text-[9px] border border-zinc-700 px-1 rounded bg-zinc-900 text-zinc-300">
                  {continueCharacter.edition}
                </span>
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary-container shrink-0" aria-hidden="true" />
          </button>
        ) : (
          // Empty-state placeholder keeps the row balanced when there's no character yet.
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-primary-container mb-0.5">
                {strings.home_continue || 'Continue'}
              </p>
              <p className="text-sm text-zinc-400">
                {strings.home_empty_characters || 'No characters yet. Create your first one.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLocation('/personaje')}
              className="text-xs uppercase tracking-widest font-semibold text-primary-container hover:opacity-80 transition-opacity flex items-center gap-1.5"
            >
              {strings.home_action_new_character || 'New character'}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Quick Actions — compact column on the right (desktop), grid on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          <QuickAction
            icon={<User className="w-4 h-4" />}
            label={strings.home_action_new_character || 'New character'}
            onClick={() => {
              try { sessionStorage.removeItem('vtm-open-character-id'); } catch { /* ignore */ }
              setLocation('/personaje');
            }}
          />
          <QuickAction
            icon={<ScrollText className="w-4 h-4" />}
            label={strings.home_action_new_chronicle || 'New chronicle'}
            onClick={() => {
              try {
                sessionStorage.removeItem('vtm-open-chronicle-id');
                sessionStorage.removeItem('vtm-open-chronicle-tab');
              } catch { /* ignore */ }
              setLocation('/cronica');
            }}
          />
          <QuickAction
            icon={<BookOpen className="w-4 h-4" />}
            label={strings.home_action_open_compendium || 'Open compendium'}
            onClick={() => setLocation('/compendium')}
          />
          <QuickAction
            icon={<Flame className="w-4 h-4" />}
            label={strings.home_action_browse_disciplines || 'Browse disciplines'}
            onClick={() => setLocation('/compendium/disciplinas')}
          />
        </div>
      </section>

      {/* Recent Activity — three columns on desktop, stacked on mobile.
          Each column is small: header + up to 3 rows + View all link. */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RecentColumn
          title={strings.home_recent_characters || 'Recent characters'}
          icon={<User className="w-4 h-4 text-primary-container" aria-hidden="true" />}
          viewAllLabel={strings.home_view_all || 'View all'}
          onViewAll={() => setLocation('/personaje')}
          emptyMessage={strings.home_empty_characters || 'No characters yet. Create your first one.'}
          items={recentCharacters}
          renderRow={(c) => (
            <RecentRow
              key={c.id}
              onClick={() => openCharacter(c.id)}
              leading={<span className="text-base shrink-0" aria-hidden="true">{clanIcon(c.clan)}</span>}
              title={c.name?.trim() || (strings.unnamed_character || 'Unnamed Character')}
              subtitle={
                <>
                  {getClanDisplayNameById(c.clan, c.edition as EditionId, activeLanguage)}
                  <span className="mx-1.5 text-zinc-700">•</span>
                  <span className="uppercase tracking-wider text-[9px] border border-zinc-800 px-1 rounded bg-zinc-900 text-zinc-400">
                    {c.edition}
                  </span>
                </>
              }
            />
          )}
        />

        <RecentColumn
          title={strings.home_recent_chronicles || 'Recent chronicles'}
          icon={<ScrollText className="w-4 h-4 text-primary-container" aria-hidden="true" />}
          viewAllLabel={strings.home_view_all || 'View all'}
          onViewAll={() => setLocation('/cronica')}
          emptyMessage={strings.home_empty_chronicles || 'No chronicles yet. Create your first one.'}
          items={recentChronicles}
          renderRow={(chr) => (
            <RecentRow
              key={chr.id}
              onClick={() => openChronicle(chr.id, 'overview')}
              leading={<ScrollText className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />}
              title={chr.name}
              subtitle={
                <>
                  {chr.edition && (
                    <span className="uppercase tracking-wider text-[9px] border border-zinc-800 px-1 rounded bg-zinc-900 text-zinc-400 mr-1.5">
                      {chr.edition}
                    </span>
                  )}
                  {chr.setting || chr.description || ''}
                </>
              }
            />
          )}
        />

        <RecentColumn
          title={strings.home_recent_sessions || 'Recent sessions'}
          icon={<CalendarDays className="w-4 h-4 text-primary-container" aria-hidden="true" />}
          viewAllLabel={strings.home_view_all || 'View all'}
          onViewAll={() => setLocation('/cronica')}
          emptyMessage={strings.home_empty_sessions || 'No sessions recorded yet.'}
          items={recentSessions}
          renderRow={(s) => {
            const chrName = chronicleNameById.get(s.chronicleId);
            const date = s.sessionDate || s.updatedAt;
            const dateLabel = date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            return (
              <RecentRow
                key={s.id}
                onClick={() => openChronicle(s.chronicleId, 'sessions')}
                leading={<CalendarDays className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />}
                title={s.title}
                subtitle={
                  <>
                    {chrName && (
                      <>
                        <span>{strings.home_session_in || 'in'} </span>
                        <span className="text-zinc-300">{chrName}</span>
                      </>
                    )}
                    {dateLabel && (
                      <>
                        {chrName && <span className="mx-1.5 text-zinc-700">•</span>}
                        <span>{dateLabel}</span>
                      </>
                    )}
                  </>
                }
              />
            );
          }}
        />
      </section>

      {/* Clan Scroll — hero visuals, brought back near the top of the page. */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-on-surface uppercase tracking-tight">{strings.clansTitle}</h2>
          <Link href="/compendium/clanes">
            <span className="text-primary-container font-sans text-xs font-semibold tracking-widest flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity uppercase">
              {strings.viewAll} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>
        <div className="relative group/clanstrip">
          {/* Left edge fade — purely visual, never blocks clicks. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-neutral-950 to-transparent"
          />
          {/* Right edge fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-neutral-950 to-transparent"
          />

          {/* Desktop-only chevron controls. Hidden on touch viewports where
              users can swipe naturally. */}
          <button
            type="button"
            aria-label={strings.previous || 'Previous'}
            onClick={() => scrollClanStrip(-1)}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/70 border border-zinc-800 text-zinc-300 hover:text-on-surface hover:border-primary-container/60 hover:bg-black/90 backdrop-blur transition-colors opacity-0 group-hover/clanstrip:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={strings.next || 'Next'}
            onClick={() => scrollClanStrip(1)}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-black/70 border border-zinc-800 text-zinc-300 hover:text-on-surface hover:border-primary-container/60 hover:bg-black/90 backdrop-blur transition-colors opacity-0 group-hover/clanstrip:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Native scrollbar fully hidden across browsers; horizontal scroll
              still works via wheel, touch, and the chevron buttons above. */}
          <div
            ref={clanScrollerRef}
            className="flex overflow-x-auto gap-5 pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {featuredClans.map(clan => {
            const clanName = getClanDisplayName(clan, activeEdition, activeLanguage);
            // Batch T: featured-tile description uses the edition-aware
            // summary record, so future per-edition pitch overrides
            // (when added) flow through here as well. No current clan
            // overrides `summary`, so this is a no-op today but keeps
            // the featured strip aligned with the card grid and clan
            // detail dialog.
            const clanDesc = getText(getClanSummaryRecord(clan, activeEdition), activeLanguage) || '';
            return (
              <Link key={clan.id} href={`/compendium/clanes/${clan.id}`}>
                <div className="flex-none w-52 sm:w-64 snap-start bg-zinc-950 border border-zinc-900 group relative overflow-hidden cursor-pointer">
                  {/*
                    Home featured-clan tile. Restored color in Batch N
                    follow-up: `grayscale contrast-125` removed; the dark
                    bottom gradient overlay + 0.60 opacity still keep the
                    title readable while letting the clan art's color
                    come through.

                    `object-position` is now sourced from the
                    `CLAN_HERO_OBJECT_POSITION` map (default `'50% 50%'`),
                    so per-clan tuning here, the clans-list card, and
                    the clan detail dialog all share one source of truth.
                  */}
                  <div className="h-60 sm:h-72 relative bg-zinc-950">
                    <img
                      src={getClanImageSrc(clan)}
                      alt={clanName}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      style={{ objectPosition: getClanHeroObjectPosition(clan.id) }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-0 p-4 sm:p-5 w-full">
                    <p className="font-sans text-[10px] sm:text-xs font-semibold text-primary-container tracking-[0.2em] mb-1 uppercase">{strings.clanLabel}</p>
                    <h3 className="font-serif text-2xl sm:text-3xl leading-none text-on-surface mb-1.5 font-semibold tracking-tight uppercase break-words">{clanName}</h3>
                    <p className="text-zinc-400 font-sans text-xs line-clamp-2">{clanDesc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        </div>
      </section>

      {/* Batch AT — Rules Quick Access gateway.
          Replaces the prior scattered bento grid (Combat Summary + Disciplines
          + Clans + Humanity tiles) with a clearer hierarchy:
            primary "Core Rules" card  →  secondary nav cards  →  topic chips.
          The chips are edition-aware where the underlying rule is split
          (Willpower/Humanity/Healing have V5 vs classic variants). */}
      <section data-testid="home-rules-quick-access">
        <div className="flex items-end justify-between mb-4 gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-on-surface uppercase tracking-tight">
              {strings.home_rules_quick_title || 'Rules Quick Access'}
            </h2>
            <p className="text-zinc-400 font-sans text-xs sm:text-sm mt-1">
              {strings.home_rules_quick_subtitle || 'Find the most used rules, references, and play tools.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLocation('/compendium')}
            className="text-primary-container font-sans text-xs font-semibold tracking-widest hidden sm:flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity uppercase whitespace-nowrap shrink-0"
          >
            {strings.home_action_open_compendium || 'Open compendium'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Primary card — Core Rules. Spans 2/3 of the row on desktop so it
              reads as the obvious entry point and the secondary cards form a
              balanced rail on the side. */}
          <button
            type="button"
            onClick={() => setLocation('/compendium/reglas')}
            data-testid="home-rules-core"
            className="md:col-span-2 text-left bg-gradient-to-br from-primary/15 via-zinc-900 to-zinc-900 border border-primary/30 hover:border-primary/60 transition-colors p-6 flex flex-col justify-between group relative overflow-hidden min-h-[180px]"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 text-[80px] leading-none material-symbols-outlined" aria-hidden="true">menu_book</div>
            <div>
              <span className="material-symbols-outlined text-primary-container mb-3 text-2xl" aria-hidden="true">menu_book</span>
              <h3 className="font-serif text-2xl uppercase mb-2 text-on-surface">{strings.home_rules_core_title || 'Core Rules'}</h3>
              <p className="text-zinc-400 font-sans text-sm max-w-md">
                {strings.home_rules_core_desc || 'Combat, dice, damage, Hunger or Blood Pool, Willpower, and Humanity or Path.'}
              </p>
            </div>
            <span className="w-fit text-on-surface font-sans text-xs font-semibold uppercase tracking-widest border-b border-zinc-700 pb-1 mt-4 group-hover:border-primary-container transition-colors flex items-center gap-2">
              {strings.home_rules_core_action || 'Open rules'}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </button>

          {/* Secondary rail — three small nav cards. On mobile they stack to
              three rows; on small tablets they go horizontal; on desktop they
              return to a vertical column beside the primary card. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-3">
            <SecondaryNavCard
              icon="auto_fix_high"
              title={strings.disciplinesTitle}
              description={strings.home_rules_disciplines_desc || 'Mystical powers of the Blood.'}
              onClick={() => setLocation('/compendium/disciplinas')}
              testId="home-rules-disciplines"
            />
            <SecondaryNavCard
              icon="groups"
              title={strings.clansTitle}
              description={strings.home_rules_clans_desc || 'Lineages and their gifts.'}
              onClick={() => setLocation('/compendium/clanes')}
              testId="home-rules-clans"
            />
            <SecondaryNavCard
              icon="casino"
              title={strings.toolsTitle}
              description={strings.home_rules_tools_desc || 'Trackers, dice, and play helpers.'}
              onClick={() => setLocation('/compendium/herramientas')}
              testId="home-rules-tools"
            />
          </div>
        </div>

        {/* Batch AU (post-review) — "At the Table" play-support row.
            Replaces the prior Recommended-Next cards (which duplicated
            Continue / Recent Activity / Tools). This row is a fixed set
            of edition-aware rules and play helpers — five cards, no data
            duplication, no usage tracking. See `atTheTable` above for
            per-edition card composition. */}
        <div className="mt-5" data-testid="home-at-table">
          <p className="text-[10px] font-sans font-semibold tracking-[0.2em] uppercase text-primary-container mb-1">
            {strings.home_at_table_title || 'At the Table'}
          </p>
          <p className="text-zinc-400 font-sans text-xs mb-3">
            {strings.home_at_table_subtitle || 'Fast references and play helpers for the current edition.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {atTheTable.map(card => (
              <RecommendationCard
                key={card.key}
                icon={card.icon}
                title={card.title}
                subtitle={card.subtitle}
                onClick={card.onClick}
                testId={`home-at-${card.key}`}
              />
            ))}
          </div>
        </div>

        {/* Mobile-only Open Compendium link — the header chip is hidden on
            narrow screens to keep the title/subtitle uncrowded, so we surface
            it again at the bottom of this section. */}
        <button
          type="button"
          onClick={() => setLocation('/compendium')}
          className="sm:hidden mt-4 text-primary-container font-sans text-xs font-semibold tracking-widest flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity uppercase"
        >
          {strings.home_action_open_compendium || 'Open compendium'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </section>

      {/* Quote footer */}
      <div className="text-center mb-2">
        <p className="text-sm font-serif text-zinc-500 italic">
          {strings.quote_footer}
        </p>
      </div>

    </div>
  );
}

interface SecondaryNavCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  testId?: string;
}

function SecondaryNavCard({ icon, title, description, onClick, testId }: SecondaryNavCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="text-left bg-zinc-900 border border-zinc-800 p-4 hover:border-primary-container transition-colors group flex items-start gap-3 min-h-[88px]"
    >
      <span className="material-symbols-outlined text-primary-container text-2xl shrink-0" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-base sm:text-lg uppercase text-on-surface group-hover:text-primary-container transition-colors leading-tight">{title}</h3>
        <p className="text-zinc-400 font-sans text-xs mt-1 line-clamp-2">{description}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-primary-container shrink-0 mt-1" aria-hidden="true" />
    </button>
  );
}

interface RecommendationCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  testId?: string;
}

/**
 * Compact recommendation card used by the Home "Recommended Next" row.
 *
 * Visually a sibling of `SecondaryNavCard` but lighter and tuned for the
 * dense 4-up desktop grid; subtitles can carry a dynamic name (character /
 * chronicle / session) and are clamped to two lines to keep the row even.
 */
function RecommendationCard({ icon, title, subtitle, onClick, testId }: RecommendationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="text-left bg-zinc-950 border border-zinc-900 p-3 hover:border-primary-container hover:bg-zinc-900/60 transition-colors group flex items-start gap-2.5 min-h-[68px]"
    >
      <span className="material-symbols-outlined text-primary-container text-xl shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        <h4 className="font-serif text-sm text-on-surface group-hover:text-primary-container transition-colors leading-tight truncate">{title}</h4>
        <p className="text-zinc-400 font-sans text-[11px] mt-0.5 line-clamp-2">{subtitle}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-primary-container shrink-0 mt-1" aria-hidden="true" />
    </button>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 bg-zinc-950 border border-zinc-900 hover:border-primary/40 hover:bg-zinc-900/60 transition-colors px-3 py-2.5 text-left group"
    >
      <span className="w-7 h-7 flex items-center justify-center rounded bg-primary/10 border border-primary/30 text-primary-container shrink-0">
        {icon}
      </span>
      <span className="text-xs sm:text-sm font-sans text-on-surface group-hover:text-primary-container transition-colors truncate">
        {label}
      </span>
    </button>
  );
}

interface RecentColumnProps<T> {
  title: string;
  icon: React.ReactNode;
  viewAllLabel: string;
  onViewAll: () => void;
  emptyMessage: string;
  items: T[];
  renderRow: (item: T) => React.ReactNode;
}

function RecentColumn<T>({ title, icon, viewAllLabel, onViewAll, emptyMessage, items, renderRow }: RecentColumnProps<T>) {
  return (
    <div className="bg-zinc-950/60 border border-zinc-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className="font-serif text-sm uppercase tracking-widest text-on-surface truncate">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[10px] uppercase tracking-widest font-semibold text-primary-container hover:opacity-80 transition-opacity flex items-center gap-1 shrink-0"
        >
          {viewAllLabel} <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-xs text-zinc-500 italic">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-zinc-900">
            {items.map(item => (
              <li key={(item as { id?: string }).id ?? Math.random()}>{renderRow(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface RecentRowProps {
  leading?: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
  onClick: () => void;
}

function RecentRow({ leading, title, subtitle, onClick }: RecentRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 hover:bg-zinc-900/40 transition-colors flex items-start gap-2.5 group"
    >
      {leading}
      <div className="min-w-0 flex-1">
        <h4 className="font-serif text-sm text-on-surface truncate group-hover:text-primary-container transition-colors">{title}</h4>
        <p className="text-[11px] text-zinc-400 truncate">{subtitle}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-primary-container shrink-0 mt-1" aria-hidden="true" />
    </button>
  );
}
