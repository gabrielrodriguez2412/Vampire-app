import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clans, Clan } from "@/data/clans";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Clans() {
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Clanes de Sangre</h1>
        <p className="text-muted-foreground">La maldición de Caín se divide en linajes, cada uno con sus propios dones y debilidades.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {clans.map((clan, i) => (
          <motion.div 
            key={clan.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card 
              className="h-full bg-card border-border cursor-pointer group overflow-hidden relative"
              onClick={() => setSelectedClan(clan)}
            >
              {/* Colored top border accent */}
              <div className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: clan.color }} />
              
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl" aria-hidden="true">{clan.icon}</span>
                    <CardTitle className="text-2xl font-cinzel tracking-wide">{clan.name}</CardTitle>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">
                    {clan.identity}
                  </div>
                </div>
                <FavoriteButton id={clan.id} />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {clan.disciplines.map(d => (
                    <Badge key={d} variant="outline" className="bg-background/50 border-border/50 text-foreground/80">
                      {d}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {clan.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!selectedClan} onOpenChange={(open) => !open && setSelectedClan(null)}>
        <DialogContent className="max-w-2xl bg-card border-border p-0 overflow-hidden text-foreground">
          {selectedClan && (
            <>
              <div className="h-2 w-full" style={{ backgroundColor: selectedClan.color }} />
              <ScrollArea className="max-h-[85vh]">
                <div className="p-6">
                  <DialogHeader className="mb-6 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{selectedClan.icon}</span>
                        <DialogTitle className="text-3xl font-cinzel text-foreground">{selectedClan.name}</DialogTitle>
                      </div>
                      <DialogDescription className="text-base mt-2 text-muted-foreground">
                        {selectedClan.identity}
                      </DialogDescription>
                    </div>
                    <FavoriteButton id={selectedClan.id} className="bg-background/50" />
                  </DialogHeader>

                  <div className="space-y-6 text-sm">
                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Descripción</h3>
                      <p className="leading-relaxed text-foreground/90">{selectedClan.description}</p>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Debilidad</h3>
                      <div className="bg-red-950/20 border border-red-900/30 rounded-md p-4 text-red-200/90 leading-relaxed">
                        {selectedClan.weakness}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Disciplinas</h3>
                      <div className="flex gap-2">
                        {selectedClan.disciplines.map(d => (
                          <Badge key={d} className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 text-sm font-medium">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Estilo de Juego</h3>
                      <p className="leading-relaxed text-foreground/90">{selectedClan.playstyle}</p>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Ideas para Roleplay</h3>
                      <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4 marker:text-primary">
                        {selectedClan.roleplayIdeas.map((idea, idx) => (
                          <li key={idx} className="leading-relaxed">{idea}</li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Relaciones</h3>
                      <p className="leading-relaxed text-foreground/90 italic">{selectedClan.relationships}</p>
                    </section>
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