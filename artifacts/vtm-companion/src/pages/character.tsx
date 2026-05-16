import { useState, useEffect, useMemo, useCallback, useRef, Component, ErrorInfo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Trash2, Plus, Users, ChevronLeft, Check, Edit3, Copy, Pencil, X, Download, Upload, MoreHorizontal } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { Character, EditionId } from "@/types";
import { clans } from "@/data/clans";
import { EDITION_LIST } from "@/data/editions";
import { getClanDisplayName, getClanDisplayNameById, filterByEdition } from "@/utils/content";
import { useToast } from "@/hooks/use-toast";
import { getCharacters, saveCharacter, deleteCharacter, createEmptyCharacter, clearCharacterStorage, renameCharacter, duplicateCharacter, downloadCharacterExport, importCharacter } from "@/services/characterStorage";
import { DynamicSheet } from "@/components/character/DynamicSheet";
import { getSchemaForEdition } from "@/data/characterSheets/editions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

class CharacterErrorBoundary extends Component<{ onReset: () => void; children?: React.ReactNode }, { hasError: boolean }> {
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
  const [isEditing, setIsEditing] = useState(false);

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newClan, setNewClan] = useState("");
  const [newEdition, setNewEdition] = useState<EditionId>(activeEdition);
  // Optional identity fields (saved only if non-empty)
  const [newConcept, setNewConcept] = useState("");
  const [newChronicle, setNewChronicle] = useState("");
  const [newAmbition, setNewAmbition] = useState("");
  const [newDesire, setNewDesire] = useState("");
  const [newPredatorType, setNewPredatorType] = useState("");
  const [newNature, setNewNature] = useState("");
  const [newDemeanor, setNewDemeanor] = useState("");
  const [newSire, setNewSire] = useState("");
  const [newGeneration, setNewGeneration] = useState("");

  const resetCreateForm = () => {
    setNewName("");
    setNewClan("");
    setNewConcept("");
    setNewChronicle("");
    setNewAmbition("");
    setNewDesire("");
    setNewPredatorType("");
    setNewNature("");
    setNewDemeanor("");
    setNewSire("");
    setNewGeneration("");
  };

  // Character management state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    // Apply optional identity fields. Only assign trimmed non-empty values
    // so empty inputs don't clutter the saved object.
    const concept = newConcept.trim();
    const chronicle = newChronicle.trim();
    if (concept) char.concept = concept;
    if (chronicle) char.chronicle = chronicle;

    if (char.edition === 'V5') {
      const ambition = newAmbition.trim();
      const desire = newDesire.trim();
      const predatorType = newPredatorType.trim();
      if (ambition) char.ambition = ambition;
      if (desire) char.desire = desire;
      if (predatorType) char.predatorType = predatorType;
    } else {
      const nature = newNature.trim();
      const demeanor = newDemeanor.trim();
      const sire = newSire.trim();
      if (nature) char.nature = nature;
      if (demeanor) char.demeanor = demeanor;
      if (sire) char.sire = sire;
      const gen = parseInt(newGeneration, 10);
      if (Number.isFinite(gen) && gen >= 3 && gen <= 16) {
        char.generation = gen;
      }
    }

    const saved = saveCharacter(char);
    setCharacters(getCharacters());
    setActiveChar(saved);
    setActiveView('sheet');
    setIsEditing(false);
    resetCreateForm();
    toast({
      title: strings.characterCreated,
    });
  };

  // --- Character management handlers ---

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    deleteCharacter(deletingId);
    // If the deleted character is currently open, return to list
    if (activeChar?.id === deletingId) {
      setActiveChar(null);
      setActiveView('list');
    }
    setCharacters(getCharacters());
    setDeletingId(null);
    toast({ title: strings.char_deleted || "Character deleted" });
  };

  const handleDeleteCancel = () => {
    setDeletingId(null);
  };

  const handleRenameConfirm = () => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      toast({ title: strings.missingData, description: strings.char_name_required || "Name cannot be blank.", variant: "destructive" });
      return;
    }
    const updated = renameCharacter(renamingId, trimmed);
    if (updated) {
      setCharacters(getCharacters());
      // If the renamed character is currently open, update activeChar too
      if (activeChar?.id === renamingId) {
        setActiveChar(updated);
      }
      toast({ title: strings.saved });
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  // --- Import ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') throw new Error('Failed to read file');

        const parsed = JSON.parse(text);
        const result = importCharacter(parsed);

        if (typeof result === 'string') {
          // Validation error
          toast({ title: strings.char_import_failed || "Import failed", description: result, variant: "destructive" });
        } else {
          setCharacters(getCharacters());
          toast({ title: strings.char_imported || "Character imported", description: result.name });
        }
      } catch (err) {
        toast({ title: strings.char_import_failed || "Import failed", description: strings.char_import_invalid_json || "The file is not valid JSON.", variant: "destructive" });
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const handleOpenSheet = (char: Character) => {
    setActiveChar(char);
    setActiveView('sheet');
    setIsEditing(false);
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
  const getClanName = (clanId: string, charEdition?: EditionId) => {
    return getClanDisplayNameById(clanId, charEdition || activeEdition, activeLanguage);
  };

  const deletingCharName = deletingId ? characters.find(c => c.id === deletingId)?.name : '';

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

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            key="delete-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif text-foreground mb-2">{strings.char_confirm_delete || "Delete Character?"}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {strings.char_confirm_delete_desc || "This action cannot be undone."}{' '}
                <span className="text-foreground font-medium">{deletingCharName}</span>
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={handleDeleteCancel} className="text-muted-foreground">
                  {strings.cancel}
                </Button>
                <Button size="sm" onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                  <Trash2 className="w-4 h-4 mr-1" /> {strings.delete}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Hidden file input for import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif">{strings.myCharacters}</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleImportClick} className="gap-2 text-muted-foreground hover:text-foreground" size="sm">
                  <Upload className="w-4 h-4" /> {strings.char_import || "Import"}
                </Button>
                <Button onClick={() => setActiveView('create')} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4" /> {strings.createCharacter}
                </Button>
              </div>
            </div>
            
            {characters.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-lg">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">{strings.noCharacters}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map(char => (
                  <Card key={char.id} className="bg-card hover:bg-white/[0.02] border-border cursor-pointer transition-colors group" onClick={() => handleOpenSheet(char)}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {renamingId === char.id ? (
                            /* Inline rename editor */
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <Input
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                className="h-7 text-sm bg-zinc-950 border-zinc-700 font-serif"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameConfirm();
                                  if (e.key === 'Escape') handleRenameCancel();
                                }}
                              />
                              <Button variant="ghost" size="icon" onClick={handleRenameConfirm} className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-950/30">
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleRenameCancel} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <CardTitle className="font-serif text-xl mb-1 truncate">{char.name}</CardTitle>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getClanIcon(char.clan)} {getClanName(char.clan, char.edition as EditionId)}</span>
                            <span>•</span>
                            <span className="uppercase text-[10px] tracking-wider border border-border px-1.5 rounded bg-zinc-900">{char.edition}</span>
                          </div>
                          {char.updatedAt && (
                            <div className="text-[10px] text-muted-foreground/60 mt-1.5">
                              {new Date(char.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>

                        {/* ⋯ More menu */}
                        <div onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity -mt-1 -mr-2"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => { setRenamingId(char.id); setRenameValue(char.name); }}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" /> {strings.char_rename || "Rename"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { duplicateCharacter(char.id); setCharacters(getCharacters()); toast({ title: strings.char_duplicated || "Character duplicated" }); }}
                                className="gap-2 cursor-pointer"
                              >
                                <Copy className="w-4 h-4" /> {strings.char_duplicate || "Duplicate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { downloadCharacterExport(char.id); toast({ title: strings.char_exported || "Character exported" }); }}
                                className="gap-2 cursor-pointer"
                              >
                                <Download className="w-4 h-4" /> {strings.char_export || "Export"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingId(char.id)}
                                className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-950/30"
                              >
                                <Trash2 className="w-4 h-4" /> {strings.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
                      <option key={clan.id} value={clan.id}>{getClanDisplayName(clan, newEdition, activeLanguage)}</option>
                    ))}
                  </select>
                </div>

                {/* Optional identity fields */}
                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                    {strings.sheet_optional_details || "Optional details"}
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{strings.sheet_concept || "Concept"}</label>
                    <Input value={newConcept} onChange={e => setNewConcept(e.target.value)} className="bg-background border-border" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{strings.sheet_chronicle || "Chronicle"}</label>
                    <Input value={newChronicle} onChange={e => setNewChronicle(e.target.value)} className="bg-background border-border" />
                  </div>

                  {newEdition === 'V5' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{strings.sheet_ambition || "Ambition"}</label>
                        <Input value={newAmbition} onChange={e => setNewAmbition(e.target.value)} className="bg-background border-border" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{strings.sheet_desire || "Desire"}</label>
                        <Input value={newDesire} onChange={e => setNewDesire(e.target.value)} className="bg-background border-border" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{strings.sheet_predator_type || "Predator Type"}</label>
                        <Input value={newPredatorType} onChange={e => setNewPredatorType(e.target.value)} className="bg-background border-border" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{strings.sheet_nature || "Nature"}</label>
                        <Input value={newNature} onChange={e => setNewNature(e.target.value)} className="bg-background border-border" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{strings.sheet_demeanor || "Demeanor"}</label>
                        <Input value={newDemeanor} onChange={e => setNewDemeanor(e.target.value)} className="bg-background border-border" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{strings.sheet_sire || "Sire"}</label>
                        <Input value={newSire} onChange={e => setNewSire(e.target.value)} className="bg-background border-border" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{strings.sheet_generation || "Generation"}</label>
                        <Input
                          type="number"
                          min={3}
                          max={16}
                          value={newGeneration}
                          onChange={e => setNewGeneration(e.target.value)}
                          placeholder="13"
                          className="bg-background border-border"
                        />
                      </div>
                    </>
                  )}
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
                {/* In-flow sheet header (visible at top of sheet) */}
                <div className="border-b border-border pb-4 mb-8">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <Button variant="ghost" onClick={() => { setActiveView('list'); setCharacters(getCharacters()); }} className="gap-2 text-muted-foreground hover:text-foreground -ml-4">
                      <ChevronLeft className="w-4 h-4" /> {strings.sheet_back}
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 transition-colors ${
                        isEditing
                          ? "bg-primary/20 border border-primary/40 text-primary-foreground"
                          : "bg-zinc-800/60 border border-zinc-700/50 text-muted-foreground"
                      }`}>
                        {isEditing ? (
                          <>{strings.sheet_mode_edit || "Edit Mode"}</>
                        ) : (
                          <>{strings.sheet_mode_view || "View Mode"}</>
                        )}
                      </div>
                      <div className="px-3 py-1 bg-primary/20 border border-primary/30 text-primary rounded text-xs font-bold tracking-widest uppercase">
                        {typeof activeChar.edition === 'string' ? activeChar.edition : 'Unknown'}
                      </div>
                      <Button
                        variant={isEditing ? "default" : "outline"}
                        onClick={() => setIsEditing(!isEditing)}
                        size="sm"
                        className={`gap-2 ${isEditing ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {isEditing ? (
                          <>
                            <Check className="w-4 h-4" /> {strings.sheet_done || "Done"}
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4" /> {strings.sheet_edit || "Edit"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <DynamicSheet
                  character={activeChar}
                  schema={getSchemaForEdition(activeChar.edition ?? 'V5' as EditionId)}
                  onChange={handleSheetUpdate}
                  readonly={!isEditing}
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

      {/* Floating Edit/Done button — always reachable while scrolling.
          Rendered outside the animated <motion.div> so it isn't affected by its transform. */}
      {activeView === 'sheet' && activeChar && (
        <div className="fixed bottom-24 right-4 md:right-6 z-40 flex items-center gap-2">
          <span className={`hidden sm:inline-flex px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase items-center gap-1.5 shadow-md backdrop-blur-sm ${
            isEditing
              ? "bg-primary/30 border border-primary/50 text-primary-foreground"
              : "bg-zinc-900/80 border border-zinc-700/60 text-muted-foreground"
          }`}>
            {isEditing ? (strings.sheet_mode_edit || "Edit Mode") : (strings.sheet_mode_view || "View Mode")}
          </span>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            size="sm"
            aria-label={isEditing ? (strings.sheet_done || "Done") : (strings.sheet_edit || "Edit")}
            className={`gap-2 shadow-lg ${isEditing ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-zinc-900/90 border-zinc-700 text-foreground hover:bg-zinc-800 backdrop-blur-sm"}`}
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4" /> {strings.sheet_done || "Done"}
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" /> {strings.sheet_edit || "Edit"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
    </CharacterErrorBoundary>
  );
}
