import { useState, useEffect, useMemo, useCallback, useRef, Component, ErrorInfo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Trash2, Plus, Users, ChevronLeft, Check, Edit3, Copy, Pencil, X, Download, Upload } from "lucide-react";
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
    const saved = saveCharacter(char);
    setCharacters(getCharacters());
    setActiveChar(saved);
    setActiveView('sheet');
    setIsEditing(false);
    setNewName("");
    setNewClan("");
    toast({
      title: strings.characterCreated,
    });
  };

  // --- Character management handlers ---

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

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

  const handleRenameStart = (char: Character, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(char.id);
    setRenameValue(char.name);
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

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned = duplicateCharacter(id);
    if (cloned) {
      setCharacters(getCharacters());
      toast({ title: strings.char_duplicated || "Character duplicated" });
    }
  };

  const handleExport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = downloadCharacterExport(id);
    if (ok) {
      toast({ title: strings.char_exported || "Character exported" });
    }
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
                  <Card key={char.id} className="bg-card hover:bg-white/[0.02] border-border cursor-pointer transition-colors" onClick={() => handleOpenSheet(char)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
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
                        </div>
                      </div>
                    </CardHeader>
                    {/* Action buttons row */}
                    <div className="px-6 pb-4 pt-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleRenameStart(char, e)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        title={strings.char_rename || "Rename"}
                      >
                        <Pencil className="w-3.5 h-3.5" /> {strings.char_rename || "Rename"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDuplicate(char.id, e)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        title={strings.char_duplicate || "Duplicate"}
                      >
                        <Copy className="w-3.5 h-3.5" /> {strings.char_duplicate || "Duplicate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleExport(char.id, e)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        title={strings.char_export || "Export"}
                      >
                        <Download className="w-3.5 h-3.5" /> {strings.char_export || "Export"}
                      </Button>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(char.id, e)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-950/30 gap-1"
                        title={strings.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
                {/* Sticky sheet header — always accessible while scrolling */}
                <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border pb-4 mb-6 -mx-6 px-6 pt-2 md:-mx-10 md:px-10">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => { setActiveView('list'); setCharacters(getCharacters()); }} className="gap-2 text-muted-foreground hover:text-foreground -ml-4">
                      <ChevronLeft className="w-4 h-4" /> {strings.sheet_back}
                    </Button>
                    <div className="flex items-center gap-3">
                      {/* Visual mode indicator */}
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
    </div>
    </CharacterErrorBoundary>
  );
}
