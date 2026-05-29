import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { disciplines } from "@/data/disciplines";
import { clans } from "@/data/clans";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { BackLink } from "@/components/ui/back-link";
import { Input } from "@/components/ui/input";
import { Search, Flame } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, getLocalizedText, filterByEdition, getClanDisplayNameById } from "@/utils/content";
import {
  getDisciplineDisplayName,
  isDisciplineNameUsingFallback,
} from "@/utils/disciplineDisplay";
import {
  getDisciplinePowerName,
  isDisciplinePowerNameUsingFallback,
  getDisciplineTypeLabel,
} from "@/utils/disciplinePowerDisplay";

export default function Disciplines() {
  const [filter, setFilter] = useState("");
  const [, setLocation] = useLocation();
  const params = useParams();

  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  // Controlled accordion state — kept in sync with the URL param so external
  // deep links (clan page, favorites, search) open and scroll to the target
  // discipline even when the page is already mounted.
  const [openId, setOpenId] = useState<string | undefined>(params.id);
  useEffect(() => {
    setOpenId(params.id);
    if (!params.id) return;
    const targetId = params.id;
    // Use a manual scroll with a header offset (instead of scrollIntoView)
    // because:
    //  1. The sticky app header (~65px) would otherwise hide the card title.
    //  2. Radix's Accordion focuses the expanded trigger ("Powers") when
    //     the controlled value changes; the browser's focus auto-scroll can
    //     then push the discipline title above the viewport. The timeout
    //     lets that focus pass before we set the final scroll target.
    const HEADER_OFFSET = 80;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`disc-${targetId}`);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [params.id]);

  const filteredDiscs = filterByEdition(disciplines, activeEdition).filter(d => {
    // Search the active-language display name, the English display
    // name, and the raw data `name` so a Spanish user searching
    // "celeridad" matches even though the data still stores
    // "Celerity". Same fallback hierarchy as the title renderer
    // further down.
    const q = filter.toLowerCase();
    const localizedName = getDisciplineDisplayName(d.id, activeLanguage).toLowerCase();
    const englishName = getDisciplineDisplayName(d.id, 'en').toLowerCase();
    const dataName = d.name.toLowerCase();
    const nameMatch = localizedName.includes(q) || englishName.includes(q) || dataName.includes(q);
    const clanMatch = d.clansWhoUse.some(c => c.toLowerCase().includes(q));
    return nameMatch || clanMatch;
  });

  const getClanName = (clanId: string) => {
    return getClanDisplayNameById(clanId, activeEdition, activeLanguage);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <BackLink to="/compendium" label={strings.back_to_compendium || "Back to Compendium"} className="mb-4" />
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">{strings.disciplinesTitle}</h1>
        <p className="text-muted-foreground mb-6">{strings.disciplinesSubtitle}</p>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={strings.filterPlaceholder} 
            className="pl-9 bg-card border-border"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      {filteredDiscs.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg mt-8">
          <Flame className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-foreground mb-2">{strings.noDisciplines}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {strings.noResults}
          </p>
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={openId ?? ""}
          onValueChange={(val) => {
            setOpenId(val || undefined);
            setLocation(val ? `/compendium/disciplinas/${val}` : `/compendium/disciplinas`);
          }}
          className="space-y-6"
        >
          <AnimatePresence>
            {filteredDiscs.map((disc, i) => {
              // Batch H: replaced the old loud red "[ no translation ]"
              // badge with the same fallback-aware pattern Batch G
              // shipped for clan cards. The title chip shows a subtle
              // monospace "EN" pill only when the active locale lacks
              // a curated discipline name (i.e. the display-name
              // helper had to fall back to English). The description
              // block uses `getLocalizedText` so we can distinguish
              // "EN fallback rendering" (quiet zinc chip) from
              // "content truly missing" (amber italic placeholder).
              const displayName = getDisciplineDisplayName(disc.id, activeLanguage);
              const nameUsingFallback = isDisciplineNameUsingFallback(disc.id, activeLanguage);
              const descStatus = getLocalizedText(disc.description, activeLanguage);
              return (
                <motion.div
                  key={disc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                  id={`disc-${disc.id}`}
                  className="scroll-mt-24"
                >
                  <Card className="bg-card border-border overflow-hidden" data-testid={`discipline-card-${disc.id}`}>
                    <CardHeader className="bg-white/[0.02] border-b border-border pb-4 flex flex-row items-start justify-between">
                      <div className="w-full">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-2xl font-serif text-foreground">{displayName}</CardTitle>
                          {/* Type badge now resolves through the
                              dedicated helper. The data file stores
                              most discipline types via `fallbackStr`
                              which silently returned the English
                              string in non-EN locales; the helper
                              overrides with curated Spanish for the
                              priority disciplines and falls back to
                              `getText(disc.type, …)` for the rest. */}
                          <Badge variant="outline" className="text-xs font-mono text-muted-foreground border-muted-foreground/30">
                            {getDisciplineTypeLabel(disc.id, getText(disc.type, activeLanguage), activeLanguage)}
                          </Badge>
                          {nameUsingFallback && (
                            <span
                              className="bg-zinc-900/80 text-zinc-400 border border-zinc-800 text-[10px] px-2 py-0.5 uppercase tracking-widest font-mono ml-auto"
                              title={strings.content_english_fallback_notice || 'Showing English content'}
                            >
                              {strings.content_english_fallback_chip || 'EN'}
                            </span>
                          )}
                        </div>
                        {descStatus.text === null ? (
                          <span className="text-xs text-amber-600/80 italic">[ {strings.noTranslation} ]</span>
                        ) : (
                          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
                            {descStatus.text}
                          </p>
                        )}
                        {descStatus.usingFallback && descStatus.text !== null && (
                          <p className="text-[11px] text-zinc-500 italic mt-1">
                            {strings.content_english_fallback_notice || 'Showing English content'}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3 items-center">
                          <span className="text-xs text-muted-foreground">{strings.clansUsing}</span>
                          {disc.clansWhoUse.map(c => (
                            <Badge 
                              key={c} 
                              className="bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 border-none text-xs cursor-pointer"
                              onClick={() => setLocation(`/clanes/${c}`)}
                            >
                              {getClanName(c)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <FavoriteButton id={disc.id} />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      {disc.powers && disc.powers.length > 0 && (
                        <AccordionItem value={disc.id} className="border-b-0">
                          <AccordionTrigger className="px-6 py-4 hover:bg-white/[0.02] font-serif text-lg">
                            {strings.powers}
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 mt-2">
                              {disc.powers.map(p => {
                                // Resolve display title via Batch I helper.
                                // The key was previously `p.name` (the
                                // English data string); we switch to
                                // `${disc.id}-${p.level}` because (a) it
                                // is stable across locale changes and
                                // (b) every discipline that has powers
                                // covers L1–5 exactly once per the
                                // disciplines-data test, so the key is
                                // also unique within an accordion item.
                                const powerName = getDisciplinePowerName(
                                  disc.id,
                                  p.level,
                                  p.name,
                                  activeLanguage,
                                );
                                const powerNameUsingFallback = isDisciplinePowerNameUsingFallback(
                                  disc.id,
                                  p.level,
                                  activeLanguage,
                                );
                                const powerDescStatus = getLocalizedText(p.description, activeLanguage);
                                const powerTacticStatus = getLocalizedText(p.tacticalUse, activeLanguage);
                                return (
                                  <div key={`${disc.id}-${p.level}`} className="bg-background/50 rounded-lg p-4 border border-border/50">
                                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                      <h4 className="font-bold text-primary flex items-center gap-2 flex-wrap">
                                        {powerName}
                                        {powerNameUsingFallback && (
                                          <span
                                            className="bg-zinc-900/80 text-zinc-400 border border-zinc-800 text-[9px] px-1.5 py-0.5 uppercase tracking-widest font-mono"
                                            title={strings.content_english_fallback_notice || 'Showing English content'}
                                          >
                                            {strings.content_english_fallback_chip || 'EN'}
                                          </span>
                                        )}
                                        <span className="flex gap-1 ml-2">
                                          {Array.from({length: 5}).map((_, i) => (
                                            <span key={i} className={`w-2 h-2 rounded-full ${i < p.level ? 'bg-primary' : 'bg-primary/20'}`} />
                                          ))}
                                        </span>
                                      </h4>
                                    </div>
                                    {powerDescStatus.text === null ? (
                                      <span className="text-xs text-amber-600/80 italic block mb-2">[ {strings.noTranslation} ]</span>
                                    ) : (
                                      <p className="text-sm text-foreground/90 mb-2">{powerDescStatus.text}</p>
                                    )}
                                    {powerDescStatus.usingFallback && powerDescStatus.text !== null && (
                                      <p className="text-[10px] text-zinc-500 italic">
                                        {strings.content_english_fallback_notice || 'Showing English content'}
                                      </p>
                                    )}

                                    {powerTacticStatus.text !== null && (
                                      <p className="text-xs text-muted-foreground italic bg-black/20 p-2 rounded border border-white/5 mt-3">
                                        <span className="font-semibold text-foreground/70 not-italic mr-1">{strings.tacticalUse}</span>
                                        {powerTacticStatus.text}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Special systems — paths / rituals / ceremonies / formulae.
                          Each section is its own collapsible. Kept in a separate
                          local `type="multiple"` accordion so toggling one does
                          NOT interfere with the URL-synced outer Powers accordion
                          and multiple sections can be open at once. Starts
                          collapsed by default (no defaultValue). */}
                      {disc.specialSystems && disc.specialSystems.length > 0 && (
                        <div className="border-t border-border/40">
                          <Accordion type="multiple" className="px-6">
                            {disc.specialSystems.map(section => (
                              <AccordionItem key={section.id} value={section.id} className="border-b-0">
                                <AccordionTrigger className="py-4 hover:bg-white/[0.02] font-serif text-lg">
                                  <span className="flex items-center gap-2 flex-wrap">
                                    {getText(section.title, activeLanguage) || section.kind}
                                    {section.needsReview && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase tracking-widest border-amber-500/40 text-amber-300 bg-amber-950/20"
                                      >
                                        {strings.needs_review || "Needs review"}
                                      </Badge>
                                    )}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-6">
                                  {section.description && getText(section.description, activeLanguage) && (
                                    <p className="text-xs text-muted-foreground mb-3 max-w-3xl">
                                      {getText(section.description, activeLanguage)}
                                    </p>
                                  )}
                                  <div className="space-y-2">
                                    {section.items.map(item => (
                                      <div
                                        key={item.id}
                                        className="bg-background/50 rounded-lg px-3 py-2 border border-border/50 flex flex-col gap-1"
                                      >
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                          <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                                            {item.name}
                                            {item.needsReview && (
                                              <span className="text-[9px] uppercase tracking-widest border border-amber-500/40 text-amber-300 bg-amber-950/20 px-1 py-0.5 rounded">
                                                {strings.needs_review || "Needs review"}
                                              </span>
                                            )}
                                          </h4>
                                          {typeof item.level === 'number' && (
                                            <span className="flex gap-1">
                                              {Array.from({ length: 5 }).map((_, i) => (
                                                <span
                                                  key={i}
                                                  className={`w-2 h-2 rounded-full ${i < (item.level ?? 0) ? 'bg-primary' : 'bg-primary/20'}`}
                                                />
                                              ))}
                                            </span>
                                          )}
                                        </div>
                                        {getText(item.summary, activeLanguage) && (
                                          <p className="text-xs text-foreground/80">
                                            {getText(item.summary, activeLanguage)}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </Accordion>
      )}
    </div>
  );
}
