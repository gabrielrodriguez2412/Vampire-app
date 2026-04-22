import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Book, 
  Users, 
  Droplet, 
  Heart, 
  Menu, 
  X, 
  Search,
  MessageCircle,
  Wrench,
  BookText,
  StickyNote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./search-dialog";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/reglas", label: "Reglas", icon: Book },
  { href: "/clanes", label: "Clanes", icon: Users },
  { href: "/disciplinas", label: "Disciplinas", icon: Droplet },
  { href: "/roleplay", label: "Roleplay", icon: MessageCircle },
  { href: "/herramientas", label: "Herramientas", icon: Wrench },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/glosario", label: "Glosario", icon: BookText },
  { href: "/notas", label: "Notas", icon: StickyNote },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground overflow-hidden selection:bg-primary/30">
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar shrink-0 relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="font-cinzel font-bold text-xl tracking-wider text-primary">V<span className="text-foreground">t</span>M <span className="text-muted-foreground text-sm font-sans tracking-normal font-normal">Companion</span></h1>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-white/5 hover:bg-white/10 rounded-md border border-white/5 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Buscar...</span>
            <kbd className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded opacity-70">Cmd K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href;
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
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground text-center">
          V5 Reference Tool
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        <h1 className="font-cinzel font-bold text-lg text-primary">V<span className="text-foreground">t</span>M</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="p-2 text-muted-foreground hover:text-foreground">
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
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const active = location === item.href;
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