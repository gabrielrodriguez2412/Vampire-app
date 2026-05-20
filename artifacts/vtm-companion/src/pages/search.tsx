import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search as SearchIcon, FileText, Users, BookOpen, BookText,
  User, ScrollText, CalendarDays, MapPin, Heart, Flame, ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearch, SEARCH_RESULT_TYPES } from "@/hooks/useSearch";
import type { SearchResult, SearchResultType } from "@/utils/search";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";

/**
 * Apply any sessionStorage hints declared on a result and navigate. Same
 * helper logic as `SearchDialog` — duplicated here intentionally to keep
 * the two consumers each-self-contained and avoid pulling logic up into a
 * shared module that would also need to pull in wouter.
 */
function navigateToSearchResult(
  result: SearchResult,
  setLocation: (path: string) => void
) {
  if (result.deepLink) {
    for (const [k, v] of Object.entries(result.deepLink.sessionKeys)) {
      try { sessionStorage.setItem(k, v); } catch { /* ignore */ }
    }
  }
  setLocation(result.url);
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | SearchResultType>('all');
  const results = useSearch(query);
  const [, setLocation] = useLocation();

  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const filteredResults = useMemo(
    () => filterType === 'all' ? results : results.filter(r => r.type === filterType),
    [results, filterType]
  );

  /** Localized label for a result type — used both in the filter pills and
   *  in the per-result chip on each row. */
  const typeLabel = (type: SearchResultType | 'all'): string => {
    switch (type) {
      case 'all':          return strings.allCategories            || 'All';
      case 'clan':         return strings.search_type_clan         || 'Clan';
      case 'disciplina':   return strings.search_type_discipline   || 'Discipline';
      case 'regla':        return strings.search_type_rule         || 'Rule';
      case 'glosario':     return strings.search_type_glossary     || 'Glossary';
      case 'character':    return strings.search_type_character    || 'Character';
      case 'journal':      return strings.search_type_journal      || 'Journal note';
      case 'chronicle':    return strings.search_type_chronicle    || 'Chronicle';
      case 'session':      return strings.search_type_session      || 'Session';
      case 'location':     return strings.search_type_location     || 'Location';
      case 'relationship': return strings.search_type_relationship || 'Relationship';
      default:             return type;
    }
  };

  const getIcon = (type: SearchResultType) => {
    switch (type) {
      case 'clan':         return <Users        className="w-5 h-5 text-primary" />;
      case 'disciplina':   return <Flame        className="w-5 h-5 text-primary" />;
      case 'regla':        return <FileText     className="w-5 h-5 text-primary" />;
      case 'glosario':     return <BookText     className="w-5 h-5 text-primary" />;
      case 'character':    return <User         className="w-5 h-5 text-primary" />;
      case 'journal':      return <BookOpen     className="w-5 h-5 text-primary" />;
      case 'chronicle':    return <ScrollText   className="w-5 h-5 text-primary" />;
      case 'session':      return <CalendarDays className="w-5 h-5 text-primary" />;
      case 'location':     return <MapPin       className="w-5 h-5 text-primary" />;
      case 'relationship': return <Heart        className="w-5 h-5 text-primary" />;
      default:             return <FileText     className="w-5 h-5 text-primary" />;
    }
  };

  /** Keyboard helper: Enter on the input opens the top result. Mirrors
   *  the dialog's cmdk default. Escape isn't bound here because the search
   *  page is a full route, not a dismissible overlay. */
  const handleSubmit: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && filteredResults.length > 0) {
      e.preventDefault();
      navigateToSearchResult(filteredResults[0], setLocation);
    }
  };

  // Auto-focus the input on mount — when arriving from the global "/buscar"
  // entry, the cursor should already be in the search box so the user can
  // start typing immediately. autoFocus on the JSX would only run on the
  // first paint; doing it in an effect also handles hot-reload cases.
  useEffect(() => {
    const el = document.getElementById('global-search-input') as HTMLInputElement | null;
    el?.focus();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">{strings.searchTitle}</h1>
        <p className="text-muted-foreground mb-8">{strings.searchSubtitle}</p>

        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="global-search-input"
            placeholder={strings.searchGlobalPlaceholder}
            className="pl-12 py-6 text-lg bg-card border-border shadow-lg rounded-xl"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleSubmit}
          />
        </div>
      </div>

      {query.length > 1 && (
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {(['all', ...SEARCH_RESULT_TYPES] as Array<'all' | SearchResultType>).map(t => (
            <Badge
              key={t}
              variant="outline"
              className={`cursor-pointer px-3 py-1.5 text-xs ${filterType === t ? 'bg-primary/20 text-primary border-primary/50' : 'bg-background hover:bg-white/5 text-muted-foreground'}`}
              onClick={() => setFilterType(t)}
            >
              {typeLabel(t)}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {query.length > 1 && filteredResults.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card/30 rounded-xl border border-border/50">
            {strings.noResults || 'No results.'}
          </div>
        ) : query.length > 1 ? (
          filteredResults.map(result => (
            <button
              key={result.id}
              type="button"
              onClick={() => navigateToSearchResult(result, setLocation)}
              className="w-full text-left flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-white/[0.03] hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="mt-1 p-2 bg-background rounded-lg border border-border group-hover:scale-105 transition-transform shrink-0">
                {getIcon(result.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate min-w-0">
                    {result.title}
                  </h3>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
                    {typeLabel(result.type)}
                  </Badge>
                </div>
                {result.subtitle && (
                  <p className="text-xs text-foreground/70 mt-0.5 truncate">{result.subtitle}</p>
                )}
                {result.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {result.description}
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-2" aria-hidden="true" />
            </button>
          ))
        ) : (
          <div className="text-center py-20 text-muted-foreground bg-card/10 rounded-xl border border-border/10 border-dashed">
            {strings.searchTypeAtLeast || 'Type at least 2 characters to search...'}
          </div>
        )}
      </div>
    </div>
  );
}
