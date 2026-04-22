import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
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
  const { activeLanguage, activeEdition, setLanguage, setEdition } = useAppContext();

  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const bottomNavItems = [
    { href: "/", label: strings.home, icon: "dashboard" },
    { href: "/compendium", label: strings.compendium, icon: "menu_book" },
    { href: "/compendium/clanes", label: strings.clans, icon: "groups_3" },
    { href: "/personaje", label: strings.character, icon: "person" },
    { href: "/cronica", label: strings.chronicle, icon: "history_edu" },
  ];

  const isCurrentActive = (href: string) => {
    if (href === '/') return location === '/';
    return location === href || location.startsWith(`${href}/`);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground selection:bg-primary-container/30">
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Top App Bar */}
      <header className="bg-neutral-950 flex justify-between items-center w-full px-6 py-4 sticky top-0 z-[60] border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <span 
            className="material-symbols-outlined text-primary-container cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            menu
          </span>
          <Link href="/">
            <h1 className="font-serif text-xl font-bold text-primary-container tracking-tighter uppercase cursor-pointer">
              VTM Companion
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <select 
              value={activeEdition}
              onChange={(e) => setEdition(e.target.value as EditionId)}
              className="bg-transparent text-xs text-foreground border border-zinc-700 rounded-none px-1 py-0.5 focus:outline-none focus:border-primary-container"
            >
              {EDITIONS.map(ed => (
                <option key={ed.id} value={ed.id} className="bg-neutral-950">{ed.shortName}</option>
              ))}
            </select>
            <select 
              value={activeLanguage}
              onChange={(e) => setLanguage(e.target.value as LangCode)}
              className="bg-transparent text-xs text-foreground border border-zinc-700 rounded-none px-1 py-0.5 focus:outline-none focus:border-primary-container"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-neutral-950">{lang.code.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <span 
            className="material-symbols-outlined text-zinc-400 hover:text-primary-container cursor-pointer transition-colors"
            onClick={() => setLocation('/buscar')}
          >
            search
          </span>
        </div>
      </header>

      {/* Mobile Slide-down Menu (for settings/utilities not in bottom nav) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[65px] bg-neutral-950 z-50 overflow-y-auto border-b border-zinc-800 pb-24">
          <div className="p-6 space-y-6">
            <div className="sm:hidden flex gap-4 border-b border-zinc-800 pb-6">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block font-sans uppercase tracking-widest">{strings.edition}</label>
                <select 
                  value={activeEdition}
                  onChange={(e) => setEdition(e.target.value as EditionId)}
                  className="w-full bg-zinc-900 text-sm text-foreground border border-zinc-800 rounded-none px-2 py-2 focus:border-primary-container focus:outline-none"
                >
                  {EDITIONS.map(ed => (
                    <option key={ed.id} value={ed.id}>{ed.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block font-sans uppercase tracking-widest">{strings.language}</label>
                <select 
                  value={activeLanguage}
                  onChange={(e) => setLanguage(e.target.value as LangCode)}
                  className="w-full bg-zinc-900 text-sm text-foreground border border-zinc-800 rounded-none px-2 py-2 focus:border-primary-container focus:outline-none"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.nativeName}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <nav className="space-y-4">
              <div className="text-xs font-sans uppercase tracking-widest text-zinc-500 mb-2">Compendium</div>
              <Link href="/compendium/disciplinas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">auto_fix_high</span> {strings.disciplines}</div></Link>
              <Link href="/compendium/reglas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">book</span> {strings.rules}</div></Link>
              <Link href="/compendium/roleplay"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">theater_comedy</span> {strings.roleplaylabel || strings.roleplay}</div></Link>
              <Link href="/compendium/herramientas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">construction</span> {strings.tools}</div></Link>
              <Link href="/compendium/glosario"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">dictionary</span> {strings.glossary}</div></Link>
              
              <div className="text-xs font-sans uppercase tracking-widest text-zinc-500 mb-2 mt-6">Utilities</div>
              <Link href="/favoritos"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">favorite</span> {strings.favorites}</div></Link>
              <Link href="/notas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">edit_note</span> {strings.notes}</div></Link>
              <Link href="/ajustes"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">settings</span> {strings.settings}</div></Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full pt-6 pb-24 overflow-y-auto relative z-10">
        {children}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-20 bg-neutral-950 bg-opacity-95 backdrop-blur border-t border-zinc-800">
        {bottomNavItems.map((item) => {
          const active = isCurrentActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-16 cursor-pointer transition-all duration-300",
                active ? "text-primary-container drop-shadow-[0_0_8px_rgba(139,0,0,0.5)]" : "text-zinc-600 hover:text-zinc-400"
              )}>
                <span className="material-symbols-outlined mb-1">{item.icon}</span>
                <span className="font-serif text-[10px] uppercase tracking-widest">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
