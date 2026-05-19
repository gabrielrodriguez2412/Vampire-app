import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { rules } from "@/data/rules";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS, RULE_CATEGORIES } from "@/i18n/ui";
import { getText, getTextArray, filterByEdition, isAvailableInLang } from "@/utils/content";

export default function Rules() {
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("__all__");
  const params = useParams();

  // Deep-link: when navigating to /compendium/reglas/:id, ensure the target
  // rule is included in the active filter (clear the category filter) and
  // scroll it into view. The Accordion is `type="multiple"` so we also seed
  // `openIds` with the target id so the body is already expanded on arrival.
  const [openIds, setOpenIds] = useState<string[]>(params.id ? [params.id] : []);
  useEffect(() => {
    if (!params.id) return;
    const targetId = params.id;
    setActiveCategory("__all__");
    setFilter("");
    setOpenIds(prev => (prev.includes(targetId) ? prev : [...prev, targetId]));
    // Defer scroll until the accordion has had a chance to expand so the
    // scroll target includes the open body height.
    const HEADER_OFFSET = 80;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`rule-${targetId}`);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [params.id]);

  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const catMap = RULE_CATEGORIES[activeLanguage] || RULE_CATEGORIES['en'];
  
  const editionRules = filterByEdition(rules, activeEdition);

  const categories = ["__all__", ...Array.from(new Set(editionRules.map(r => r.category)))];

  const filtered = editionRules.filter(r => {
    const titleText = getText(r.title, activeLanguage) || '';
    const shortText = getText(r.shortExplanation, activeLanguage) || '';
    
    const matchesFilter = titleText.toLowerCase().includes(filter.toLowerCase()) || 
                          shortText.toLowerCase().includes(filter.toLowerCase()) ||
                          r.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
    const matchesCategory = activeCategory === "__all__" || r.category === activeCategory;
    return matchesFilter && matchesCategory;
  });

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar/Top filter for categories */}
      <div className="w-full md:w-64 shrink-0 bg-card border-r border-border p-4 md:p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-primary mb-4">{strings.categories}</h2>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <button
                onClick={() => setActiveCategory("__all__")}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap ${
                  activeCategory === "__all__" 
                    ? "bg-primary/20 text-primary font-medium border border-primary/30" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                }`}
              >
                {strings.allCategories}
              </button>
            {categories.filter(c => c !== "__all__").map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap ${
                  activeCategory === cat 
                    ? "bg-primary/20 text-primary font-medium border border-primary/30" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                }`}
              >
                {catMap[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">{strings.rulesTitle}</h1>
            <p className="text-muted-foreground mb-6">{strings.rulesSubtitle}</p>
            
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={`${strings.search}`}
                className="pl-9 bg-card border-border"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Accordion
              type="multiple"
              value={openIds}
              onValueChange={setOpenIds}
              className="w-full space-y-4"
            >
              <AnimatePresence>
                {filtered.map((rule, i) => {
                  const isMissingLang = !isAvailableInLang(rule.shortExplanation, activeLanguage);
                  return (
                    <motion.div
                      key={rule.id}
                      id={`rule-${rule.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      layout
                      className="scroll-mt-24"
                    >
                      <AccordionItem value={rule.id} className="border border-border rounded-lg bg-card overflow-hidden">
                        <div className="flex items-center justify-between pr-4 bg-white/[0.01]">
                          <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-white/[0.02] flex-1 text-left">
                            <div className="flex flex-col items-start gap-1 w-full">
                              <div className="flex items-center gap-3 w-full">
                                <span className="font-serif text-lg text-foreground">{getText(rule.title, activeLanguage)}</span>
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0">{catMap[rule.category] || rule.category}</Badge>
                                {isMissingLang && (
                                  <Badge variant="destructive" className="bg-red-900/40 text-red-300 border-red-900/50 text-[10px] ml-auto shrink-0">
                                    [ {strings.noTranslation} ]
                                  </Badge>
                                )}
                              </div>
                              {getText(rule.shortExplanation, activeLanguage) ? (
                                <span className="text-sm text-muted-foreground font-normal text-left line-clamp-2 pr-4">{getText(rule.shortExplanation, activeLanguage)}</span>
                              ) : (
                                <span className="text-xs text-amber-600/80 italic">[ {strings.noTranslation} ]</span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <FavoriteButton id={rule.id} className="shrink-0" />
                        </div>
                        <AccordionContent className="px-4 pb-4 pt-2 border-t border-border bg-background/50">
                          <div className="space-y-4 pt-2">
                            {getText(rule.fullExplanation, activeLanguage) ? (
                              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                {getText(rule.fullExplanation, activeLanguage)}
                              </p>
                            ) : (
                              <span className="text-xs text-amber-600/80 italic block my-2">[ {strings.noTranslation} ]</span>
                            )}
                            
                            {getTextArray(rule.examples, activeLanguage) && (
                              <div className="bg-black/20 p-4 rounded-md border border-white/5">
                                <h4 className="text-primary font-serif text-sm mb-2">{strings.examples}</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                                  {getTextArray(rule.examples, activeLanguage)?.map((ex, idx) => (
                                    <li key={idx}>{ex}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {getTextArray(rule.quickNotes, activeLanguage) && (
                              <div>
                                <h4 className="text-muted-foreground text-xs uppercase tracking-wider mb-2 font-semibold">{strings.quickNotes}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {getTextArray(rule.quickNotes, activeLanguage)?.map((note, idx) => (
                                    <span key={idx} className="bg-white/5 border border-border px-3 py-1.5 rounded-md text-xs text-foreground/80">
                                      {note}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              {rule.tags.map(t => (
                                <span key={t} className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded">#{t}</span>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Accordion>
            
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {strings.noResults}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
