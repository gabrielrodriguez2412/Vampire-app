import { motion } from "framer-motion";
import { roleplay } from "@/data/roleplay";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function Roleplay() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2 flex items-center gap-3">
          <MessageCircle className="w-8 h-8" />
          Interpretación
        </h1>
        <p className="text-muted-foreground">
          Consejos para sumergirse en la mentalidad de un depredador no-muerto.
        </p>
      </div>

      <div className="space-y-8">
        {roleplay.map((section, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border-border overflow-hidden group">
              <CardHeader className="bg-white/[0.02] border-b border-border">
                <CardTitle className="font-cinzel text-xl text-foreground group-hover:text-primary transition-colors">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {section.content.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-foreground/80 leading-relaxed">
                      <span className="text-primary mt-1.5 opacity-60 text-xs">◆</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}