import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/hooks/useFavorites";
import { clans } from "@/data/clans";
import { disciplines } from "@/data/disciplines";
import { rules } from "@/data/rules";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import { Crown, Flame, ScrollText, HeartOff, User, BookOpen } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { getText, getClanDisplayName } from "@/utils/content";
import { getCharacters } from "@/services/characterStorage";
import { getChronicles } from "@/services/chronicleStorage";
import { Character, Chronicle } from "@/types";
import { resolveFavoriteTargets } from "@/utils/favorites";

export default function Favorites() {
  const { favorites } = useFavorites();
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const [, navigate] = useLocation();

  // User-owned content lives in localStorage; load on mount and whenever the
  // favorites map changes so a freshly favorited / deleted item is reflected.
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  useEffect(() => {
    try { setCharacters(getCharacters()); } catch { setCharacters([]); }
    try { setChronicles(getChronicles()); } catch { setChronicles([]); }
  }, [favorites]);

  const resolved = useMemo(
    () => resolveFavoriteTargets(favorites, {
      clans, disciplines, rules, characters, chronicles,
    }),
    [favorites, characters, chronicles],
  );

  const hasFavorites = resolved.total > 0;

  // Open a character via the existing sessionStorage handshake the character
  // page already understands (mirrors what the chronicle page does).
  const openCharacter = (charId: string) => {
    try { sessionStorage.setItem('vtm-open-character-id', charId); } catch {/* ignore */}
    navigate('/personaje');
  };

  // Open a chronicle's manage modal via the same sessionStorage handshake the
  // home dashboard uses.
  const openChronicle = (chrId: string) => {
    try { sessionStorage.setItem('vtm-open-chronicle-id', chrId); } catch {/* ignore */}
    navigate('/cronica');
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-primary mb-2">{strings.favoritesTitle}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {strings.favoritesQuickAccessSubtitle || strings.favoritesSubtitle}
        </p>
      </div>

      {!hasFavorites ? (
        <div className="text-center py-16 sm:py-20 bg-card border border-border rounded-lg mt-8">
          <HeartOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-foreground mb-2">{strings.favoritesEmpty}</h3>
          <p className="text-muted-foreground max-w-md mx-auto px-4 text-sm">
            {strings.favoritesQuickAccessSubtitle || strings.favoritesSubtitle}
          </p>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          <AnimatePresence>
            {resolved.clans.length > 0 && (
              <FavSection
                key="clans"
                title={strings.clans}
                icon={<Crown className="w-5 h-5 text-primary" />}
                cols={3}
              >
                {resolved.clans.map((clan, i) => (
                  <FavCard key={clan.id} delay={i * 0.04}>
                    <Link href={`/compendium/clanes/${clan.id}`}>
                      <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full relative">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20" />
                        <CardHeader className="flex flex-row justify-between items-start pb-4">
                          <div className="min-w-0">
                            <CardTitle className="font-serif flex items-center gap-2 truncate">
                              {clan.icon} {getClanDisplayName(clan, activeEdition, activeLanguage)}
                            </CardTitle>
                            <CardDescription className="mt-1 truncate">{getText(clan.sect, activeLanguage)}</CardDescription>
                          </div>
                          <div onClick={e => e.preventDefault()}><FavoriteButton id={clan.id} /></div>
                        </CardHeader>
                      </Card>
                    </Link>
                  </FavCard>
                ))}
              </FavSection>
            )}

            {resolved.disciplines.length > 0 && (
              <FavSection
                key="disciplines"
                title={strings.disciplines}
                icon={<Flame className="w-5 h-5 text-primary" />}
                cols={3}
              >
                {resolved.disciplines.map((disc, i) => (
                  <FavCard key={disc.id} delay={i * 0.04}>
                    <Link href={`/compendium/disciplinas/${disc.id}`}>
                      <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full">
                        <CardHeader className="flex flex-row justify-between items-start pb-4">
                          <div className="min-w-0">
                            <CardTitle className="font-serif text-lg truncate">{disc.name}</CardTitle>
                            <CardDescription className="mt-1 truncate">{getText(disc.type, activeLanguage)}</CardDescription>
                          </div>
                          <div onClick={e => e.preventDefault()}><FavoriteButton id={disc.id} /></div>
                        </CardHeader>
                      </Card>
                    </Link>
                  </FavCard>
                ))}
              </FavSection>
            )}

            {resolved.rules.length > 0 && (
              <FavSection
                key="rules"
                title={strings.rules}
                icon={<ScrollText className="w-5 h-5 text-primary" />}
                cols={2}
              >
                {resolved.rules.map((rule, i) => (
                  <FavCard key={rule.id} delay={i * 0.04}>
                    <Link href={`/compendium/reglas/${rule.id}`}>
                      <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full">
                        <CardHeader className="flex flex-row justify-between items-start pb-4">
                          <div className="min-w-0">
                            <CardTitle className="font-serif text-lg truncate">{getText(rule.title, activeLanguage)}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">{getText(rule.shortExplanation, activeLanguage)}</CardDescription>
                          </div>
                          <div onClick={e => e.preventDefault()}><FavoriteButton id={rule.id} /></div>
                        </CardHeader>
                      </Card>
                    </Link>
                  </FavCard>
                ))}
              </FavSection>
            )}

            {resolved.characters.length > 0 && (
              <FavSection
                key="characters"
                title={strings.home_recent_characters || strings.characters || 'Characters'}
                icon={<User className="w-5 h-5 text-primary" />}
                cols={3}
              >
                {resolved.characters.map((char, i) => (
                  <FavCard key={char.id} delay={i * 0.04}>
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() => openCharacter(char.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCharacter(char.id); } }}
                      className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full"
                    >
                      <CardHeader className="flex flex-row justify-between items-start pb-4">
                        <div className="min-w-0">
                          <CardTitle className="font-serif text-base truncate">{char.name || strings.unnamed_character || 'Unnamed'}</CardTitle>
                          <CardDescription className="mt-1 truncate">
                            <span className="uppercase tracking-wider text-[10px] mr-1">{typeof char.edition === 'string' ? char.edition : '—'}</span>
                            · {char.clan}
                            {char.characterType === 'npc' ? ' · NPC' : ''}
                          </CardDescription>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <FavoriteButton type="character" targetId={char.id} />
                        </div>
                      </CardHeader>
                    </Card>
                  </FavCard>
                ))}
              </FavSection>
            )}

            {resolved.chronicles.length > 0 && (
              <FavSection
                key="chronicles"
                title={strings.home_recent_chronicles || strings.chronicle || 'Chronicles'}
                icon={<BookOpen className="w-5 h-5 text-primary" />}
                cols={2}
              >
                {resolved.chronicles.map((chr, i) => (
                  <FavCard key={chr.id} delay={i * 0.04}>
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() => openChronicle(chr.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChronicle(chr.id); } }}
                      className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full"
                    >
                      <CardHeader className="flex flex-row justify-between items-start pb-4">
                        <div className="min-w-0">
                          <CardTitle className="font-serif text-lg truncate">{chr.name}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {chr.setting || (chr.edition ? `${chr.edition}` : '')}
                          </CardDescription>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <FavoriteButton type="chronicle" targetId={chr.id} />
                        </div>
                      </CardHeader>
                    </Card>
                  </FavCard>
                ))}
              </FavSection>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

interface FavSectionProps {
  title: string;
  icon: React.ReactNode;
  cols: 2 | 3;
  children: React.ReactNode;
}

function FavSection({ title, icon, cols, children }: FavSectionProps) {
  const gridCls = cols === 3
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4';
  return (
    <motion.section layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="font-serif text-xl sm:text-2xl text-foreground mb-3 sm:mb-4 flex items-center gap-2 border-b border-border pb-2">
        {icon} {title}
      </h2>
      <div className={gridCls}>{children}</div>
    </motion.section>
  );
}

function FavCard({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      {children}
    </motion.div>
  );
}
