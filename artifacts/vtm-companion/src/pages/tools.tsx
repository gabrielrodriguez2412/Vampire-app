import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Dices, AlertTriangle, ShieldAlert } from "lucide-react";

export default function Tools() {
  const [hunger, setHunger] = useState(1);
  
  // Dice Roller State
  const [dicePool, setDicePool] = useState(5);
  const [rollResult, setRollResult] = useState<{
    normal: number[];
    hunger: number[];
    successes: number;
    messyCritical: boolean;
    bestialFailure: boolean;
    criticals: number;
  } | null>(null);

  const handleRoll = () => {
    const actualHungerDice = Math.min(hunger, dicePool);
    const normalDiceCount = dicePool - actualHungerDice;
    
    const normal = Array.from({ length: normalDiceCount }, () => Math.floor(Math.random() * 10) + 1);
    const hungerRolls = Array.from({ length: actualHungerDice }, () => Math.floor(Math.random() * 10) + 1);
    
    let successes = 0;
    let normalTens = 0;
    let hungerTens = 0;
    let hungerOnes = 0;

    normal.forEach(d => {
      if (d >= 6) successes++;
      if (d === 10) normalTens++;
    });

    hungerRolls.forEach(d => {
      if (d >= 6) successes++;
      if (d === 10) hungerTens++;
      if (d === 1) hungerOnes++;
    });

    const totalTens = normalTens + hungerTens;
    const criticalPairs = Math.floor(totalTens / 2);
    successes += criticalPairs * 2; // Each pair of 10s adds 2 extra successes (total 4 per pair)

    const messyCritical = criticalPairs > 0 && hungerTens > 0;
    const bestialFailure = successes === 0 && hungerOnes > 0;

    setRollResult({
      normal,
      hunger: hungerRolls,
      successes,
      messyCritical,
      bestialFailure,
      criticals: criticalPairs
    });
  };

  const getHungerColor = (level: number) => {
    if (level === 1) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (level === 2) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    if (level === 3) return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    if (level === 4) return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-red-600 bg-red-600/20 border-red-600/30 animate-pulse";
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Herramientas Rápidas</h1>
        <p className="text-muted-foreground">Utilidades para usar durante la sesión de juego.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hunger Tracker */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-cinzel flex items-center gap-2">
              <Droplet className="w-5 h-5 text-red-500" /> 
              Rastreador de Hambre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setHunger(level)}
                  className={`flex-1 h-16 rounded-md border flex items-center justify-center text-xl font-bold transition-all ${
                    hunger >= level 
                      ? getHungerColor(level)
                      : "bg-background border-border text-muted-foreground opacity-30"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="text-sm text-center text-muted-foreground p-3 bg-black/20 rounded-md">
              {hunger === 1 && "Saciado. Tu Bestia duerme."}
              {hunger === 2 && "Hambriento. Empiezas a notar la sed."}
              {hunger === 3 && "Sediento. La Bestia se agita. Cuidado con los fallos."}
              {hunger === 4 && "Voraz. Estás a un paso de perder el control."}
              {hunger === 5 && "Inanición. Debes tirar Frenesí para no atacar al más cercano."}
            </div>
          </CardContent>
        </Card>

        {/* Dice Roller */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-cinzel flex items-center gap-2">
              <Dices className="w-5 h-5" /> 
              Tirada Rápida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">Reserva Total:</span>
              <div className="flex items-center bg-background rounded-md border border-border">
                <button onClick={() => setDicePool(Math.max(1, dicePool - 1))} className="px-3 py-1 hover:bg-white/5 border-r border-border">-</button>
                <span className="w-12 text-center font-bold">{dicePool}</span>
                <button onClick={() => setDicePool(Math.min(20, dicePool + 1))} className="px-3 py-1 hover:bg-white/5 border-l border-border">+</button>
              </div>
              <Button onClick={handleRoll} className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90">
                Tirar
              </Button>
            </div>

            {rollResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/20 p-4 rounded-lg border border-white/5"
              >
                <div className="flex justify-between items-end mb-4 border-b border-border pb-2">
                  <div>
                    <span className="text-3xl font-bold text-foreground">{rollResult.successes}</span>
                    <span className="text-muted-foreground ml-2">Éxitos</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {rollResult.normal.map((v, i) => (
                    <div key={`n-${i}`} className={`w-8 h-8 flex items-center justify-center rounded-sm font-bold text-sm ${
                      v === 10 ? 'bg-foreground text-background' : 
                      v >= 6 ? 'bg-muted text-foreground' : 'bg-background border border-border text-muted-foreground'
                    }`}>
                      {v}
                    </div>
                  ))}
                  {rollResult.hunger.map((v, i) => (
                    <div key={`h-${i}`} className={`w-8 h-8 flex items-center justify-center rounded-sm font-bold text-sm ${
                      v === 10 ? 'bg-red-500 text-white' : 
                      v === 1 ? 'bg-red-950 border border-red-500 text-red-500' :
                      v >= 6 ? 'bg-red-900 text-red-100' : 'bg-background border border-red-900/50 text-red-900/50'
                    }`}>
                      {v}
                    </div>
                  ))}
                </div>

                {(rollResult.messyCritical || rollResult.bestialFailure) && (
                  <div className={`p-3 rounded-md flex items-center gap-2 text-sm font-bold ${
                    rollResult.messyCritical ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  }`}>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {rollResult.messyCritical && "¡CRÍTICO DESASTROSO! (La Bestia actúa)"}
                    {rollResult.bestialFailure && "¡FALLO BESTIAL! (Compulsión)"}
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
         {/* Cheat sheet */}
         <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-cinzel text-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Resumen de Combate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground/80">
            <p><strong>Cuerpo a Cuerpo:</strong> Tirada enfrentada. Daño = (Éxitos propios - Éxitos del rival) + Modificador del Arma.</p>
            <p><strong>A Distancia (con cobertura):</strong> Atacante vs Defensa (Dif. fija por cobertura o Destreza + Atletismo).</p>
            <p><strong>Daño Superficial:</strong> Balas, puños. Se divide a la mitad (redondeo arriba).</p>
            <p><strong>Daño Agravado:</strong> Fuego, sol, garras de vampiro. No se divide.</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}