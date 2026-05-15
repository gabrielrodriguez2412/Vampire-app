import { useState, useEffect, useMemo, useCallback, Component, ErrorInfo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Trash2, Plus, Users, ChevronLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { Character, EditionId } from "@/types";
import { clans } from "@/data/clans";
import { EDITION_LIST } from "@/data/editions";
import { getText, filterByEdition } from "@/utils/content";
import { useToast } from "@/hooks/use-toast";
import { getCharacters, saveCharacter, deleteCharacter, createEmptyCharacter, clearCharacterStorage } from "@/services/characterStorage";
import { DynamicSheet } from "@/components/character/DynamicSheet";
import { getSchemaForEdition } from "@/data/characterSheets/editions";

class CharacterErrorBoundary extends Component<{ onReset: () => void }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Character page render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">{UI_STRINGS['en'].character}</h1>
            <p className="text-muted-foreground mb-6">Character sheet could not be loaded. Reset character data or create a new character.</p>
          </div>
          <div className="rounded-lg border border-red-500/40 bg-red-950/10 p-6">
            <p className="text-sm text-red-300 mb-4">An unrecoverable error occurred while rendering the character sheet.</p>
            <Button onClick={this.props.onReset} className="bg-red-500 text-white">Reset Character Data</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CharacterPage() {
  const { activeLanguage, activeEdition } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const { toast } = useToast();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'sheet'>('list');
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  const [boundaryKey, setBoundaryKey] = useState(0);

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newClan, setNewClan] = useState("");
  const [newEdition, setNewEdition] = useState<EditionId>(activeEdition);

  const availableClans = useMemo(() => clans.filter(c => c.editionAvailability.includes(newEdition)), [newEdition]);

  useEffect(() => {
    try {
      const chars = getCharacters();
      setCharacters(Array.isArray(chars) ? chars : []);
    } catch (error) {
      console.error('Failed to load characters', error);
      setCharacters([]);
    }
  }, [boundaryKey]);

  const resetCharacterData = () => {
    clearCharacterStorage();
    setCharacters([]);
    setActiveChar(null);
    setActiveView('list');
    setBoundaryKey(prev => prev + 1);
    toast({ title: strings.saved, description: 'Character data reset.' });
  };

  const handleCreate = () => {
    if (!newName.trim() || !newClan) {
      toast({
        title: strings.missingData,
        description: strings.nameAndClanRequired,
        variant: "destructive"
      });
      return;
    }
    const char = createEmptyCharacter(newEdition, newClan, newName);
    const saved = saveCharacter(char);
    setCharacters(getCharacters());
    setActiveChar(saved);
    setActiveView('sheet');
    setNewName("");
    setNewClan("");
    toast({
      title: strings.characterCreated,
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCharacter(id);
    setCharacters(getCharacters());
  };

  const handleOpenSheet = (char: Character) => {
    setActiveChar(char);
    setActiveView('sheet');
  };

  // Debounced auto-save handler wrapper essentially
  const handleSheetUpdate = useCallback((updatedChar: Character) => {
    setActiveChar(updatedChar);
    saveCharacter(updatedChar);
  }, []);

  const getClanIcon = (clanId: string) => {
    const clan = clans.find(c => c.id === clanId);
    return clan?.icon || "🦇";
  };
  const getClanName = (clanId: string) => {
    const clan = clans.find(c => c.id === clanId);
    return clan ? getText(clan.name, activeLanguage) : clanId;
  };

  return (
    <CharacterErrorBoundary key={boundaryKey} onReset={resetCharacterData}>
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
        <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2 flex items-center gap-2">
          <User className="w-8 h-8" />
          {strings.character}
        </h1>
        <p className="text-muted-foreground mb-6">{strings.characterSheet}</p>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif">{strings.myCharacters}</h2>
              <Button onClick={() => setActiveView('create')} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4" /> {strings.createCharacter}
              </Button>
            </div>
            
            {characters.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-lg">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">{strings.noCharacters}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map(char => (
                  <Card key={char.id} className="bg-card hover:bg-white/[0.02] border-border cursor-pointer transition-colors" onClick={() => handleOpenSheet(char)}>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="font-serif text-xl mb-1">{char.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getClanIcon(char.clan)} {getClanName(char.clan)}</span>
                            <span>•</span>
                            <span className="uppercase text-[10px] tracking-wider border border-border px-1.5 rounded bg-zinc-900">{char.edition}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => handleDelete(char.id, e)} className="text-muted-foreground hover:text-red-400 hover:bg-red-950/30 -mt-2 -mr-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeView === 'create' && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Button variant="ghost" onClick={() => setActiveView('list')} className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> {strings.sheet_back}
            </Button>
            
            <Card className="bg-card border-border max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">{strings.sheet_create_new}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{strings.sheet_name}</label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} className="bg-background border-border" placeholder="e.g. Jeanette Voerman" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">{strings.sheet_select_edition}</label>
                  <select 
                    value={newEdition} 
                    onChange={e => {
                      setNewEdition(e.target.value as EditionId);
                      setNewClan(""); // Reset clan when edition changes
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    {EDITION_LIST.map(ed => (
                      <option key={ed.id} value={ed.id}>{ed.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{strings.sheet_select_clan}</label>
                  <select 
                    value={newClan} 
                    onChange={e => setNewClan(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="" disabled>{strings.selectClan}</option>
                    {availableClans.map(clan => (
                      <option key={clan.id} value={clan.id}>{getText(clan.name, activeLanguage)}</option>
                    ))}
                  </select>
                </div>

                <Button onClick={handleCreate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4">
                  {strings.createCharacter}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeView === 'sheet' && (
          <motion.div key="sheet" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            {activeChar ? (
              <>
                <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
                  <Button variant="ghost" onClick={() => { setActiveView('list'); setCharacters(getCharacters()); }} className="gap-2 text-muted-foreground hover:text-foreground -ml-4">
                    <ChevronLeft className="w-4 h-4" /> {strings.sheet_back}
                  </Button>
                  <div className="flex items-center gap-4">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground hidden sm:block">
                      {strings.saved}
                    </div>
                    <div className="px-3 py-1 bg-primary/20 border border-primary/30 text-primary rounded text-xs font-bold tracking-widest uppercase">
                      {typeof activeChar.edition === 'string' ? activeChar.edition : 'Unknown'}
                    </div>
                  </div>
                </div>

                <DynamicSheet 
                  character={activeChar} 
                  schema={getSchemaForEdition(activeChar.edition ?? 'V5' as EditionId)} 
                  onChange={handleSheetUpdate} 
                />
              </>
            ) : (
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-950/10 p-6">
                <p className="text-sm text-yellow-200 mb-4">Character sheet could not be loaded. Reset character data or create a new character.</p>
                <Button onClick={resetCharacterData} className="bg-yellow-500 text-black">Reset Character Data</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </CharacterErrorBoundary>
  );
}
