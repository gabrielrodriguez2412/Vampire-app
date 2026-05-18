import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { disciplines } from "@/data/disciplines";
import { clans } from "@/data/clans";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { Input } from "@/components/ui/input";
import { Search, Flame } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, filterByEdition, isAvailableInLang, getClanDisplayNameById } from "@/utils/content";

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
    const nameMatch = d.name.toLowerCase().includes(filter.toLowerCase());
    const clanMatch = d.clansWhoUse.some(c => c.toLowerCase().includes(filter.toLowerCase()));
    return nameMatch || clanMatch;
  });

  const getClanName = (clanId: string) => {
    return getClanDisplayNameById(clanId, activeEdition, activeLanguage);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
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
              const isMissingLang = !isAvailableInLang(disc.description, activeLanguage);
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
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl font-serif text-foreground">{disc.name}</CardTitle>
                          <Badge variant="outline" className="text-xs font-mono text-muted-foreground border-muted-foreground/30">
                            {getText(disc.type, activeLanguage)}
                          </Badge>
                          {isMissingLang && (
                            <Badge variant="destructive" className="bg-red-900/40 text-red-300 border-red-900/50 text-[10px] ml-auto">
                              [ {strings.noTranslation} ]
                            </Badge>
                          )}
                        </div>
                        {getText(disc.description, activeLanguage) ? (
                          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
                            {getText(disc.description, activeLanguage)}
                          </p>
                        ) : (
                          <span className="text-xs text-amber-600/80 italic">[ {strings.noTranslation} ]</span>
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
                              {disc.powers.map(p => (
                                <div key={p.name} className="bg-background/50 rounded-lg p-4 border border-border/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-primary flex items-center gap-2">
                                      {p.name}
                                      <span className="flex gap-1 ml-2">
                                        {Array.from({length: 5}).map((_, i) => (
                                          <span key={i} className={`w-2 h-2 rounded-full ${i < p.level ? 'bg-primary' : 'bg-primary/20'}`} />
                                        ))}
                                      </span>
                                    </h4>
                                  </div>
                                  {getText(p.description, activeLanguage) ? (
                                    <p className="text-sm text-foreground/90 mb-2">{getText(p.description, activeLanguage)}</p>
                                  ) : (
                                    <span className="text-xs text-amber-600/80 italic block mb-2">[ {strings.noTranslation} ]</span>
                                  )}
                                  
                                  {getText(p.tacticalUse, activeLanguage) && (
                                    <p className="text-xs text-muted-foreground italic bg-black/20 p-2 rounded border border-white/5 mt-3">
                                      <span className="font-semibold text-foreground/70 not-italic mr-1">{strings.tacticalUse}</span> 
                                      {getText(p.tacticalUse, activeLanguage)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
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
