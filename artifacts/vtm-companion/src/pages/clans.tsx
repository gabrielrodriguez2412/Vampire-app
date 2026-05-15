import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { clans } from "@/data/clans";
import { ClanEntry, EditionId, LangCode } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FavoriteButton } from "@/components/favorite-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, isAvailableInLang, getClanDisplayName } from "@/utils/content";

export default function Clans() {
  const [selectedClan, setSelectedClan] = useState<ClanEntry | null>(null);
  const [, setLocation] = useLocation();
  const params = useParams();
  
  const { activeLanguage, activeEdition, setEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  
  const filteredClans = clans.filter(c => c.editionAvailability.includes(activeEdition));
  
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
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-serif uppercase tracking-tight text-on-surface mb-2">{strings.clansTitle}</h1>
          <p className="text-zinc-400 font-sans">{strings.clansSubtitle}</p>
          <div className="text-zinc-500 text-sm mt-2 font-sans tracking-wide">
            Showing <strong className="text-on-surface">{filteredClans.length}</strong> clans for <strong className="text-on-surface uppercase">{activeEdition}</strong>
          </div>
        </div>
        <div>
          <select 
            value={activeEdition}
            onChange={(e) => setEdition(e.target.value as EditionId)}
            className="bg-zinc-950 border border-zinc-800 text-on-surface px-4 py-2 font-serif uppercase text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="1ST">1st Edition</option>
            <option value="2ND">2nd Edition</option>
            <option value="REVISED">Revised Edition</option>
            <option value="V20">V20</option>
            <option value="V5">V5</option>
          </select>
        </div>
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
            const isMissingLang = !isAvailableInLang(clan.summary, activeLanguage);
            const dynamicName = getClanDisplayName(clan, activeEdition, activeLanguage);
            
            return (
              <motion.div 
                key={clan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div 
                  className="h-full bg-zinc-950 border border-zinc-900 cursor-pointer group flex flex-col relative"
                  style={{ borderBottomColor: clan.colorTheme }}
                  onClick={() => {
                    setSelectedClan(clan);
                    setLocation(`/compendium/clanes/${clan.id}`);
                  }}
                >
                  <div className="h-48 relative overflow-hidden border-b border-zinc-900">
                    <img 
                      src={clan.bannerImage || "/opengraph.jpg"} 
                      alt={dynamicName || clan.id}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                    <div className="absolute top-4 right-4" onClick={e => e.stopPropagation()}>
                      <FavoriteButton id={clan.id} className="bg-black/50 hover:bg-black/80" />
                    </div>
                    <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end">
                      <div>
                        <div className="text-[10px] font-sans font-bold text-primary-container uppercase tracking-widest mb-1" style={{ color: clan.colorTheme }}>
                          {getText(clan.sect, activeLanguage) || "Unknown Sect"}
                        </div>
                        <h3 className="font-serif text-3xl leading-none text-on-surface tracking-tight uppercase flex items-center gap-2">
                          <span>{clan.icon}</span> {dynamicName}
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
                      {getText(clan.summary, activeLanguage)}
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
              <div className="h-1 w-full" style={{ backgroundColor: selectedClan.colorTheme }} />
              <ScrollArea className="max-h-[85vh]">
                <div className="p-0">
                  <div className="relative h-64 border-b border-zinc-900">
                    <img 
                      src={selectedClan.bannerImage || "/opengraph.jpg"} 
                      alt={getClanDisplayName(selectedClan, activeEdition, activeLanguage) || selectedClan.id}
                      className="w-full h-full object-cover opacity-40 grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                    <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
                      <div>
                        <div className="text-sm font-sans font-bold uppercase tracking-widest mb-1" style={{ color: selectedClan.colorTheme }}>
                          {getText(selectedClan.sect, activeLanguage) || "Unknown Sect"}
                        </div>
                        <h2 className="font-serif text-5xl text-on-surface uppercase tracking-tight flex items-center gap-3">
                          <span>{selectedClan.icon}</span> {getClanDisplayName(selectedClan, activeEdition, activeLanguage)}
                        </h2>
                      </div>
                      <FavoriteButton id={selectedClan.id} className="bg-black/50 border border-zinc-800" />
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8 font-sans text-zinc-300">
                      {!isAvailableInLang(selectedClan.summary, activeLanguage) && (
                        <div className="bg-amber-950/30 text-amber-500 p-3 text-xs border border-amber-900/50 uppercase tracking-widest">
                          {strings.contentUnavailable}
                        </div>
                      )}
                      
                      <section>
                        <h3 className="font-serif text-xl mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2" style={{ color: selectedClan.colorTheme }}>
                          {strings.description || "Summary"}
                        </h3>
                        {getText(selectedClan.summary, activeLanguage) ? (
                          <p className="leading-relaxed">{getText(selectedClan.summary, activeLanguage)}</p>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">[{strings.noTranslation}]</span>
                        )}
                      </section>

                      <section>
                        <h3 className="font-serif text-xl mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2" style={{ color: selectedClan.colorTheme }}>
                          LORE
                        </h3>
                        {getText(selectedClan.lore, activeLanguage) ? (
                          <p className="leading-relaxed">{getText(selectedClan.lore, activeLanguage)}</p>
                        ) : (
                          <span className="text-xs text-zinc-500 italic">[{strings.noTranslation}]</span>
                        )}
                      </section>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-zinc-900 border p-5 relative mt-4" style={{ borderColor: `${selectedClan.colorTheme}40` }}>
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-950 px-2 font-serif uppercase tracking-widest text-sm whitespace-nowrap" style={{ color: selectedClan.colorTheme }}>
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
                        <h4 className="font-serif text-lg mb-3 uppercase tracking-wide border-b border-zinc-900 pb-2" style={{ color: selectedClan.colorTheme }}>
                          {strings.disciplinesLabel}
                        </h4>
                        <div className="flex flex-col gap-2">
                          {selectedClan.disciplines.map(d => (
                            <div 
                              key={d} 
                              className="bg-zinc-900 border border-zinc-800 px-4 py-3 font-sans text-sm text-zinc-300 hover:text-on-surface cursor-pointer transition-colors flex justify-between items-center group"
                              onClick={() => handleDisciplineClick(d)}
                            >
                              <span className="uppercase tracking-widest">{d}</span>
                              <span className="material-symbols-outlined text-xs text-zinc-600 group-hover:text-white">arrow_forward</span>
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
