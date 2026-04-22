import { useState } from "react";
import { motion } from "framer-motion";
import { glossary } from "@/data/glossary";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Glossary() {
  const [filter, setFilter] = useState("");

  const filtered = glossary.filter(term => 
    term.term.toLowerCase().includes(filter.toLowerCase()) || 
    term.definition.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Glosario</h1>
        <p className="text-muted-foreground mb-6">Términos esenciales de la sociedad de la Sangre.</p>
        
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar término..." 
            className="pl-9 bg-card border-border"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((item, i) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-cinzel text-xl text-foreground">{item.term}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 leading-relaxed mb-4">
                  {item.definition}
                </p>
                {item.related.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground mr-1">Relacionado:</span>
                    {item.related.map(r => (
                      <Badge key={r} variant="secondary" className="bg-background border-border text-muted-foreground hover:bg-white/5 font-normal text-xs cursor-default">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No se encontró ningún término.
          </div>
        )}
      </div>
    </div>
  );
}