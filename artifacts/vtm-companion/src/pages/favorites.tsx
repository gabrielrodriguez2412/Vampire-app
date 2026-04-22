import { Link } from "wouter";
import { motion } from "framer-motion";
import { useFavorites } from "@/hooks/useFavorites";
import { clans } from "@/data/clans";
import { disciplines } from "@/data/disciplines";
import { rules } from "@/data/rules";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import { Users, Droplet, Book, HeartOff } from "lucide-react";

export default function Favorites() {
  const { favorites } = useFavorites();
  
  const favClans = clans.filter(c => favorites[c.id]);
  const favDisciplines = disciplines.filter(d => favorites[d.id]);
  const favRules = rules.filter(r => favorites[r.id]);

  const hasFavorites = favClans.length > 0 || favDisciplines.length > 0 || favRules.length > 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Códice Personal</h1>
        <p className="text-muted-foreground">Tus conocimientos guardados.</p>
      </div>

      {!hasFavorites ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg mt-8">
          <HeartOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-cinzel text-xl text-foreground mb-2">No hay favoritos</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Marca el corazón en clanes, disciplinas o reglas para guardarlas aquí para acceso rápido durante tus partidas.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {favClans.length > 0 && (
            <section>
              <h2 className="font-cinzel text-2xl text-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Users className="w-5 h-5 text-primary" /> Clanes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favClans.map((clan, i) => (
                  <motion.div key={clan.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }}>
                    <Link href={`/clanes?id=${clan.id}`}>
                      <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full relative group">
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: clan.color }} />
                        <CardHeader className="flex flex-row justify-between items-start pb-4">
                          <div>
                            <CardTitle className="font-cinzel flex items-center gap-2">
                              {clan.icon} {clan.name}
                            </CardTitle>
                            <CardDescription className="mt-1">{clan.identity}</CardDescription>
                          </div>
                          <FavoriteButton id={clan.id} />
                        </CardHeader>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {favDisciplines.length > 0 && (
            <section>
              <h2 className="font-cinzel text-2xl text-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Droplet className="w-5 h-5 text-primary" /> Disciplinas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favDisciplines.map((disc, i) => (
                  <motion.div key={disc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }}>
                    <Link href={`/disciplinas?id=${disc.id}`}>
                      <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full">
                        <CardHeader className="flex flex-row justify-between items-start pb-4">
                          <div>
                            <CardTitle className="font-cinzel text-lg">{disc.name}</CardTitle>
                            <CardDescription className="mt-1">{disc.type}</CardDescription>
                          </div>
                          <FavoriteButton id={disc.id} />
                        </CardHeader>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {favRules.length > 0 && (
            <section>
              <h2 className="font-cinzel text-2xl text-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Book className="w-5 h-5 text-primary" /> Reglas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favRules.map((rule, i) => (
                  <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i*0.05 }}>
                    <Link href={`/reglas?id=${rule.id}`}>
                      <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer h-full">
                        <CardHeader className="flex flex-row justify-between items-start pb-4">
                          <div>
                            <CardTitle className="font-cinzel text-lg">{rule.title}</CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">{rule.shortExplanation}</CardDescription>
                          </div>
                          <FavoriteButton id={rule.id} />
                        </CardHeader>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}