import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Command } from "cmdk";
import { Search, FileText, Users, BookOpen, BookText } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const results = useSearch(query);

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

  const onSelect = (url: string) => {
    onOpenChange(false);
    setLocation(url);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'clan': return <Users className="h-4 w-4 text-primary" />;
      case 'disciplina': return <BookOpen className="h-4 w-4 text-primary" />;
      case 'regla': return <FileText className="h-4 w-4 text-primary" />;
      case 'glosario': return <BookText className="h-4 w-4 text-primary" />;
      default: return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none shadow-2xl bg-card max-w-2xl text-foreground font-sans">
        <DialogTitle className="sr-only">Búsqueda Global</DialogTitle>
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
              placeholder="Buscar..."
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {query.length > 1 ? "Sin resultados." : "Escribe al menos 2 caracteres."}
            </Command.Empty>
            {results.length > 0 && (
              <Command.Group heading="Resultados" className="p-2 text-muted-foreground text-xs font-semibold">
                {results.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={result.id}
                    onSelect={() => onSelect(result.url)}
                    className="flex items-center gap-2 rounded-sm px-2 py-3 text-sm cursor-pointer hover:bg-white/5 aria-selected:bg-white/10 aria-selected:text-foreground text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-white/5">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{result.title}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                        {result.description}
                      </span>
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