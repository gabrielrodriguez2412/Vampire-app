import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { clans } from "@/data/clans";
import { disciplines } from "@/data/disciplines";
import { ClanEntry, EditionId } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FavoriteButton } from "@/components/favorite-button";
import { ChevronLeft, Search as SearchIcon, X, ArrowUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import {
  getText,
  getLocalizedText,
  getClanDisplayName,
  getClanSect,
} from "@/utils/content";
import { getDisciplineDisplayName } from "@/utils/disciplineDisplay";
import { getClanImageSrc } from "@/utils/clanImage";
import {
  applyClanFilters,
  getActiveSectTokens,
  ClanSortKey,
  ClanSectToken,
} from "@/utils/clanFilter";

/**
 * Clans page.
 *
 * Mobile browse improvements (Batch C):
 *   - search input over name / sect / discipline (matches both active
 *     locale and English so a player can type either),
 *   - sort toggle: default order ↔ alphabetical,
 *   - sect filter chips, dynamically populated from the current
 *     edition (a chip only appears when at least one clan in that
 *     edition uses that sect),
 *   - "showing N of M" count so the user knows the filters are doing
 *     something.
 *
 * Visual behavior on mobile is preserved: one large card per row in
 * portrait (`grid-cols-1` until `sm`). The new controls sit above the
 * grid in a compact row that wraps to fit narrow viewports.
 *
 * Edition + language switches reset the search box and sect filter to
 * avoid stale-filter confusion ("why is my list empty after I changed
 * editions?"). Sort order is preserved.
 */
export default function Clans() {
  const [selectedClan, setSelectedClan] = useState<ClanEntry | null>(null);
  const [, setLocation] = useLocation();
  const params = useParams();

  const { activeLanguage, activeEdition, setEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  // Filter state, reset on edition / language change. Sort is sticky.
  const [search, setSearch] = useState("");
  const [sectFilter, setSectFilter] = useState<ClanSectToken>('all');
  const [sortKey, setSortKey] = useState<ClanSortKey>('default');

  useEffect(() => {
    setSearch("");
    setSectFilter('all');
  }, [activeEdition, activeLanguage]);

  const totalForEdition = useMemo(
    () => clans.filter(c => c.editionAvailability.includes(activeEdition)).length,
    [activeEdition],
  );

  const visibleClans = useMemo(
    () => applyClanFilters({
      clans,
      edition: activeEdition,
      lang: activeLanguage,
      search,
      sortKey,
      sectFilter,
    }),
    [activeEdition, activeLanguage, search, sortKey, sectFilter],
  );

  const sectTokens = useMemo(
    () => getActiveSectTokens(clans, activeEdition),
    [activeEdition],
  );

  useEffect(() => {
    if (params.id) {
      const clan = clans.find(c => c.id === params.id && c.editionAvailability.includes(activeEdition));
      if (clan) setSelectedClan(clan);
    }
  }, [params.id, activeEdition]);

  const handleDisciplineClick = (discId: string) => {
    setLocation(`/compendium/disciplinas/${discId}`);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedClan(null);
      setLocation('/compendium/clanes');
    }
  };

  const sortToggle = () => setSortKey(prev => prev === 'alpha' ? 'default' : 'alpha');

  const sectChipLabel = (token: ClanSectToken): string => {
    if (token === 'all') return strings.clans_sect_all || 'All';
    const key = `clans_sect_${token}`;
    return strings[key] || (token.charAt(0).toUpperCase() + token.slice(1));
  };

  return (
    <div className="p-6 md:p-10 short-landscape:p-3 max-w-[1200px] mx-auto w-full">
      <div className="mb-6 short-landscape:mb-3 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl short-landscape:text-2xl font-serif uppercase tracking-tight text-on-surface mb-2 short-landscape:mb-1">{strings.clansTitle}</h1>
          <p className="text-zinc-400 font-sans short-landscape:text-sm">{strings.clansSubtitle}</p>
          <div className="text-zinc-500 text-sm mt-2 short-landscape:mt-1 font-sans tracking-wide">
            {strings.showingLabel || 'Showing'}{' '}
            <strong className="text-on-surface">{visibleClans.length}</strong>
            {visibleClans.length !== totalForEdition && (
              <>
                {' '}<span className="text-zinc-600">{strings.clans_of_label || 'of'}</span>{' '}
                <strong className="text-on-surface">{totalForEdition}</strong>
              </>
            )}{' '}
            {strings.clansForLabel || 'clans for'}{' '}
            <strong className="text-on-surface uppercase">{activeEdition}</strong>
          </div>
        </div>
        <div>
          <select
            value={activeEdition}
            onChange={(e) => setEdition(e.target.value as EditionId)}
            className="bg-zinc-950 border border-zinc-800 text-on-surface px-4 py-2 font-serif uppercase text-sm focus:outline-none focus:border-zinc-500"
            aria-label={strings.edition || 'Edition'}
          >
            <option value="1ST">1st Edition</option>
            <option value="2ND">2nd Edition</option>
            <option value="REVISED">Revised Edition</option>
            <option value="V20">V20</option>
            <option value="V5">V5</option>
          </select>
        </div>
      </div>

      {/* Browse controls — search + sort + sect chips. */}
      <div className="mb-6 short-landscape:mb-3 space-y-3 short-landscape:space-y-2">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 min-w-0">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={strings.clans_search_placeholder || strings.search || 'Search clans, sect, discipline...'}
              className="pl-9 pr-9 bg-zinc-950 border-zinc-800 focus:border-zinc-500"
              aria-label={strings.clans_search_placeholder || strings.search || 'Search clans'}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={strings.clans_search_clear || 'Clear search'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={sortToggle}
            aria-pressed={sortKey === 'alpha'}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 border text-xs uppercase tracking-widest transition-colors ${
              sortKey === 'alpha'
                ? 'border-zinc-500 bg-zinc-900 text-on-surface'
                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-on-surface'
            }`}
            title={strings.clans_sort_toggle_hint || 'Toggle alphabetical sort'}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortKey === 'alpha'
              ? (strings.clans_sort_alpha || 'A–Z')
              : (strings.clans_sort_default || 'Default')}
          </button>
        </div>

        {sectTokens.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={strings.clans_sect_filter || 'Filter by sect'}>
            {sectTokens.map(token => {
              const active = sectFilter === token;
              return (
                <button
                  key={token}
                  type="button"
                  onClick={() => setSectFilter(token)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border transition-colors ${
                    active
                      ? 'border-zinc-500 bg-zinc-900 text-on-surface'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-on-surface'
                  }`}
                >
                  {sectChipLabel(token)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {visibleClans.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950 border border-zinc-900 mt-8">
          <span className="material-symbols-outlined text-5xl text-zinc-700 mb-4 block">groups_3</span>
          <h3 className="font-serif text-xl text-on-surface mb-2 uppercase tracking-wide">
            {totalForEdition === 0
              ? (strings.noClansForEdition || 'No clans for this edition')
              : (strings.clans_no_matches || strings.noResults || 'No matches')}
          </h3>
          <p className="text-zinc-500 max-w-md mx-auto font-sans text-sm">
            {totalForEdition === 0
              ? (strings.noClansForEdition || 'No clans for this edition')
              : (strings.clans_no_matches_hint || 'Try clearing the search or the sect filter.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 short-landscape:gap-3">
          {visibleClans.map((clan, i) => {
            // Card-level localization status (Batch G).
            //
            // Previous behavior: `!isAvailableInLang(summary, lang)` lit a
            // loud red "[Sin traducción]" badge on every Spanish card,
            // even though `getText` happily falls back to English and
            // the real card body shows readable English content. The
            // user perceived this as "every clan card is broken in
            // Spanish" — which it isn't.
            //
            // New behavior: resolve the summary through `getLocalizedText`
            // and only show a subtle "EN" pill when the fallback is
            // actually being rendered. If even English is missing the
            // pill is suppressed (the card body itself goes empty and
            // the existing empty-list fallback elsewhere handles it).
            const summaryStatus = getLocalizedText(clan.summary, activeLanguage);
            const dynamicName = getClanDisplayName(clan, activeEdition, activeLanguage);
            const sectLabel = getClanSect(clan, activeEdition, activeLanguage);

            return (
              <motion.div
                key={clan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.18) }}
              >
                <div
                  className="h-full bg-zinc-950 border border-zinc-900 cursor-pointer group flex flex-col relative"
                  style={{ borderBottomColor: clan.colorTheme }}
                  onClick={() => {
                    setSelectedClan(clan);
                    setLocation(`/compendium/clanes/${clan.id}`);
                  }}
                >
                  <div className="h-48 short-landscape:h-32 relative overflow-hidden border-b border-zinc-900">
                    <img
                      src={getClanImageSrc(clan)}
                      alt={dynamicName || clan.id}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                    <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                      <FavoriteButton id={clan.id} className="bg-black/50 hover:bg-black/80" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end">
                      <div>
                        <div className="text-[10px] font-sans font-bold uppercase tracking-widest mb-1" style={{ color: clan.colorTheme }}>
                          {sectLabel || strings.clans_sect_unknown || 'Unknown sect'}
                        </div>
                        <h3 className="font-serif text-3xl short-landscape:text-2xl leading-none text-on-surface tracking-tight uppercase flex items-center gap-2">
                          <span>{clan.icon}</span> {dynamicName}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 short-landscape:p-3 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-4 short-landscape:mb-2">
                      {clan.disciplines.filter(d => {
                        const discData = disciplines.find(disc => disc.id === d);
                        return discData ? discData.editions.includes(activeEdition) : false;
                      }).map(d => (
                        // Discipline chip now uses the language-aware
                        // display-name helper instead of rendering the
                        // raw lowercase id (`celerity` → `Celeridad` in
                        // ES, `Celerity` in EN). See
                        // `src/utils/disciplineDisplay.ts` for the
                        // mapping table.
                        <span key={d} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-sans text-zinc-300 uppercase tracking-widest">
                          {getDisciplineDisplayName(d, activeLanguage)}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-sans text-zinc-400 line-clamp-3 mb-4 short-landscape:mb-2 flex-1">
                      {summaryStatus.text}
                    </p>
                    {summaryStatus.usingFallback && (
                      // Subtle EN-fallback chip. Uses zinc tones (not
                      // red/amber) so it reads as informative metadata
                      // rather than an error. The pill is also a tooltip
                      // so a curious user can hover/long-press to see
                      // what it means without us crowding the card with
                      // a full sentence on every tile.
                      <span
                        className="bg-zinc-900/80 text-zinc-400 border border-zinc-800 mt-auto w-fit text-[10px] px-2 py-0.5 uppercase tracking-widest font-mono"
                        title={strings.content_english_fallback_notice || 'Showing English content'}
                      >
                        {strings.content_english_fallback_chip || 'EN'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedClan} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-900 p-0 overflow-hidden text-on-surface rounded-none short-landscape:max-h-[calc(100dvh-1rem)] short-landscape:top-[0.5rem] short-landscape:translate-y-0">
          {selectedClan && (
            <>
              <div className="h-1 w-full short-landscape:hidden" style={{ backgroundColor: selectedClan.colorTheme }} />
              <ScrollArea className="max-h-[85vh] short-landscape:max-h-[calc(100dvh-1.5rem)]">
                <div className="p-0">
                  {/*
                    Clan detail hero.

                    Phone-landscape (short-landscape) used to collapse the
                    banner to h-24, which left the back button at top-3 and
                    the title block at bottom-4 fighting for the same ~96px
                    of vertical space — the back chip overlapped the sect
                    pill, and the chevron + Spanish "Volver a clanes"
                    pushed against the clan icon. The fix gives landscape
                    its own complete layout: taller banner (h-32 = 128px),
                    shorter back chip flush to the top corner, title block
                    flush to the bottom corner with reduced font sizes,
                    smaller icon emoji (driven by font-size on the parent),
                    and a smaller favourite button so it stops dropping
                    onto a second row at narrow widths.
                  */}
                  <div className="relative h-52 sm:h-64 short-landscape:h-32 border-b border-zinc-900">
                    <img
                      src={getClanImageSrc(selectedClan)}
                      alt={getClanDisplayName(selectedClan, activeEdition, activeLanguage) || selectedClan.id}
                      className="w-full h-full object-cover opacity-40 grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>

                    {/* Back-to-Clans control. */}
                    <button
                      type="button"
                      onClick={() => handleClose(false)}
                      className="absolute top-3 left-3 sm:top-4 sm:left-5 short-landscape:top-1.5 short-landscape:left-1.5 inline-flex items-center gap-1.5 short-landscape:gap-1 h-8 short-landscape:h-7 px-2.5 short-landscape:px-2 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur border border-zinc-700/60 text-xs short-landscape:text-[10px] uppercase tracking-widest text-zinc-200 hover:text-on-surface transition-colors max-w-[55%] short-landscape:max-w-[40%] truncate"
                      aria-label={strings.back_to_clans || "Back to Clans"}
                    >
                      <ChevronLeft className="w-4 h-4 short-landscape:w-3.5 short-landscape:h-3.5 shrink-0" />
                      <span className="hidden xs:inline sm:inline truncate">{strings.back_to_clans || "Back to Clans"}</span>
                    </button>

                    {/* Title row. Stays flush-bottom on every viewport;
                        the favourite button anchors to the right and stops
                        the clan name from running into it via `min-w-0` on
                        the text column. */}
                    <div className="absolute bottom-4 left-5 right-5 sm:bottom-6 sm:left-8 sm:right-8 short-landscape:bottom-2 short-landscape:left-3 short-landscape:right-3 flex flex-wrap short-landscape:flex-nowrap justify-between items-end gap-3 short-landscape:gap-2">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm short-landscape:text-[10px] font-sans font-bold uppercase tracking-widest mb-1 short-landscape:mb-0 truncate" style={{ color: selectedClan.colorTheme }}>
                          {getClanSect(selectedClan, activeEdition, activeLanguage) || strings.clans_sect_unknown || 'Unknown sect'}
                        </div>
                        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl short-landscape:text-xl text-on-surface uppercase tracking-tight flex items-center gap-2 sm:gap-3 short-landscape:gap-1.5 break-words short-landscape:leading-none">
                          <span className="shrink-0">{selectedClan.icon}</span>
                          <span className="min-w-0 truncate">{getClanDisplayName(selectedClan, activeEdition, activeLanguage)}</span>
                        </h2>
                      </div>
                      <FavoriteButton
                        id={selectedClan.id}
                        className="bg-black/50 border border-zinc-800 shrink-0 short-landscape:h-7 short-landscape:w-7"
                      />
                    </div>
                  </div>

                  <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <div className="md:col-span-2 space-y-8 font-sans text-zinc-300">
                      {/*
                        Top-of-detail localization banner (Batch G).

                        Previously this fired whenever the active language
                        had no native summary, even when English fallback
                        was in fact being rendered below. Result: a loud
                        amber "Content not available" banner stacked on
                        top of perfectly readable English text — which
                        the user read as "the page is broken."

                        Now we read the resolved summary status. If we're
                        rendering English as a fallback the banner is a
                        quiet zinc one-liner; if the content is genuinely
                        absent in every supported language the banner
                        keeps the original amber treatment so the
                        developer notices.
                      */}
                      {(() => {
                        const summaryStatus = getLocalizedText(selectedClan.summary, activeLanguage);
                        if (summaryStatus.missing) {
                          return (
                            <div className="bg-amber-950/30 text-amber-500 p-3 text-xs border border-amber-900/50 uppercase tracking-widest">
                              {strings.contentUnavailable}
                            </div>
                          );
                        }
                        if (summaryStatus.usingFallback) {
                          return (
                            <div className="bg-zinc-900/50 text-zinc-400 p-2.5 text-[11px] border border-zinc-800 tracking-wide">
                              {strings.content_english_fallback_notice || 'Showing English content'}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <section>
                        <h3 className="font-serif text-xl mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2" style={{ color: selectedClan.colorTheme }}>
                          {strings.description || "Summary"}
                        </h3>
                        {(() => {
                          const status = getLocalizedText(selectedClan.summary, activeLanguage);
                          if (status.text === null) {
                            return <span className="text-xs text-zinc-500 italic">[{strings.noTranslation}]</span>;
                          }
                          return <p className="leading-relaxed">{status.text}</p>;
                        })()}
                      </section>

                      <section>
                        <h3 className="font-serif text-xl mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2" style={{ color: selectedClan.colorTheme }}>
                          {strings.clans_lore_heading || 'Lore'}
                        </h3>
                        {(() => {
                          const status = getLocalizedText(selectedClan.lore, activeLanguage);
                          if (status.text === null) {
                            return <span className="text-xs text-zinc-500 italic">[{strings.noTranslation}]</span>;
                          }
                          return <p className="leading-relaxed">{status.text}</p>;
                        })()}
                      </section>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-zinc-900 border p-5 relative mt-4" style={{ borderColor: `${selectedClan.colorTheme}40` }}>
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-950 px-2 font-serif uppercase tracking-widest text-sm whitespace-nowrap" style={{ color: selectedClan.colorTheme }}>
                          {strings.clans_bane_label || '— The Clan Bane —'}
                        </span>
                        <h4 className="font-serif text-lg text-on-surface mb-2 uppercase text-center mt-2">{strings.weakness}</h4>
                        {(() => {
                          // Same fallback-aware pattern as the summary
                          // and lore sections — render the text when
                          // available (native or English fallback), only
                          // show the "[no translation]" placeholder when
                          // both are empty.
                          const status = getLocalizedText(selectedClan.weakness, activeLanguage);
                          if (status.text === null) {
                            return <span className="text-xs text-zinc-500 italic text-center block">[{strings.noTranslation}]</span>;
                          }
                          return (
                            <p className="text-sm text-zinc-400 leading-relaxed text-center">
                              {status.text}
                            </p>
                          );
                        })()}
                      </div>

                      <div>
                        <h4 className="font-serif text-lg mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2" style={{ color: selectedClan.colorTheme }}>
                          {strings.disciplinesLabel}
                        </h4>
                        <div className="flex flex-col gap-2">
                          {selectedClan.disciplines.filter(d => {
                            const discData = disciplines.find(disc => disc.id === d);
                            return discData ? discData.editions.includes(activeEdition) : false;
                          }).map(d => (
                            // Same display-name treatment as the card
                            // grid above — `{d}` was the raw id.
                            <div
                              key={d}
                              className="bg-zinc-900 border border-zinc-800 px-4 py-3 font-sans text-sm text-zinc-300 hover:text-on-surface cursor-pointer transition-colors flex justify-between items-center group"
                              onClick={() => handleDisciplineClick(d)}
                            >
                              <span className="uppercase tracking-widest">{getDisciplineDisplayName(d, activeLanguage)}</span>
                              <span className="material-symbols-outlined text-xs text-zinc-600 group-hover:text-white">arrow_forward</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
