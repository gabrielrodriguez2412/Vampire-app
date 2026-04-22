import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Trash2, Plus, Users, Save } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { Character } from "@/types";
import { clans } from "@/data/clans";
import { getText, filterByEdition } from "@/utils/content";
import { useToast } from "@/hooks/use-toast";

export default function CharacterPage() {
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const { toast } = useToast();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState("list");
  const [activeCharId, setActiveCharId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [clan, setClan] = useState("");
  const [concept, setConcept] = useState("");
  const [generation, setGeneration] = useState(13);
  const [bloodPotency, setBloodPotency] = useState(1);
  const [humanity, setHumanity] = useState(7);
  const [hunger, setHunger] = useState(1);
  const [attributes, setAttributes] = useState({
    strength: 1, dexterity: 1, stamina: 1,
    charisma: 1, manipulation: 1, composure: 1,
    intelligence: 1, wits: 1, resolve: 1
  });

  const availableClans = filterByEdition(clans, activeEdition);

  useEffect(() => {
    const saved = localStorage.getItem('vtm-characters');
    if (saved) {
      try {
        setCharacters(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const saveCharacters = (chars: Character[]) => {
    setCharacters(chars);
    localStorage.setItem('vtm-characters', JSON.stringify(chars));
  };

  const handleSave = () => {
    if (!name || !clan) {
      toast({ title: strings.missingData, description: strings.nameAndClanRequired, variant: "destructive" });
      return;
    }

    const newChar: Character = {
      id: crypto.randomUUID(),
      name, clan, concept,
      edition: activeEdition,
      generation: activeEdition !== 'v5' ? generation : undefined,
      bloodPotency: activeEdition === 'v5' ? bloodPotency : undefined,
      humanity,
      hunger: activeEdition === 'v5' ? hunger : undefined,
      attributes,
      createdAt: new Date().toISOString()
    };

    saveCharacters([...characters, newChar]);
    setActiveCharId(newChar.id);
    setActiveTab("sheet");
    toast({ title: strings.saved, description: strings.characterCreated });
    
    // reset
    setName(""); setClan(""); setConcept("");
  };

  const deleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveCharacters(characters.filter(c => c.id !== id));
    if (activeCharId === id) setActiveCharId(null);
  };

  const viewCharacter = (id: string) => {
    setActiveCharId(id);
    setActiveTab("sheet");
  };

  const updateAttr = (attr: keyof typeof attributes, val: number[]) => {
    setAttributes(prev => ({...prev, [attr]: val[0]}));
  };

  const activeChar = characters.find(c => c.id === activeCharId);
  const getClanName = (id: string) => {
    const c = clans.find(x => x.id === id);
    return c ? getText(c.name, activeLanguage) : id;
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-3">
        <User className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-cinzel font-bold text-foreground">{strings.characterSection}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger value="list" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Users className="w-4 h-4 mr-2"/> {strings.myCharacters}</TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><Plus className="w-4 h-4 mr-2"/> {strings.createCharacter}</TabsTrigger>
          <TabsTrigger value="sheet" disabled={!activeCharId} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"><User className="w-4 h-4 mr-2"/> {strings.characterSheet}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {characters.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-border rounded-lg bg-card/50">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p>{strings.noCharacters}</p>
              <Button variant="outline" className="mt-4" onClick={() => setActiveTab("create")}>
                {strings.createCharacter}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {characters.map(char => (
                  <motion.div key={char.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <Card className="bg-card hover:bg-white/[0.02] border-border cursor-pointer transition-colors" onClick={() => viewCharacter(char.id)}>
                      <CardHeader className="pb-2 flex flex-row justify-between items-start">
                        <div>
                          <CardTitle className="font-cinzel text-xl">{char.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{getClanName(char.clan)} • {char.edition.toUpperCase()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mt-2" onClick={(e) => deleteCharacter(char.id, e)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm line-clamp-1">{char.concept || "Sin concepto"}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-cinzel text-xl">{strings.createCharacter}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{strings.nameLabel}</label>
                  <Input value={name} onChange={e=>setName(e.target.value)} className="bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{strings.clanLabel}</label>
                  <select value={clan} onChange={e=>setClan(e.target.value)} className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="" disabled>Selecciona un clan</option>
                    {availableClans.map(c => <option key={c.id} value={c.id}>{getText(c.name, activeLanguage)}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-1 block">{strings.conceptLabel}</label>
                  <Input value={concept} onChange={e=>setConcept(e.target.value)} className="bg-background" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block flex justify-between">
                    {strings.humanity} <span>{humanity}</span>
                  </label>
                  <Slider value={[humanity]} onValueChange={v=>setHumanity(v[0])} min={1} max={10} step={1} />
                </div>
                
                {activeEdition === 'v5' ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block flex justify-between">
                        {strings.bloodPotency} <span>{bloodPotency}</span>
                      </label>
                      <Slider value={[bloodPotency]} onValueChange={v=>setBloodPotency(v[0])} min={0} max={10} step={1} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block flex justify-between">
                        {strings.hunger} <span>{hunger}</span>
                      </label>
                      <Slider value={[hunger]} onValueChange={v=>setHunger(v[0])} min={0} max={5} step={1} />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-2 block flex justify-between">
                      {strings.generation_label} <span>{generation}ª</span>
                    </label>
                    <Slider value={[generation]} onValueChange={v=>setGeneration(v[0])} min={4} max={15} step={1} />
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="font-cinzel text-lg mb-4 text-primary">{strings.attributes}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Physical */}
                  <div className="space-y-4 bg-background/50 p-4 rounded border border-white/5">
                    <h4 className="text-xs uppercase text-muted-foreground text-center tracking-widest font-bold border-b border-border pb-2">Físicos</h4>
                    {['strength', 'dexterity', 'stamina'].map(attr => (
                      <div key={attr}>
                        <label className="text-xs flex justify-between mb-1 text-foreground/80">{strings[attr as keyof typeof strings] || attr} <span>{attributes[attr as keyof typeof attributes]}</span></label>
                        <Slider value={[attributes[attr as keyof typeof attributes]]} onValueChange={v=>updateAttr(attr as any, v)} min={1} max={5} step={1} />
                      </div>
                    ))}
                  </div>
                  {/* Social */}
                  <div className="space-y-4 bg-background/50 p-4 rounded border border-white/5">
                    <h4 className="text-xs uppercase text-muted-foreground text-center tracking-widest font-bold border-b border-border pb-2">Sociales</h4>
                    {['charisma', 'manipulation', 'composure'].map(attr => (
                      <div key={attr}>
                        <label className="text-xs flex justify-between mb-1 text-foreground/80">{strings[attr as keyof typeof strings] || attr} <span>{attributes[attr as keyof typeof attributes]}</span></label>
                        <Slider value={[attributes[attr as keyof typeof attributes]]} onValueChange={v=>updateAttr(attr as any, v)} min={1} max={5} step={1} />
                      </div>
                    ))}
                  </div>
                  {/* Mental */}
                  <div className="space-y-4 bg-background/50 p-4 rounded border border-white/5">
                    <h4 className="text-xs uppercase text-muted-foreground text-center tracking-widest font-bold border-b border-border pb-2">Mentales</h4>
                    {['intelligence', 'wits', 'resolve'].map(attr => (
                      <div key={attr}>
                        <label className="text-xs flex justify-between mb-1 text-foreground/80">{strings[attr as keyof typeof strings] || attr} <span>{attributes[attr as keyof typeof attributes]}</span></label>
                        <Slider value={[attributes[attr as keyof typeof attributes]]} onValueChange={v=>updateAttr(attr as any, v)} min={1} max={5} step={1} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end bg-black/20 border-t border-border pt-4">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white"><Save className="w-4 h-4 mr-2"/> {strings.save}</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sheet">
          {activeChar ? (
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-cinzel text-3xl text-primary">{activeChar.name}</CardTitle>
                    <p className="text-muted-foreground text-lg mt-1">{getClanName(activeChar.clan)} • {activeChar.concept}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                      {activeChar.edition.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 bg-background/50 p-4 rounded border border-white/5 text-center">
                    <div className="text-xs text-muted-foreground uppercase">{strings.humanity}</div>
                    <div className="text-2xl font-cinzel text-foreground mt-1">{activeChar.humanity}</div>
                  </div>
                  {activeChar.edition === 'v5' ? (
                    <>
                      <div className="flex-1 bg-background/50 p-4 rounded border border-white/5 text-center">
                        <div className="text-xs text-muted-foreground uppercase">{strings.bloodPotency}</div>
                        <div className="text-2xl font-cinzel text-foreground mt-1">{activeChar.bloodPotency}</div>
                      </div>
                      <div className="flex-1 bg-background/50 p-4 rounded border border-white/5 text-center">
                        <div className="text-xs text-muted-foreground uppercase">{strings.hunger}</div>
                        <div className="text-2xl font-cinzel text-red-500 mt-1">{activeChar.hunger}</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 bg-background/50 p-4 rounded border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground uppercase">{strings.generation_label}</div>
                      <div className="text-2xl font-cinzel text-foreground mt-1">{activeChar.generation}ª</div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-cinzel text-xl border-b border-border pb-2 mb-4 text-primary">{strings.attributes}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Physical */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase text-muted-foreground border-b border-border/50 pb-1 mb-2">Físicos</h4>
                      {['strength', 'dexterity', 'stamina'].map(attr => (
                        <div key={attr} className="flex justify-between items-center text-sm">
                          <span>{strings[attr as keyof typeof strings] || attr}</span>
                          <div className="flex gap-1">
                            {Array.from({length: 5}).map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full ${i < activeChar.attributes[attr as keyof typeof activeChar.attributes] ? 'bg-primary' : 'bg-background border border-border'}`} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Social */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase text-muted-foreground border-b border-border/50 pb-1 mb-2">Sociales</h4>
                      {['charisma', 'manipulation', 'composure'].map(attr => (
                        <div key={attr} className="flex justify-between items-center text-sm">
                          <span>{strings[attr as keyof typeof strings] || attr}</span>
                          <div className="flex gap-1">
                            {Array.from({length: 5}).map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full ${i < activeChar.attributes[attr as keyof typeof activeChar.attributes] ? 'bg-primary' : 'bg-background border border-border'}`} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Mental */}
                    <div className="space-y-2">
                      <h4 className="text-xs uppercase text-muted-foreground border-b border-border/50 pb-1 mb-2">Mentales</h4>
                      {['intelligence', 'wits', 'resolve'].map(attr => (
                        <div key={attr} className="flex justify-between items-center text-sm">
                          <span>{strings[attr as keyof typeof strings] || attr}</span>
                          <div className="flex gap-1">
                            {Array.from({length: 5}).map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full ${i < activeChar.attributes[attr as keyof typeof activeChar.attributes] ? 'bg-primary' : 'bg-background border border-border'}`} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-10 text-muted-foreground">Selecciona un personaje de la lista</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
