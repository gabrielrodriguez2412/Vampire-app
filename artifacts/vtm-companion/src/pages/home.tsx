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
    { title: strings.clansTitle, desc: strings.clansSubtitle, icon: Users, href: "/compendium/clanes", color: "text-blue-400" },
    { title: strings.disciplinesTitle, desc: strings.disciplinesSubtitle, icon: Droplet, href: "/compendium/disciplinas", color: "text-red-500" },
    { title: strings.rulesTitle, desc: strings.rulesSubtitle, icon: Book, href: "/compendium/reglas", color: "text-amber-400" },
    { title: strings.character, desc: strings.characterSection, icon: Users, href: "/personaje", color: "text-purple-400" },
    { title: strings.chronicle, desc: strings.chronicleSubtitle, icon: Book, href: "/cronica", color: "text-orange-400" },
    { title: strings.compendium, desc: strings.home_tagline, icon: Book, href: "/compendium", color: "text-indigo-400" },
    { title: strings.toolsTitle, desc: strings.tools, icon: Wrench, href: "/compendium/herramientas", color: "text-emerald-400" },
    { title: strings.search, desc: strings.searchSubtitle, icon: Search, href: "/buscar", color: "text-slate-400" },
  ];

  // Quick lookup (dummy implementation or fetch from local storage if managed)
  const recentItems: {title: string, url: string}[] = [];
  try {
    const raw = localStorage.getItem('vtm-recent');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        recentItems.push(...parsed.slice(0, 3));
      }
    }
  } catch (e) {}

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
          {strings.home_tagline}
        </p>

        {recentItems.length > 0 && (
          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-3 font-cinzel">Quick Lookup</p>
            <div className="flex flex-wrap justify-center gap-2">
              {recentItems.map((item, idx) => (
                <Link key={idx} href={item.url}>
                  <span className="px-4 py-1.5 bg-card border border-border hover:border-primary/50 hover:text-primary transition-colors rounded-full text-sm cursor-pointer">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <CardDescription className="text-muted-foreground mt-1 line-clamp-1">{mod.desc}</CardDescription>
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
          {strings.quote_footer}
        </p>
      </motion.div>
    </div>
  );
}
