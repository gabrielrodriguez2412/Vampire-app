import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Droplet, Book, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { SearchDialog } from "@/components/search-dialog";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { EDITIONS } from "@/data/editions";
import { LANGUAGES } from "@/data/languages";

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const editionName = EDITIONS.find(e => e.id === activeEdition)?.name;
  const langName = LANGUAGES.find(l => l.code === activeLanguage)?.name;

  const modules = [
    { title: strings.clans, desc: "Arquetipos, debilidades y disciplinas", icon: Users, href: "/clanes", color: "text-blue-400" },
    { title: strings.disciplines, desc: "Poderes de la sangre", icon: Droplet, href: "/disciplinas", color: "text-red-500" },
    { title: strings.rules, desc: "Mecánicas, Hambre y Combate", icon: Book, href: "/reglas", color: "text-amber-400" },
    { title: strings.tools, desc: "Dados, rastreador de hambre", icon: Wrench, href: "/herramientas", color: "text-emerald-400" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 mt-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-background border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
          <span>{editionName}</span>
          <span className="w-1 h-1 rounded-full bg-border"></span>
          <span>{langName}</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-foreground mb-4 drop-shadow-sm">
          Vampiro <span className="text-primary block md:inline">La Mascarada</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          El grimorio digital definitivo. Reglas, clanes y herramientas para sobrevivir la noche.
        </p>

        <button 
          onClick={() => setSearchOpen(true)}
          className="mt-8 max-w-md mx-auto w-full flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-full text-muted-foreground hover:bg-white/5 hover:border-primary/50 transition-all group shadow-sm"
        >
          <Search className="w-5 h-5 group-hover:text-primary transition-colors" />
          <span>{strings.search}</span>
          <kbd className="ml-auto text-xs bg-background px-2 py-1 rounded-md border border-border">Cmd K</kbd>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {modules.map((mod, i) => (
            <motion.div 
              key={mod.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
            >
              <Link href={mod.href}>
                <Card className="h-full bg-card hover:bg-white/[0.03] border-border hover:border-primary/40 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className={`p-3 rounded-xl bg-background border border-border group-hover:scale-110 transition-transform ${mod.color}`}>
                      <mod.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{mod.title}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-1">{mod.desc}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 text-center"
      >
        <p className="text-sm font-cinzel text-muted-foreground italic">
          "La eternidad es un largo tiempo para estar hambriento."
        </p>
      </motion.div>
    </div>
  );
}
