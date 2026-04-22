import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { glossary } from "@/data/glossary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText } from "@/utils/content";

export default function Glossary() {
  const [filter, setFilter] = useState("");
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const filtered = glossary.filter(term => {
    const termText = getText(term.term, activeLanguage);
    const defText = getText(term.definition, activeLanguage);
    return termText.toLowerCase().includes(filter.toLowerCase()) || 
           defText.toLowerCase().includes(filter.toLowerCase());
  }).sort((a, b) => getText(a.term, activeLanguage).localeCompare(getText(b.term, activeLanguage)));

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2 flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          {strings.glossaryTitle}
        </h1>
        <p className="text-muted-foreground mb-6">{strings.glossarySubtitle}</p>
        
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

      <div className="grid gap-4">
        <AnimatePresence>
          {filtered.map((item, i) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              layout
            >
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="font-cinzel text-xl text-foreground">{getText(item.term, activeLanguage)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {getText(item.definition, activeLanguage) ? (
                    <p className="text-foreground/80 leading-relaxed mb-4">
                      {getText(item.definition, activeLanguage)}
                    </p>
                  ) : (
                    <span className="text-xs text-amber-600/80 italic block mb-4">[ {strings.noTranslation} ]</span>
                  )}
                  
                  {item.related.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-muted-foreground mr-1">Relacionado:</span>
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
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {strings.noResults}
          </div>
        )}
      </div>
    </div>
  );
}
