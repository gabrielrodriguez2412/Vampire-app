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
  User, ScrollText, CalendarDays, BookOpen, Users, Flame, ArrowRight, ChevronLeft, ChevronRight,
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

      {/* Dark Protocols Bento Grid — kept compact via shorter row height. */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-on-surface uppercase tracking-tight">{strings.rulesTitle}</h2>
          <button
            type="button"
            onClick={() => setLocation('/compendium')}
            className="text-primary-container font-sans text-xs font-semibold tracking-widest flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity uppercase"
          >
            {strings.home_action_open_compendium || 'Open compendium'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:h-[320px]">
          <div
            className="md:col-span-2 md:row-span-2 bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer"
            onClick={() => setLocation('/compendium/reglas/combat-overview')}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 text-[80px] leading-none material-symbols-outlined">swords</div>
            <div>
              <span className="material-symbols-outlined text-primary-container mb-3 text-2xl">swords</span>
              <h3 className="font-serif text-2xl mb-2 uppercase">{strings.combatSummary}</h3>
              <p className="text-zinc-400 font-sans text-sm max-w-sm">{strings.combatDesc}</p>
            </div>
            <button className="w-fit text-on-surface font-sans text-xs font-semibold uppercase tracking-widest border-b border-zinc-700 pb-1 mt-3 group-hover:border-primary-container transition-colors">
              {strings.openProtocols}
            </button>
          </div>

          <div
            className="bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer"
            onClick={() => setLocation('/compendium/disciplinas')}
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl material-symbols-outlined">auto_fix_high</div>
            <h3 className="font-serif text-xl uppercase">{strings.disciplinesTitle}</h3>
            <span className="material-symbols-outlined text-primary-container text-2xl">auto_fix_high</span>
          </div>

          <div
            className="bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer"
            onClick={() => setLocation('/compendium/clanes')}
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 text-4xl">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="font-serif text-xl uppercase">{strings.clansTitle}</h3>
            <Users className="w-6 h-6 text-primary-container" aria-hidden="true" />
          </div>

          <div
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 p-6 flex items-center justify-between hover:border-primary-container transition-colors group cursor-pointer"
            onClick={() => setLocation(
              // After the Phase 2 rule split, humanity-loss is V5-only and
              // humanity-classic covers V20/Revised/2nd/1st. Send the user to
              // whichever rule actually applies to their selected edition.
              activeEdition === 'V5'
                ? '/compendium/reglas/humanity-loss'
                : '/compendium/reglas/humanity-classic'
            )}
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-3xl text-primary-container">heart_broken</span>
              <div>
                <h3 className="font-serif text-xl uppercase">{strings.humanity}</h3>
                <p className="text-zinc-400 font-sans text-xs">{strings.humanityDesc}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-zinc-700 group-hover:text-on-surface transition-colors">chevron_right</span>
          </div>
        </div>
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
