import { Link, useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { clans } from "@/data/clans";
import { getClanDisplayName, getText } from "@/utils/content";

const clanImages: Record<string, string> = {
  brujah: "/images/brujah.png",
  ventrue: "/images/ventrue.png",
  tremere: "/images/tremere.png",
  nosferatu: "/images/nosferatu.png",
  toreador: "/images/toreador.png",
  malkavian: "/images/malkavian.png",
  gangrel: "/images/gangrel.png",
  "banu_haqim": "/images/banu-haquim.png",
  hecata: "/images/hecata.png",
  lasombra: "/images/lasombra.png",
  ministry: "/images/ministry.png",
  ravnos: "/images/ravnos.png",
  salubri: "/images/salubri.png",
};

const FEATURED_CLAN_IDS = ["ventrue", "tremere", "brujah", "toreador", "nosferatu", "gangrel", "malkavian", "banu_haqim", "hecata", "lasombra", "ministry", "ravnos", "salubri"];

export default function Home() {
  const [, setLocation] = useLocation();
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setLocation('/buscar');
    }
  };

  const featuredClans = FEATURED_CLAN_IDS
    .map(id => clans.find(c => c.id === id))
    .filter(Boolean) as typeof clans;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col gap-12">

      {/* Quick Search Bar */}
      <section className="w-full">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-primary-container transition-colors">search</span>
          </div>
          <input
            className="w-full bg-black border-0 border-b border-zinc-800 py-6 pl-16 pr-6 text-on-surface focus:ring-0 outline-none font-serif text-2xl placeholder:text-zinc-700 transition-all"
            placeholder={strings.searchGlobalPlaceholder}
            type="text"
            onKeyDown={handleSearchKeyDown}
            onClick={() => setLocation('/buscar')}
          />
          <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-container group-focus-within:w-full transition-all duration-500"></div>
        </div>
      </section>

      {/* Clan Scroll */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-3xl font-medium text-on-surface uppercase tracking-tight">{strings.clansTitle}</h2>
          <Link href="/compendium/clanes">
            <span className="text-primary-container font-sans text-sm font-semibold tracking-widest flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              {strings.viewAll} <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-[#0e0e0e] [&::-webkit-scrollbar-thumb]:bg-[#8b0000]">
          {featuredClans.map(clan => {
            const clanName = getClanDisplayName(clan, activeEdition, activeLanguage);
            const clanDesc = getText(clan.summary, activeLanguage) || '';
            return (
              <Link key={clan.id} href={`/compendium/clanes/${clan.id}`}>
                <div className="flex-none w-72 snap-start bg-zinc-950 border border-zinc-900 group relative overflow-hidden cursor-pointer">
                  <div className="h-80 relative">
                    <img
                      src={clanImages[clan.id] || "/opengraph.jpg"}
                      alt={clanName}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity grayscale contrast-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                  </div>
                  <div className="absolute bottom-0 p-6 w-full">
                    <p className="font-sans text-sm font-semibold text-primary-container tracking-[0.2em] mb-2 uppercase">{strings.clanLabel}</p>
                    <h3 className="font-serif text-[40px] leading-none text-on-surface mb-2 font-semibold tracking-tight uppercase">{clanName}</h3>
                    <p className="text-zinc-400 font-sans text-sm line-clamp-2">{clanDesc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Dark Protocols Bento Grid */}
      <section>
        <h2 className="font-serif text-3xl font-medium text-on-surface mb-6 uppercase tracking-tight">{strings.rulesTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[400px]">

          <div
            className="md:col-span-2 md:row-span-2 bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer"
            onClick={() => setLocation('/compendium/reglas')}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 text-[100px] leading-none material-symbols-outlined">swords</div>
            <div>
              <span className="material-symbols-outlined text-primary-container mb-4 text-3xl">swords</span>
              <h3 className="font-serif text-3xl mb-2 uppercase">{strings.combatSummary}</h3>
              <p className="text-zinc-400 font-sans text-base max-w-sm">{strings.combatDesc}</p>
            </div>
            <button className="w-fit text-on-surface font-sans text-sm font-semibold uppercase tracking-widest border-b border-zinc-700 pb-1 mt-4 group-hover:border-primary-container transition-colors">
              {strings.openProtocols}
            </button>
          </div>

          <div
            className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer"
            onClick={() => setLocation('/compendium/disciplinas')}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl material-symbols-outlined">auto_fix_high</div>
            <h3 className="font-serif text-2xl uppercase">{strings.disciplinesTitle}</h3>
            <span className="material-symbols-outlined text-primary-container text-3xl">auto_fix_high</span>
          </div>

          <div
            className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer"
            onClick={() => setLocation('/compendium/reglas')}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl material-symbols-outlined">opacity</div>
            <h3 className="font-serif text-2xl uppercase">{strings.bloodPotency}</h3>
            <span className="material-symbols-outlined text-primary-container text-3xl">opacity</span>
          </div>

          <div
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 p-8 flex items-center justify-between hover:border-primary-container transition-colors group cursor-pointer"
            onClick={() => setLocation('/compendium/reglas')}
          >
            <div className="flex items-center gap-6">
              <span className="material-symbols-outlined text-4xl text-primary-container">heart_broken</span>
              <div>
                <h3 className="font-serif text-2xl uppercase">{strings.humanity}</h3>
                <p className="text-zinc-400 font-sans text-sm">{strings.humanityDesc}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-zinc-700 group-hover:text-on-surface transition-colors">chevron_right</span>
          </div>

        </div>
      </section>

      {/* Quote footer */}
      <div className="mt-8 mb-4 text-center">
        <p className="text-sm font-serif text-zinc-500 italic">
          {strings.quote_footer}
        </p>
      </div>

    </div>
  );
}
