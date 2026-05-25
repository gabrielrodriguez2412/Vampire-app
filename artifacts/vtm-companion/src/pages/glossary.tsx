import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { glossary } from "@/data/glossary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, isEditionInScope } from "@/utils/content";

export default function Glossary() {
  const [filter, setFilter] = useState("");
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  // Two-stage filter: edition scope first (V5-only / classic-only entries
  // are hidden outside their family), then the search-text box. The
  // edition step uses `isEditionInScope`, the same helper Roleplay uses,
  // so a future Revised-only or 1st-only split would be one place to
  // change rather than two.
  const filtered = glossary
    .filter(term => isEditionInScope(term.edition, activeEdition))
    .filter(term => {
      const termText = getText(term.term, activeLanguage) || '';
      const defText = getText(term.definition, activeLanguage) || '';
      return termText.toLowerCase().includes(filter.toLowerCase()) ||
             defText.toLowerCase().includes(filter.toLowerCase());
    })
    .sort((a, b) => (getText(a.term, activeLanguage) || '').localeCompare(getText(b.term, activeLanguage) || ''));

  // Label resolved per-call so the dropdown language switch updates it.
  // Falls back to the existing combat-summary edition labels so a missing
  // glossary-specific key still produces a meaningful badge.
  const editionLabel = (edition: 'v5' | 'classic' | null | undefined): string | null => {
    if (edition === 'v5') return strings.glossary_edition_v5 || strings.combat_summary_v5_label || 'V5';
    if (edition === 'classic') return strings.glossary_edition_classic || strings.combat_summary_classic_label || 'Classic';
    return null;
  };

  const relatedLabel = strings.glossary_related || 'Related:';

  return (
    <div className="p-6 md:p-10 short-landscape:p-3 max-w-4xl mx-auto w-full">
      <div className="mb-8 short-landscape:mb-3">
        <h1 className="text-3xl short-landscape:text-xl font-serif font-bold text-primary mb-2 short-landscape:mb-1 flex items-center gap-2">
          <BookOpen className="w-8 h-8 short-landscape:w-5 short-landscape:h-5" />
          {strings.glossaryTitle}
        </h1>
        <p className="text-muted-foreground mb-6 short-landscape:mb-3 short-landscape:text-sm">{strings.glossarySubtitle}</p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={strings.glossarySearchPlaceholder || strings.search}
            className="pl-9 bg-card border-border"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 short-landscape:gap-2">
        <AnimatePresence>
          {filtered.map((item, i) => {
            const badge = editionLabel(item.edition);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                layout
              >
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2 short-landscape:pb-1">
                    <CardTitle className="font-serif text-xl text-foreground flex items-center gap-3">
                      <span className="min-w-0 flex-1">{getText(item.term, activeLanguage)}</span>
                      {badge && (
                        <span
                          className="text-[10px] uppercase tracking-wider text-muted-foreground/80 border border-border px-1.5 py-0.5 rounded shrink-0"
                          title={item.edition === 'v5'
                            ? (strings.glossary_edition_v5_tooltip || 'V5-specific concept')
                            : (strings.glossary_edition_classic_tooltip || 'Classic-edition concept')}
                        >
                          {badge}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getText(item.definition, activeLanguage) ? (
                      <p className="text-foreground/80 leading-relaxed mb-4 short-landscape:mb-2">
                        {getText(item.definition, activeLanguage)}
                      </p>
                    ) : (
                      <span className="text-xs text-amber-600/80 italic block mb-4 short-landscape:mb-2">[ {strings.noTranslation} ]</span>
                    )}

                    {item.related.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-muted-foreground mr-1">{relatedLabel}</span>
                        {item.related.map(r => (
                          <Badge key={r} variant="secondary" className="bg-background border-border text-muted-foreground hover:bg-white/5 font-normal text-xs cursor-default">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {strings.noResults || strings.searchTypeAtLeast || ''}
          </div>
        )}
      </div>
    </div>
  );
}
