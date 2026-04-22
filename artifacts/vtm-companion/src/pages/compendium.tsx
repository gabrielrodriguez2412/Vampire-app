import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Flame, ScrollText, Drama, Swords, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";

export default function Compendium() {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const categories = [
    { title: strings.clansTitle, desc: strings.clansSubtitle, icon: Crown, href: "/compendium/clanes", color: "text-blue-400" },
    { title: strings.disciplinesTitle, desc: strings.disciplinesSubtitle, icon: Flame, href: "/compendium/disciplinas", color: "text-red-500" },
    { title: strings.rulesTitle, desc: strings.rulesSubtitle, icon: ScrollText, href: "/compendium/reglas", color: "text-amber-400" },
    { title: strings.roleplaylabel, desc: "Consejos para interpretar tu personaje.", icon: Drama, href: "/compendium/roleplay", color: "text-purple-400" },
    { title: strings.toolsTitle, desc: "Herramientas para usar durante el juego.", icon: Swords, href: "/compendium/herramientas", color: "text-emerald-400" },
    { title: strings.glossaryTitle, desc: strings.glossarySubtitle, icon: BookOpen, href: "/compendium/glosario", color: "text-slate-400" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          {strings.compendium}
        </h1>
        <p className="text-muted-foreground">{strings.home_tagline}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {categories.map((cat, i) => (
            <motion.div 
              key={cat.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={cat.href}>
                <Card className="h-full bg-card hover:bg-white/[0.03] border-border hover:border-primary/40 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`p-3 rounded-xl bg-background border border-border group-hover:scale-110 transition-transform ${cat.color}`}>
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{cat.title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">{cat.desc}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
