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
import { ruleEditionLabel, ruleHasNeedsReviewMarker, getRuleCategories, ruleHasCategory } from "@/utils/ruleDisplay";

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
    // Plain mount on /compendium/reglas (no rule id): always land at the top
    // so the user sees the category bar — mobile especially was inheriting a
    // mid-page scroll position from the previous route. The real scroll
    // container is the layout's <main> element (it carries overflow-y-auto);
    // we reset both it and the window to cover any browser variance.
    if (!params.id) {
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'auto' });
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    const targetId = params.id;
    setActiveCategory("__all__");
    setFilter("");
    setOpenIds(prev => (prev.includes(targetId) ? prev : [...prev, targetId]));
    // Defer scroll until the accordion has had a chance to expand so the
    // scroll target includes the open body height. We use `scrollIntoView`
    // with `block: 'start'` and rely on the element's `scroll-mt-*` class to
    // leave room for the sticky top bar(s) (more on mobile because the
    // category bar is also sticky there).
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`rule-${targetId}`);
      if (!el) return;
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [params.id]);

  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const catMap = RULE_CATEGORIES[activeLanguage] || RULE_CATEGORIES['en'];
  
  // Edition filter excludes rules that don't apply to the active edition. The
  // sole exception is a path-param deep-link: if `params.id` points at a rule
  // tagged for another edition, we still surface it so a favorited / shared
  // link always lands on its target instead of an empty page.
  const editionRules = filterByEdition(rules, activeEdition);
  const deepLinkedRule = params.id
    ? rules.find(r => r.id === params.id && !editionRules.some(er => er.id === r.id))
    : undefined;
  const visibleRules = deepLinkedRule
    ? [deepLinkedRule, ...editionRules]
    : editionRules;

  // Category list is multi-category aware: a rule contributes every category
  // it declares. Sorted alphabetically (localized) for stable display.
  const categories = ["__all__", ...Array.from(
    new Set(visibleRules.flatMap(r => getRuleCategories(r)))
  ).sort((a, b) => a.localeCompare(b, activeLanguage))];

  const filtered = visibleRules.filter(r => {
    const titleText = getText(r.title, activeLanguage) || '';
    const shortText = getText(r.shortExplanation, activeLanguage) || '';

    const q = filter.toLowerCase();
    const matchesFilter =
      titleText.toLowerCase().includes(q) ||
      shortText.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q)) ||
      getRuleCategories(r).some(c => (catMap[c] || c).toLowerCase().includes(q));
    const matchesCategory = activeCategory === "__all__" || ruleHasCategory(r, activeCategory);
    // Always show the deep-linked rule, regardless of the user-applied filter,
    // so the user is not greeted by an "empty" page after clicking a link.
    if (deepLinkedRule && r.id === deepLinkedRule.id) return true;
    return matchesFilter && matchesCategory;
  });

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Category filter.
       *  - Desktop: a static left sidebar (~16rem wide).
       *  - Mobile : a horizontally scrollable bar sticky under the app header
       *             (z-30 so it sits above page content but below the app bar
       *             at z-60). Fade gradient on the right edge hints at more
       *             categories when the strip is wider than the viewport. */}
      <div className="w-full md:w-64 shrink-0 bg-card border-b md:border-b-0 md:border-r border-border p-3 md:p-6 flex flex-col gap-4 sticky top-0 z-30 md:static md:top-auto md:z-auto">
        <div>
          <h2 className="hidden md:block font-serif text-xl font-bold text-primary mb-4">{strings.categories}</h2>
          <div className="relative">
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                  onClick={() => setActiveCategory("__all__")}
                  aria-pressed={activeCategory === "__all__"}
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
                  aria-pressed={activeCategory === cat}
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
            {/* Right-edge fade hint — mobile only, signals more chips to swipe to. */}
            <div className="md:hidden pointer-events-none absolute top-0 right-0 h-full w-6 bg-gradient-to-l from-card to-transparent" aria-hidden />
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
                  const editionBadge = ruleEditionLabel(rule.editions, {
                    labelAll: strings.rule_edition_all || 'All',
                    labelClassic: strings.rule_edition_classic || 'Classic',
                  });
                  const needsReview = ruleHasNeedsReviewMarker(rule, [activeLanguage, 'en']);
                  return (
                    <motion.div
                      key={rule.id}
                      id={`rule-${rule.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      layout
                      className="scroll-mt-40 md:scroll-mt-24"
                    >
                      <AccordionItem value={rule.id} className="border border-border rounded-lg bg-card overflow-hidden">
                        <div className="flex items-center justify-between pr-4 bg-white/[0.01]">
                          <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-white/[0.02] flex-1 text-left">
                            <div className="flex flex-col items-start gap-1 w-full">
                              <div className="flex items-center gap-2 sm:gap-3 w-full flex-wrap">
                                <span className="font-serif text-lg text-foreground">{getText(rule.title, activeLanguage)}</span>
                                {getRuleCategories(rule).map(cat => (
                                  <Badge key={cat} variant="outline" className="text-[10px] uppercase tracking-wider shrink-0">
                                    {catMap[cat] || cat}
                                  </Badge>
                                ))}
                                {editionBadge && (
                                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0 border-primary/30 text-primary/80 bg-primary/5">
                                    {editionBadge}
                                  </Badge>
                                )}
                                {needsReview && (
                                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0 border-amber-500/40 text-amber-300 bg-amber-500/10">
                                    {strings.needs_review || 'Needs review'}
                                  </Badge>
                                )}
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
