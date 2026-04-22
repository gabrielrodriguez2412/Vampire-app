import { Link, useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";

const clanImages: Record<string, string> = {
  brujah: "/images/brujah.png",
  ventrue: "/images/ventrue.png",
  tremere: "/images/tremere.png",
  nosferatu: "/images/nosferatu.png",
  toreador: "/images/toreador.png",
  malkavian: "/images/malkavian.png",
  gangrel: "/images/gangrel.png",
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setLocation('/buscar');
    }
  };

  const featuredClans = [
    { id: "ventrue", name: "VENTRUE", desc: "The Kings. Custodians of the Masquerade and rulers of the undead hierarchy." },
    { id: "tremere", name: "TREMERE", desc: "The Warlocks. Masters of blood sorcery and seekers of forbidden secrets." },
    { id: "brujah", name: "BRUJAH", desc: "The Rabble. Warriors, rebels, and philosophers of the Kindred revolution." },
    { id: "toreador", name: "TOREADOR", desc: "The Divas. Aesthetes and social manipulators obsessed with beauty." },
    { id: "nosferatu", name: "NOSFERATU", desc: "The Sewer Rats. Hideous information brokers lurking in the shadows." },
    { id: "gangrel", name: "GANGREL", desc: "The Outcasts. Feral survivors closely tied to the Beast." },
    { id: "malkavian", name: "MALKAVIAN", desc: "The Oracles. Seers and mad prophets cursed with affliction." }
  ];

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
            placeholder={strings.searchGlobalPlaceholder || "BUSCAR DISCIPLINAS, CLANES, O LORE..."} 
            type="text"
            onKeyDown={handleSearchSubmit}
            onClick={() => setLocation('/buscar')}
          />
          <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-container group-focus-within:w-full transition-all duration-500"></div>
        </div>
      </section>

      {/* Ancestral Lineages */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-3xl font-medium text-on-surface uppercase tracking-tight">{strings.clansTitle}</h2>
          <Link href="/compendium/clanes">
            <span className="text-primary-container font-sans text-sm font-semibold tracking-widest flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              VIEW ALL <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </span>
          </Link>
        </div>
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-[#0e0e0e] [&::-webkit-scrollbar-thumb]:bg-[#8b0000]">
          {featuredClans.map(clan => (
            <Link key={clan.id} href={`/compendium/clanes/${clan.id}`}>
              <div className="flex-none w-72 snap-start bg-zinc-950 border border-zinc-900 group relative overflow-hidden cursor-pointer">
                <div className="h-80 relative">
                  <img 
                    src={clanImages[clan.id] || "/opengraph.jpg"} 
                    alt={clan.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity grayscale contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 p-6 w-full">
                  <p className="font-sans text-sm font-semibold text-primary-container tracking-[0.2em] mb-2 uppercase">CLAN</p>
                  <h3 className="font-serif text-[40px] leading-none text-on-surface mb-2 font-semibold tracking-tight">{clan.name}</h3>
                  <p className="text-zinc-400 font-sans text-sm line-clamp-2">{clan.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* The Dark Protocols Bento Grid */}
      <section>
        <h2 className="font-serif text-3xl font-medium text-on-surface mb-6 uppercase tracking-tight">{strings.rulesTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[400px]">
          
          <div className="md:col-span-2 md:row-span-2 bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer" onClick={() => setLocation('/compendium/reglas')}>
            <div className="absolute top-0 right-0 p-8 opacity-10 text-[100px] leading-none material-symbols-outlined">swords</div>
            <div>
              <span className="material-symbols-outlined text-primary-container mb-4 text-3xl">swords</span>
              <h3 className="font-serif text-3xl mb-2 uppercase">{strings.combatSummary || "COMBAT"}</h3>
              <p className="text-zinc-400 font-sans text-base max-w-sm">Physical conflicts, initiative, and damage in the World of Darkness.</p>
            </div>
            <button className="w-fit text-on-surface font-sans text-sm font-semibold uppercase tracking-widest border-b border-zinc-700 pb-1 mt-4 group-hover:border-primary-container transition-colors">
              OPEN PROTOCOLS
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer" onClick={() => setLocation('/compendium/disciplinas')}>
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl material-symbols-outlined">auto_fix_high</div>
            <h3 className="font-serif text-2xl uppercase">{strings.disciplinesTitle}</h3>
            <span className="material-symbols-outlined text-primary-container text-3xl">auto_fix_high</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-between hover:border-primary-container transition-colors relative overflow-hidden group cursor-pointer" onClick={() => setLocation('/compendium/reglas')}>
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl material-symbols-outlined">opacity</div>
            <h3 className="font-serif text-2xl uppercase">{strings.bloodPotency || "POTENCIA DE SANGRE"}</h3>
            <span className="material-symbols-outlined text-primary-container text-3xl">opacity</span>
          </div>

          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 p-8 flex items-center justify-between hover:border-primary-container transition-colors group cursor-pointer" onClick={() => setLocation('/compendium/reglas')}>
            <div className="flex items-center gap-6">
              <span className="material-symbols-outlined text-4xl text-primary-container">heart_broken</span>
              <div>
                <h3 className="font-serif text-2xl uppercase">{strings.humanity || "HUMANIDAD"}</h3>
                <p className="text-zinc-400 font-sans text-sm">La lucha contra la Bestia Interior</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-zinc-700 group-hover:text-on-surface transition-colors">chevron_right</span>
          </div>

        </div>
      </section>

      {/* Storyteller Suggestions */}
      <section className="bg-zinc-950 border border-zinc-900 p-8 md:p-12 relative">
        <div className="flex flex-col items-center mb-10">
          <div className="h-px w-24 bg-primary-container mb-6"></div>
          <h2 className="font-serif text-3xl text-on-surface text-center mb-2 italic">SUGERENCIAS DEL NARRADOR</h2>
          <p className="font-sans text-sm text-zinc-500 tracking-[0.2em] uppercase text-center">SUSURROS DESDE EL VACÍO</p>
        </div>
        
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="group cursor-pointer">
            <div className="flex items-start gap-4 pb-6 border-b border-zinc-900 group-hover:border-primary-container transition-colors">
              <span className="font-serif text-2xl text-zinc-800 group-hover:text-primary-container transition-colors">01</span>
              <div>
                <h4 className="font-serif text-2xl text-on-surface mb-1 uppercase tracking-tight">El Aroma del Cobre</h4>
                <p className="text-zinc-400 italic font-sans">"La lluvia en el callejón no borra el sabor metálico. Describe la sobrecarga sensorial de un retoño hambriento..."</p>
              </div>
            </div>
          </div>
          
          <div className="group cursor-pointer">
            <div className="flex items-start gap-4 pb-6 border-b border-zinc-900 group-hover:border-primary-container transition-colors">
              <span className="font-serif text-2xl text-zinc-800 group-hover:text-primary-container transition-colors">02</span>
              <div>
                <h4 className="font-serif text-2xl text-on-surface mb-1 uppercase tracking-tight">Una Invitación de Seda</h4>
                <p className="text-zinc-400 italic font-sans">"Un anciano Ventrue invita a la cotería a la ópera. El aire es denso con perfume antiguo y secretos. ¿Cuál es el precio de un asiento?"</p>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="flex items-start gap-4 pb-6 border-b border-zinc-900 group-hover:border-primary-container transition-colors">
              <span className="font-serif text-2xl text-zinc-800 group-hover:text-primary-container transition-colors">03</span>
              <div>
                <h4 className="font-serif text-2xl text-on-surface mb-1 uppercase tracking-tight">Sombras en la Sala de Servidores</h4>
                <p className="text-zinc-400 italic font-sans">"Las madrigueras Nosferatu han sido infiltradas por una amenaza digital. El zumbido de los ventiladores imita un corazón palpitante..."</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <button className="bg-primary-container text-white px-10 py-4 font-sans text-sm font-semibold uppercase tracking-[0.3em] hover:bg-red-800 transition-all active:scale-95 cursor-pointer">
            REVELAR MÁS
          </button>
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
