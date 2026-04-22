import { useState } from "react";
import { motion } from "framer-motion";
import { disciplines, Discipline } from "@/data/disciplines";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Disciplines() {
  const [filter, setFilter] = useState("");

  const filtered = disciplines.filter(d => 
    d.name.toLowerCase().includes(filter.toLowerCase()) ||
    d.clansWhoUse.some(c => c.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Disciplinas</h1>
        <p className="text-muted-foreground mb-6">Poderes místicos inherentes a la Sangre. Filtralos por nombre o clan.</p>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar (ej. Auspex, Brujah)..." 
            className="pl-9 bg-card border-border"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map((disc, i) => (
          <motion.div 
            key={disc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="bg-white/[0.02] border-b border-border pb-4 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl font-cinzel text-foreground">{disc.name}</CardTitle>
                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground border-muted-foreground/30">
                      {disc.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
                    {disc.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs text-muted-foreground py-1">Clanes:</span>
                    {disc.clansWhoUse.map(c => (
                      <Badge key={c} className="bg-secondary/40 text-secondary-foreground hover:bg-secondary/60 border-none text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <FavoriteButton id={disc.id} />
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="powers" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4 hover:bg-white/[0.02] font-cinzel text-lg">
                      Poderes
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-4">
                        {disc.powers.map(p => (
                          <div key={p.name} className="bg-background/50 rounded-lg p-4 border border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-primary flex items-center gap-2">
                                {p.name}
                                <span className="flex gap-1">
                                  {Array.from({length: 5}).map((_, i) => (
                                    <span key={i} className={`w-2 h-2 rounded-full ${i < p.level ? 'bg-primary' : 'bg-primary/20'}`} />
                                  ))}
                                </span>
                              </h4>
                            </div>
                            <p className="text-sm text-foreground/90 mb-2">{p.description}</p>
                            <p className="text-xs text-muted-foreground italic bg-black/20 p-2 rounded border border-white/5">
                              <span className="font-semibold text-foreground/70 not-italic mr-1">Uso táctico:</span> 
                              {p.tacticalUse}
                            </p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron disciplinas que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}