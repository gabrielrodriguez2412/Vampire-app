import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { clans } from "@/data/clans";
import { ClanEntry } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, getTextArray, filterByEdition, isAvailableInLang } from "@/utils/content";
import { Crown } from "lucide-react";

export default function Clans() {
  const [selectedClan, setSelectedClan] = useState<ClanEntry | null>(null);
  const [, setLocation] = useLocation();
  const params = useParams();
  
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  
  const filteredClans = filterByEdition(clans, activeEdition);
  
  useEffect(() => {
    if (params.id) {
      const clan = filteredClans.find(c => c.id === params.id);
      if (clan) setSelectedClan(clan);
    }
  }, [params.id, filteredClans]);

  const handleDisciplineClick = (discId: string) => {
    setLocation(`/disciplinas/${discId}`);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedClan(null);
      setLocation('/clanes');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">{strings.clans}</h1>
        <p className="text-muted-foreground">La maldición de Caín se divide en linajes, cada uno con sus propios dones y debilidades.</p>
      </div>

      {filteredClans.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg mt-8">
          <Crown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-cinzel text-xl text-foreground mb-2">No hay clanes para esta edición</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Esta edición no tiene clanes registrados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClans.map((clan, i) => {
            const isMissingLang = !isAvailableInLang(clan.description, activeLanguage);
            return (
              <motion.div 
                key={clan.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <Card 
                  className="h-full bg-card border-border cursor-pointer group overflow-hidden relative flex flex-col"
                  onClick={() => {
                    setSelectedClan(clan);
                    setLocation(`/clanes/${clan.id}`);
                  }}
                  data-testid={`clan-card-${clan.id}`}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: clan.color }} />
                  
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl" aria-hidden="true">{clan.icon}</span>
                        <CardTitle className="text-2xl font-cinzel tracking-wide">{getText(clan.name, activeLanguage)}</CardTitle>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">
                        {getText(clan.identity, activeLanguage)}
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <FavoriteButton id={clan.id} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {clan.disciplines.map(d => (
                        <Badge key={d} variant="outline" className="bg-background/50 border-border/50 text-foreground/80 pointer-events-none">
                          {d}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                      {getText(clan.description, activeLanguage)}
                    </p>
                    {isMissingLang && (
                      <Badge variant="destructive" className="bg-red-900/40 text-red-300 border-red-900/50 mt-auto w-fit text-[10px]">
                        [ Sin traducción disponible ]
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedClan} onOpenChange={handleClose}>
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
                        <DialogTitle className="text-3xl font-cinzel text-foreground">{getText(selectedClan.name, activeLanguage)}</DialogTitle>
                      </div>
                      <DialogDescription className="text-base mt-2 text-muted-foreground">
                        {getText(selectedClan.identity, activeLanguage)}
                      </DialogDescription>
                    </div>
                    <FavoriteButton id={selectedClan.id} className="bg-background/50" />
                  </DialogHeader>

                  <div className="space-y-6 text-sm">
                    {!isAvailableInLang(selectedClan.description, activeLanguage) && (
                      <div className="bg-amber-900/20 text-amber-200/80 p-3 rounded text-xs border border-amber-900/30">
                        {strings.contentUnavailable} - Showing English fallback.
                      </div>
                    )}
                    
                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Descripción</h3>
                      <p className="leading-relaxed text-foreground/90">{getText(selectedClan.description, activeLanguage)}</p>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Debilidad</h3>
                      <div className="bg-red-950/20 border border-red-900/30 rounded-md p-4 text-red-200/90 leading-relaxed">
                        {getText(selectedClan.weakness, activeLanguage)}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Disciplinas</h3>
                      <div className="flex gap-2">
                        {selectedClan.disciplines.map(d => (
                          <Badge 
                            key={d} 
                            className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 text-sm font-medium cursor-pointer"
                            onClick={() => handleDisciplineClick(d)}
                          >
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Estilo de Juego</h3>
                      <p className="leading-relaxed text-foreground/90">{getText(selectedClan.playstyle, activeLanguage)}</p>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Ideas para Roleplay</h3>
                      <ul className="list-disc list-inside space-y-2 text-foreground/90 ml-4 marker:text-primary">
                        {getTextArray(selectedClan.roleplayIdeas, activeLanguage).map((idea, idx) => (
                          <li key={idx} className="leading-relaxed">{idea}</li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h3 className="font-cinzel text-lg text-primary mb-2 border-b border-border pb-1">Relaciones</h3>
                      <p className="leading-relaxed text-foreground/90 italic">{getText(selectedClan.relationships, activeLanguage)}</p>
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
