import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { clans } from "@/data/clans";
import { ClanEntry } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, getTextArray, filterByEdition, isAvailableInLang } from "@/utils/content";

const clanImages: Record<string, string> = {
  brujah: "/images/brujah.png",
  ventrue: "/images/ventrue.png",
  tremere: "/images/tremere.png",
  nosferatu: "/images/nosferatu.png",
  toreador: "/images/toreador.png",
  malkavian: "/images/malkavian.png",
  gangrel: "/images/gangrel.png",
};

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
    setLocation(`/compendium/disciplinas/${discId}`);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedClan(null);
      setLocation('/compendium/clanes');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-serif uppercase tracking-tight text-on-surface mb-2">{strings.clansTitle}</h1>
        <p className="text-zinc-400 font-sans">{strings.clansSubtitle}</p>
      </div>

      {filteredClans.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950 border border-zinc-900 mt-8">
          <span className="material-symbols-outlined text-5xl text-zinc-700 mb-4 block">groups_3</span>
          <h3 className="font-serif text-xl text-on-surface mb-2 uppercase tracking-wide">{strings.noClansForEdition}</h3>
          <p className="text-zinc-500 max-w-md mx-auto font-sans">
            {strings.noClansForEdition}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClans.map((clan, i) => {
            const isMissingLang = !isAvailableInLang(clan.description, activeLanguage);
            return (
              <motion.div 
                key={clan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div 
                  className="h-full bg-zinc-950 border border-zinc-900 cursor-pointer group flex flex-col relative"
                  onClick={() => {
                    setSelectedClan(clan);
                    setLocation(`/compendium/clanes/${clan.id}`);
                  }}
                >
                  <div className="h-48 relative overflow-hidden border-b border-zinc-900">
                    <img 
                      src={clanImages[clan.id] || "/opengraph.jpg"} 
                      alt={getText(clan.name, activeLanguage)}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                    <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                      <FavoriteButton id={clan.id} className="bg-black/50 hover:bg-black/80" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end">
                      <div>
                        <div className="text-[10px] font-sans font-bold text-primary-container uppercase tracking-widest mb-1">
                          {getText(clan.identity, activeLanguage)}
                        </div>
                        <h3 className="font-serif text-3xl leading-none text-on-surface tracking-tight uppercase">
                          {getText(clan.name, activeLanguage)}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {clan.disciplines.map(d => (
                        <span key={d} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-sans text-zinc-300 uppercase tracking-widest">
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-sans text-zinc-400 line-clamp-3 mb-4 flex-1">
                      {getText(clan.description, activeLanguage)}
                    </p>
                    {isMissingLang && (
                      <span className="bg-red-900/20 text-red-400 border border-red-900/50 mt-auto w-fit text-[10px] px-2 py-1 uppercase tracking-widest">
                        [{strings.noTranslation}]
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedClan} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-900 p-0 overflow-hidden text-on-surface rounded-none">
          {selectedClan && (
            <>
              <div className="h-1 w-full bg-primary-container" />
              <ScrollArea className="max-h-[85vh]">
                <div className="p-0">
                  <div className="relative h-64 border-b border-zinc-900">
                    <img 
                      src={clanImages[selectedClan.id] || "/opengraph.jpg"} 
                      alt={getText(selectedClan.name, activeLanguage)}
                      className="w-full h-full object-cover opacity-40 grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                    <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
                      <div>
                        <div className="text-sm font-sans font-bold text-primary-container uppercase tracking-widest mb-1">
                          {getText(selectedClan.identity, activeLanguage)}
                        </div>
                        <h2 className="font-serif text-5xl text-on-surface uppercase tracking-tight">
                          {getText(selectedClan.name, activeLanguage)}
                        </h2>
                      </div>
                      <FavoriteButton id={selectedClan.id} className="bg-black/50 border border-zinc-800" />
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8 font-sans text-zinc-300">
                      {!isAvailableInLang(selectedClan.description, activeLanguage) && (
                        <div className="bg-amber-950/30 text-amber-500 p-3 text-xs border border-amber-900/50 uppercase tracking-widest">
                          {strings.contentUnavailable}
                        </div>
                      )}
                      
                      <section>
                        <h3 className="font-serif text-xl text-primary-container mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2">{strings.description}</h3>
                        {getText(selectedClan.description, activeLanguage) ? (
                          <p className="leading-relaxed">{getText(selectedClan.description, activeLanguage)}</p>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">[{strings.noTranslation}]</span>
                        )}
                      </section>

                      <section>
                        <h3 className="font-serif text-xl text-primary-container mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2">{strings.playstyle}</h3>
                        {getText(selectedClan.playstyle, activeLanguage) ? (
                          <p className="leading-relaxed">{getText(selectedClan.playstyle, activeLanguage)}</p>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">[{strings.noTranslation}]</span>
                        )}
                      </section>

                      {getTextArray(selectedClan.roleplayIdeas, activeLanguage) && (
                        <section>
                          <h3 className="font-serif text-xl text-primary-container mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2">{strings.roleplayIdeas}</h3>
                          <ul className="space-y-3">
                            {getTextArray(selectedClan.roleplayIdeas, activeLanguage)?.map((idea, idx) => (
                              <li key={idx} className="leading-relaxed flex gap-3">
                                <span className="text-primary-container font-serif opacity-50 text-xl leading-none block pt-1">0{idx + 1}</span>
                                <span>{idea}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      <section>
                        <h3 className="font-serif text-xl text-primary-container mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2">{strings.relationships}</h3>
                        {getText(selectedClan.relationships, activeLanguage) ? (
                          <p className="leading-relaxed italic border-l-2 border-zinc-800 pl-4 py-1">{getText(selectedClan.relationships, activeLanguage)}</p>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">[{strings.noTranslation}]</span>
                        )}
                      </section>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-zinc-900 border border-primary-container/40 p-5 relative mt-4">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-950 px-2 font-serif text-primary-container uppercase tracking-widest text-sm whitespace-nowrap">
                          - The Clan Bane -
                        </span>
                        <h4 className="font-serif text-lg text-on-surface mb-2 uppercase text-center mt-2">{strings.weakness}</h4>
                        {getText(selectedClan.weakness, activeLanguage) ? (
                          <p className="text-sm text-zinc-400 leading-relaxed text-center">
                            {getText(selectedClan.weakness, activeLanguage)}
                          </p>
                        ) : (
                          <span className="text-xs text-zinc-500 italic text-center block">[{strings.noTranslation}]</span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-serif text-lg text-primary-container mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2">{strings.disciplinesLabel}</h4>
                        <div className="flex flex-col gap-2">
                          {selectedClan.disciplines.map(d => (
                            <div 
                              key={d} 
                              className="bg-zinc-900 border border-zinc-800 px-4 py-3 font-sans text-sm text-zinc-300 hover:text-on-surface hover:border-primary-container cursor-pointer transition-colors flex justify-between items-center group"
                              onClick={() => handleDisciplineClick(d)}
                            >
                              <span className="uppercase tracking-widest">{d}</span>
                              <span className="material-symbols-outlined text-xs text-zinc-600 group-hover:text-primary-container">arrow_forward</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
