import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/hooks/useFavorites";
import { clans } from "@/data/clans";
import { disciplines } from "@/data/disciplines";
import { rules } from "@/data/rules";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import { Crown, Flame, ScrollText, HeartOff } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText } from "@/utils/content";

export default function Favorites() {
  const { favorites } = useFavorites();
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  
  const favClans = clans.filter(c => favorites[c.id]);
  const favDisciplines = disciplines.filter(d => favorites[d.id]);
  const favRules = rules.filter(r => favorites[r.id]);

  const hasFavorites = favClans.length > 0 || favDisciplines.length > 0 || favRules.length > 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">{strings.favoritesTitle}</h1>
        <p className="text-muted-foreground">{strings.favoritesSubtitle}</p>
      </div>

      {!hasFavorites ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg mt-8">
          <HeartOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-foreground mb-2">{strings.favoritesEmpty}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {strings.favoritesSubtitle}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <AnimatePresence>
            {favClans.length > 0 && (
              <motion.section layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-serif text-2xl text-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <Crown className="w-5 h-5 text-primary" /> {strings.clans}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favClans.map((clan, i) => (
                    <motion.div key={clan.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }}>
                      <Link href={`/compendium/clanes/${clan.id}`}>
                        <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full relative group">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20" />
                          <CardHeader className="flex flex-row justify-between items-start pb-4">
                            <div>
                              <CardTitle className="font-serif flex items-center gap-2">
                                {clan.icon} {getText(clan.name, activeLanguage)}
                              </CardTitle>
                              <CardDescription className="mt-1">{getText(clan.sect, activeLanguage)}</CardDescription>
                            </div>
                            <div onClick={e => e.preventDefault()}><FavoriteButton id={clan.id} /></div>
                          </CardHeader>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {favDisciplines.length > 0 && (
              <motion.section layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-serif text-2xl text-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <Flame className="w-5 h-5 text-primary" /> {strings.disciplines}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favDisciplines.map((disc, i) => (
                    <motion.div key={disc.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }}>
                      <Link href={`/compendium/disciplinas/${disc.id}`}>
                        <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full">
                          <CardHeader className="flex flex-row justify-between items-start pb-4">
                            <div>
                              <CardTitle className="font-serif text-lg">{disc.name}</CardTitle>
                              <CardDescription className="mt-1">{getText(disc.type, activeLanguage)}</CardDescription>
                            </div>
                            <div onClick={e => e.preventDefault()}><FavoriteButton id={disc.id} /></div>
                          </CardHeader>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {favRules.length > 0 && (
              <motion.section layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-serif text-2xl text-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
                  <ScrollText className="w-5 h-5 text-primary" /> {strings.rules}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favRules.map((rule, i) => (
                    <motion.div key={rule.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }}>
                      <Link href={`/compendium/reglas?id=${rule.id}`}>
                        <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full">
                          <CardHeader className="flex flex-row justify-between items-start pb-4">
                            <div>
                              <CardTitle className="font-serif text-lg">{getText(rule.title, activeLanguage)}</CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">{getText(rule.shortExplanation, activeLanguage)}</CardDescription>
                            </div>
                            <div onClick={e => e.preventDefault()}><FavoriteButton id={rule.id} /></div>
                          </CardHeader>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
