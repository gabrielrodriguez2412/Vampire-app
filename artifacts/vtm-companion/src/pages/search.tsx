import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search as SearchIcon, FileText, Users, BookOpen, BookText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/hooks/useSearch";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";

export default function Search() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const results = useSearch(query);
  
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const filteredResults = filterType === "all" ? results : results.filter(r => r.type === filterType);

  const getIcon = (type: string) => {
    switch (type) {
      case 'clan': return <Users className="w-5 h-5 text-primary" />;
      case 'disciplina': return <FlameIcon />;
      case 'regla': return <FileText className="w-5 h-5 text-primary" />;
      case 'glosario': return <BookText className="w-5 h-5 text-primary" />;
      default: return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  const FlameIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">{strings.searchTitle}</h1>
        <p className="text-muted-foreground mb-8">{strings.searchSubtitle}</p>
        
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder={strings.searchGlobalPlaceholder}
            className="pl-12 py-6 text-lg bg-card border-border shadow-lg rounded-xl"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {query.length > 1 && (
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {[
            { id: "all", label: strings.allCategories },
            { id: "clan", label: strings.clansTitle },
            { id: "disciplina", label: strings.disciplinesTitle },
            { id: "regla", label: strings.rulesTitle },
            { id: "glosario", label: strings.glossaryTitle }
          ].map(f => (
            <Badge 
              key={f.id} 
              variant="outline" 
              className={`cursor-pointer px-4 py-1.5 text-sm ${filterType === f.id ? 'bg-primary/20 text-primary border-primary/50' : 'bg-background hover:bg-white/5 text-muted-foreground'}`}
              onClick={() => setFilterType(f.id)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {query.length > 1 && filteredResults.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card/30 rounded-xl border border-border/50">
            {strings.noResults}
          </div>
        ) : query.length > 1 ? (
          filteredResults.map(result => (
            <Link key={result.id} href={result.url}>
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-white/[0.03] hover:border-primary/30 transition-all cursor-pointer group">
                <div className="mt-1 p-2 bg-background rounded-lg border border-border group-hover:scale-110 transition-transform">
                  {getIcon(result.type)}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {result.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {result.description}
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {result.type}
                  </Badge>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-card/10 rounded-xl border border-border/10 border-dashed">
            Escribe al menos 2 caracteres para buscar...
          </div>
        )}
      </div>
    </div>
  );
}
