import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Command } from "cmdk";
import {
  Search, FileText, Users, BookOpen, BookText,
  User, ScrollText, CalendarDays, MapPin, Heart, Flame,
} from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import type { SearchResult } from "@/utils/search";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";

/**
 * Apply any sessionStorage hints declared on a result and navigate. The
 * destination page (character / chronicle) reads these keys on mount to
 * pre-open the relevant record. We deliberately swallow storage errors so
 * private browsing / quota-exceeded never blocks navigation.
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

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const results = useSearch(query);
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const onSelect = (result: SearchResult) => {
    onOpenChange(false);
    navigateToSearchResult(result, setLocation);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'clan':         return <Users className="h-4 w-4 text-primary" />;
      case 'disciplina':   return <Flame className="h-4 w-4 text-primary" />;
      case 'regla':        return <FileText className="h-4 w-4 text-primary" />;
      case 'glosario':     return <BookText className="h-4 w-4 text-primary" />;
      case 'character':    return <User className="h-4 w-4 text-primary" />;
      case 'journal':      return <BookOpen className="h-4 w-4 text-primary" />;
      case 'chronicle':    return <ScrollText className="h-4 w-4 text-primary" />;
      case 'session':      return <CalendarDays className="h-4 w-4 text-primary" />;
      case 'location':     return <MapPin className="h-4 w-4 text-primary" />;
      case 'relationship': return <Heart className="h-4 w-4 text-primary" />;
      default:             return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  /** Localized chip label for a result row's type. Falls back to the raw
   *  discriminator when an i18n entry is missing (English fallback string
   *  matches the discriminator's name). */
  const getTypeLabel = (type: string): string => {
    switch (type) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none shadow-2xl bg-card max-w-2xl text-foreground font-sans">
        <DialogTitle className="sr-only">{strings.searchTitle || 'Search'}</DialogTitle>
        <Command
          className="rounded-lg border border-border shadow-md overflow-hidden bg-card"
          shouldFilter={false}
        >
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={strings.searchGlobalPlaceholder || strings.search || 'Search...'}
            />
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {query.length > 1
                ? (strings.noResults || 'No results.')
                : (strings.searchTypeAtLeast || 'Type at least 2 characters.')}
            </Command.Empty>
            {results.length > 0 && (
              <Command.Group heading={strings.searchResults || strings.searchTitle || 'Results'} className="p-2 text-muted-foreground text-xs font-semibold">
                {results.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={result.id}
                    onSelect={() => onSelect(result)}
                    className="flex items-center gap-2 rounded-sm px-2 py-2.5 text-sm cursor-pointer hover:bg-white/5 aria-selected:bg-white/10 aria-selected:text-foreground text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-white/5 shrink-0">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-foreground truncate">{result.title}</span>
                        <span className="text-[9px] uppercase tracking-widest border border-border px-1 rounded bg-zinc-900 text-muted-foreground shrink-0">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {(result.subtitle || result.description) && (
                        <span className="text-xs text-muted-foreground truncate">
                          {result.subtitle ? (
                            <>
                              <span className="text-foreground/70">{result.subtitle}</span>
                              {result.description && <span> · {result.description}</span>}
                            </>
                          ) : (
                            result.description
                          )}
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
