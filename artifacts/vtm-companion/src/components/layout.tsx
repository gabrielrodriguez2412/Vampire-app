import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./search-dialog";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { EDITIONS, EDITION_LIST } from "@/data/editions";
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
    /*
     * Root app wrapper.
     *
     * Background-color note (Batch E2): this wrapper intentionally has
     * **no** `bg-background`. The global app background image is painted
     * by `body::before` in `src/index.css` and a wrapper-level
     * background-color here would sit on top of it (in-flow body
     * content paints above `body::before`'s `z-index: -1`), so the
     * image would never be visible in-app. The header, mobile menu,
     * card surfaces, and bottom nav each set their own opaque
     * backgrounds, and body itself still carries `bg-background` as a
     * universal fallback if the image fails to load, so removing it
     * here does not regress readability.
     */
    <div className="flex flex-col min-h-[100dvh] text-foreground selection:bg-primary-container/30">
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

      {/*
        Top App Bar.

        Batch E2 polish: dropped the desktop vertical padding from
        `py-4` to `py-3` (24px → ~18px) and switched the chrome to
        semi-transparent so the new global background subtly bleeds
        through the bar without sacrificing legibility of the
        title / language / edition selectors. `short-landscape:py-1.5`
        retained — phone landscape already had a tight bar. Sticky
        and z-index are unchanged so dialogs and the mobile menu
        still layer correctly above the bar.

        Final transparency pass: `bg-neutral-950/78` — two percentage
        points more transparent than the initial `/80` polish, sits
        at the conservative end of the agreed `0.75 → 0.85` safe
        range. Combined with `backdrop-blur-md` this lets a hint of
        the city/red-city silhouettes show through the bar without
        compromising icon or text contrast.
      */}
      <header className="bg-neutral-950/78 backdrop-blur-md flex justify-between items-center w-full px-6 short-landscape:px-3 py-3 short-landscape:py-1.5 sticky top-0 z-[60] border-b border-zinc-800">
        <div className="flex items-center gap-4 short-landscape:gap-2">
          <span
            className="material-symbols-outlined text-primary-container cursor-pointer hover:opacity-80 transition-opacity short-landscape:text-[20px]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            menu
          </span>
          <Link href="/">
            <h1 className="font-serif text-xl short-landscape:text-base font-bold text-primary-container tracking-tighter uppercase cursor-pointer">
              VTM Companion
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-4 short-landscape:gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <select 
              value={activeEdition}
              onChange={(e) => setEdition(e.target.value as EditionId)}
              className="bg-transparent text-xs text-foreground border border-zinc-700 rounded-none px-1 py-0.5 focus:outline-none focus:border-primary-container"
            >
              {EDITION_LIST.map(ed => (
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

      {/*
        Mobile slide-down menu (for settings/utilities not in
        bottom nav). Top offset retuned from `top-[65px]` to
        `top-[57px]` after the header's `py-4 → py-3` slim-down
        (the old offset left a 4–8px transparent strip below the
        new shorter header). Bottom padding dropped from `pb-24`
        to `pb-20` to match the slimmer bottom nav. Background
        stays solid (`bg-neutral-950`) because this is a
        content-overlay surface that needs full opacity to keep
        nav text legible regardless of what's behind it.
      */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[57px] short-landscape:top-[40px] bg-neutral-950 z-50 overflow-y-auto border-b border-zinc-800 pb-20 short-landscape:pb-14">
          <div className="p-6 space-y-6">
            <div className="sm:hidden flex gap-4 border-b border-zinc-800 pb-6">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 mb-1 block font-sans uppercase tracking-widest">{strings.edition}</label>
                <select 
                  value={activeEdition}
                  onChange={(e) => setEdition(e.target.value as EditionId)}
                  className="w-full bg-zinc-900 text-sm text-foreground border border-zinc-800 rounded-none px-2 py-2 focus:border-primary-container focus:outline-none"
                >
                  {EDITION_LIST.map(ed => (
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
              <div className="text-xs font-sans uppercase tracking-widest text-zinc-500 mb-2">{strings.compendium}</div>
              <Link href="/compendium/disciplinas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">auto_fix_high</span> {strings.disciplines}</div></Link>
              <Link href="/compendium/reglas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">book</span> {strings.rules}</div></Link>
              <Link href="/compendium/roleplay"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">theater_comedy</span> {strings.roleplaylabel || strings.roleplay}</div></Link>
              <Link href="/compendium/herramientas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">construction</span> {strings.tools}</div></Link>
              <Link href="/compendium/glosario"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">dictionary</span> {strings.glossary}</div></Link>
              
              <div className="text-xs font-sans uppercase tracking-widest text-zinc-500 mb-2 mt-6">{strings.utilities}</div>
              <Link href="/favoritos"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">favorite</span> {strings.favorites}</div></Link>
              <Link href="/notas"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">edit_note</span> {strings.notes}</div></Link>
              <Link href="/ajustes"><div className="flex items-center gap-3 text-lg font-serif cursor-pointer hover:text-primary-container transition-colors py-2" onClick={() => setMobileMenuOpen(false)}><span className="material-symbols-outlined">settings</span> {strings.settings}</div></Link>
            </nav>
          </div>
        </div>
      )}

      {/*
        Main content. Bottom padding clears the bottom-nav height:
        - desktop / portrait: `pb-20` (80px) clears the new
          `h-16` (64px) bar with 16px safe margin.
        - phone landscape: `pb-14` (56px) clears `h-11` (44px)
          with 12px safe margin (unchanged).
      */}
      <main className="flex-1 w-full pt-6 short-landscape:pt-2 pb-20 short-landscape:pb-14 overflow-y-auto relative z-10">
        {children}
      </main>

      {/*
        Bottom Nav Bar.

        Batch E2 polish: dropped desktop/portrait height from
        `h-20` (80px) to `h-16` (64px), still well above the
        44px tap-target floor for the centred icon+label stack.
        Phone landscape height `h-11` (44px) preserved — at the
        Apple/Android minimum, which is intentional on a short
        viewport. Background sits at `bg-neutral-950/78 +
        backdrop-blur-md` so the global background image bleeds
        through subtly while text/icons remain legible. Previous
        `bg-opacity-95` Tailwind utility deprecated in favour of
        the slash-opacity syntax to compose cleanly with the new
        backdrop-blur. Final transparency pass matches the header
        at `/78` so the two chrome bars feel like one consistent
        surface across top and bottom.
      */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center h-16 short-landscape:h-11 bg-neutral-950/78 backdrop-blur-md border-t border-zinc-800">
        {bottomNavItems.map((item) => {
          const active = isCurrentActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-16 short-landscape:w-12 cursor-pointer transition-all duration-300",
                active ? "text-primary-container drop-shadow-[0_0_8px_rgba(139,0,0,0.5)]" : "text-zinc-600 hover:text-zinc-400"
              )}>
                <span className="material-symbols-outlined mb-1 short-landscape:mb-0 short-landscape:text-[20px]">{item.icon}</span>
                <span className="font-serif text-[10px] uppercase tracking-widest short-landscape:hidden">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
