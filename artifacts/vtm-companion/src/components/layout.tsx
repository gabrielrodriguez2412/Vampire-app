import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Landmark, 
  ScrollText, 
  Crown, 
  Flame, 
  Heart, 
  Menu, 
  X, 
  Search,
  Drama,
  Swords,
  BookOpen,
  Feather,
  Globe,
  Library,
  User,
  Settings2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./search-dialog";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { EDITIONS } from "@/data/editions";
import { LANGUAGES } from "@/data/languages";
import { LangCode, EditionId } from "@/types";

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compendiumOpen, setCompendiumOpen] = useState(location.includes('/compendium') || location.includes('/clanes') || location.includes('/disciplinas') || location.includes('/reglas') || location.includes('/roleplay') || location.includes('/herramientas') || location.includes('/glosario'));
  const { activeLanguage, activeEdition, setLanguage, setEdition } = useAppContext();

  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const mainNavItems = [
    { href: "/", label: strings.home, icon: Landmark },
    { href: "/compendium", label: strings.compendium, icon: BookOpen, isGroup: true },
    { href: "/personaje", label: strings.character, icon: User },
    { href: "/cronica", label: strings.chronicle, icon: ScrollText },
    { href: "/buscar", label: strings.search, icon: Search },
  ];

  const compendiumItems = [
    { href: "/compendium/clanes", label: strings.clans, icon: Crown },
    { href: "/compendium/disciplinas", label: strings.disciplines, icon: Flame },
    { href: "/compendium/reglas", label: strings.rules, icon: ScrollText },
    { href: "/compendium/roleplay", label: strings.roleplaylabel || strings.roleplay, icon: Drama },
    { href: "/compendium/herramientas", label: strings.tools, icon: Swords },
    { href: "/compendium/glosario", label: strings.glossary, icon: BookOpen },
  ];

  const utilityItems = [
    { href: "/favoritos", label: strings.favorites, icon: Heart },
    { href: "/notas", label: strings.notes, icon: Feather },
    { href: "/ajustes", label: strings.settings, icon: Settings2 },
  ];

  const isCurrentActive = (href: string) => {
    if (href === '/') return location === '/';
    return location === href || location.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar shrink-0 relative z-20">
        <Link href="/">
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border cursor-pointer hover:bg-white/5 transition-colors" data-testid="home-button">
            <h1 className="font-cinzel font-bold text-xl tracking-wider text-primary">V<span className="text-foreground">t</span>M <span className="text-muted-foreground text-sm font-sans tracking-normal font-normal">Companion</span></h1>
          </div>
        </Link>
        
        <div className="p-4 space-y-4 pb-2 border-b border-sidebar-border/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Library className="w-3 h-3" />
                <span>{strings.edition}</span>
              </div>
              <select 
                value={activeEdition}
                onChange={(e) => setEdition(e.target.value as EditionId)}
                className="bg-transparent text-xs text-foreground border border-sidebar-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="edition-selector"
              >
                {EDITIONS.map(ed => (
                  <option key={ed.id} value={ed.id} className="bg-sidebar">{ed.shortName}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>{strings.language}</span>
              </div>
              <select 
                value={activeLanguage}
                onChange={(e) => setLanguage(e.target.value as LangCode)}
                className="bg-transparent text-xs text-foreground border border-sidebar-border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="language-selector"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-sidebar">{lang.flag} {lang.nativeName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {mainNavItems.map((item) => {
            const active = isCurrentActive(item.href);
            if (item.isGroup) {
              return (
                <div key={item.href} className="space-y-1">
                  <div 
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                      active || compendiumOpen
                        ? "bg-primary/10 text-primary" 
                        : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
                    )}
                    onClick={() => {
                      if (compendiumOpen && active) {
                        setCompendiumOpen(false);
                      } else {
                        setCompendiumOpen(true);
                        setLocation(item.href);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4", active || compendiumOpen ? "text-primary" : "opacity-70")} />
                      {item.label}
                    </div>
                    {compendiumOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                  </div>
                  
                  {compendiumOpen && (
                    <div className="pl-6 space-y-1 mt-1 mb-2 border-l border-sidebar-border/30 ml-4">
                      {compendiumItems.map(subItem => {
                        const subActive = isCurrentActive(subItem.href) || isCurrentActive(subItem.href.replace('/compendium', ''));
                        return (
                          <Link key={subItem.href} href={subItem.href}>
                            <div 
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                                subActive 
                                  ? "text-primary bg-primary/5" 
                                  : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground"
                              )}
                            >
                              <subItem.icon className={cn("w-3.5 h-3.5", subActive ? "text-primary" : "opacity-70")} />
                              {subItem.label}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                    active 
                      ? "bg-primary/10 text-primary" 
                      : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className={cn("w-4 h-4", active ? "text-primary" : "opacity-70")} />
                  {item.label}
                </div>
              </Link>
            );
          })}

          <div className="pt-4 mt-2 border-t border-sidebar-border/30">
            {utilityItems.map((item) => {
              const active = isCurrentActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", active ? "text-primary" : "opacity-70")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        <Link href="/">
          <h1 className="font-cinzel font-bold text-lg text-primary cursor-pointer">V<span className="text-foreground">t</span>M</h1>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation('/buscar')} className="p-2 text-muted-foreground hover:text-foreground">
            <Search className="w-5 h-5" />
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-foreground">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-background z-30 overflow-y-auto">
          <div className="p-4 flex gap-4 border-b border-border">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">{strings.edition}</label>
              <select 
                value={activeEdition}
                onChange={(e) => setEdition(e.target.value as EditionId)}
                className="w-full bg-card text-sm text-foreground border border-border rounded px-2 py-2"
              >
                {EDITIONS.map(ed => (
                  <option key={ed.id} value={ed.id}>{ed.shortName}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">{strings.language}</label>
              <select 
                value={activeLanguage}
                onChange={(e) => setLanguage(e.target.value as LangCode)}
                className="w-full bg-card text-sm text-foreground border border-border rounded px-2 py-2"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.nativeName}</option>
                ))}
              </select>
            </div>
          </div>
          <nav className="p-4 space-y-2">
            {[...mainNavItems, ...compendiumItems, ...utilityItems].filter(i => !i.isGroup).map((item) => {
              const active = isCurrentActive(item.href) || isCurrentActive(item.href.replace('/compendium', ''));
              return (
                <Link key={item.href} href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors cursor-pointer",
                      active 
                        ? "bg-primary/20 text-primary border border-primary/20" 
                        : "bg-card text-foreground border border-transparent"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-y-auto pt-14 md:pt-0 scroll-smooth">
        {children}
      </main>
    </div>
  );
}
