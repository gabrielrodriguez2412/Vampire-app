import { useState } from "react";
import { motion } from "framer-motion";
import { rules } from "@/data/rules";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Rules() {
  const [filter, setFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todas");

  const categories = ["Todas", ...Array.from(new Set(rules.map(r => r.category)))];

  const filtered = rules.filter(r => {
    const matchesFilter = r.title.toLowerCase().includes(filter.toLowerCase()) || 
                          r.shortExplanation.toLowerCase().includes(filter.toLowerCase()) ||
                          r.tags.some(t => t.toLowerCase().includes(filter.toLowerCase()));
    const matchesCategory = activeCategory === "Todas" || r.category === activeCategory;
    return matchesFilter && matchesCategory;
  });

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Sidebar/Top filter for categories */}
      <div className="w-full md:w-64 shrink-0 bg-card border-r border-border p-4 md:p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-primary mb-4">Categorías</h2>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap ${
                  activeCategory === cat 
                    ? "bg-primary/20 text-primary font-medium border border-primary/30" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-cinzel font-bold text-foreground mb-2">Leyes y Mecánicas</h1>
            <p className="text-muted-foreground mb-6">Las reglas que rigen la noche y la Bestia.</p>
            
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar regla o etiqueta..." 
                className="pl-9 bg-card border-border"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Accordion type="multiple" className="w-full space-y-4">
              {filtered.map((rule, i) => (
                <motion.div 
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <AccordionItem value={rule.id} className="border border-border rounded-lg bg-card overflow-hidden">
                    <div className="flex items-center justify-between pr-4 bg-white/[0.01]">
                      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-white/[0.02] flex-1 text-left">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-3">
                            <span className="font-cinzel text-lg text-foreground">{rule.title}</span>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{rule.category}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground font-normal text-left">{rule.shortExplanation}</span>
                        </div>
                      </AccordionTrigger>
                      <FavoriteButton id={rule.id} className="shrink-0" />
                    </div>
                    <AccordionContent className="px-4 pb-4 pt-2 border-t border-border bg-background/50">
                      <div className="space-y-4 pt-2">
                        <p className="text-foreground/90 leading-relaxed">
                          {rule.fullExplanation}
                        </p>
                        
                        {rule.examples.length > 0 && (
                          <div className="bg-black/20 p-4 rounded-md border border-white/5">
                            <h4 className="text-primary font-cinzel text-sm mb-2">Ejemplos:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                              {rule.examples.map((ex, idx) => (
                                <li key={idx}>{ex}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {rule.quickNotes.length > 0 && (
                          <div>
                            <h4 className="text-muted-foreground text-xs uppercase tracking-wider mb-2 font-semibold">Notas Rápidas:</h4>
                            <div className="flex flex-wrap gap-2">
                              {rule.quickNotes.map((note, idx) => (
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
              ))}
            </Accordion>
            
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron reglas.
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}