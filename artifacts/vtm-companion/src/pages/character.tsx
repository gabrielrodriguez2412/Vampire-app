import { useState, useEffect, useMemo, useCallback, useRef, Component, ErrorInfo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Trash2, Plus, Users, ChevronLeft, Check, Edit3, Copy, Pencil, X, Download, Upload, MoreHorizontal, Printer, Database, ScrollText, Heart, HeartOff, Archive, ArchiveRestore, ListChecks, CheckSquare, Square, Sparkles, RotateCcw } from "lucide-react";
import {
  generateSuggestion,
  generateInspirationBundle,
  isFieldAvailable,
  GeneratorField,
} from "@/data/characterGenerator";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { Character, EditionId, CharacterType, CharacterStatus, Chronicle } from "@/types";
import { clans } from "@/data/clans";
import { EDITION_LIST } from "@/data/editions";
import { getClanDisplayName, getClanDisplayNameById, filterByEdition } from "@/utils/content";
import {
  sortAndFilterCharacters,
  CharacterSortKey,
  CharacterTypeFilter,
  CharacterEditionFilter,
  CharacterClanFilter,
  CharacterChronicleFilter,
  CharacterStatusFilter,
} from "@/utils/characterFilter";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { getCharacters, saveCharacter, deleteCharacter, createEmptyCharacter, clearCharacterStorage, renameCharacter, duplicateCharacter, downloadCharacterExport, importCharacter, getCharacterById, setCharacterType, setCharacterChronicle, setCharacterArchived } from "@/services/characterStorage";
import { downloadCharacterBulkExport, isCharacterBulkExport, importCharacterBulkExport } from "@/services/characterBulkExport";
import { useAppBackupActions } from "@/hooks/useAppBackupActions";
import { getChronicles } from "@/services/chronicleStorage";
import { DynamicSheet } from "@/components/character/DynamicSheet";
import { CharacterPrintModal } from "@/components/character/CharacterPrintView";
import { FavoriteButton } from "@/components/favorite-button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { getSchemaForEdition } from "@/data/characterSheets/editions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Batch AQ — Suggest button + preview chip used by the create-form
 * generator. The trigger never mutates the underlying input; clicking
 * "Generate" populates a `pendingValue` for the field, which the
 * caller renders as a small chip below the input. The chip carries
 * "Use" and "Dismiss" actions; "Use" is the only path that writes
 * into the form input. If the input is non-empty when the user
 * clicks "Use", a short warning is shown so the replacement is never
 * silent.
 */
interface SuggestButtonProps {
  field: GeneratorField;
  edition: EditionId;
  onGenerate: (field: GeneratorField, value: string) => void;
  strings: Record<string, string>;
  fieldLabel: string;
}

function SuggestButton({ field, edition, onGenerate, strings, fieldLabel }: SuggestButtonProps) {
  if (!isFieldAvailable(field, edition)) return null;
  const aria = (strings.gen_suggest_for || 'Suggest {field}').replace('{field}', fieldLabel);
  return (
    <button
      type="button"
      onClick={() => onGenerate(field, generateSuggestion(field, edition))}
      aria-label={aria}
      title={aria}
      data-testid={`gen-suggest-${field}`}
      className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
    >
      <Sparkles className="w-3 h-3" aria-hidden />
      {strings.gen_suggest || 'Suggest'}
    </button>
  );
}

interface SuggestionChipProps {
  field: GeneratorField;
  value: string;
  inputHasContent: boolean;
  onUse: () => void;
  onDismiss: () => void;
  strings: Record<string, string>;
}

function SuggestionChip({ field, value, inputHasContent, onUse, onDismiss, strings }: SuggestionChipProps) {
  return (
    <div
      data-testid={`gen-chip-${field}`}
      className="mt-1.5 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5"
    >
      <Sparkles className="w-3 h-3 mt-1 text-primary shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs italic text-foreground/80 break-words">{value}</p>
        {inputHasContent && (
          <p className="text-[10px] text-amber-300/80 mt-0.5">
            {strings.gen_replace_warning || 'This will replace your text.'}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onUse}
        className="h-6 px-2 text-[10px] uppercase tracking-wider"
        data-testid={`gen-use-${field}`}
      >
        <Check className="w-3 h-3 mr-1" /> {strings.gen_use || 'Use'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label={strings.gen_dismiss || 'Dismiss'}
        title={strings.gen_dismiss || 'Dismiss'}
        className="h-6 w-6 shrink-0"
        data-testid={`gen-dismiss-${field}`}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

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
  // Batch R: per-card favorite toggle. The character-card three-dot menu
  // surfaces "Add to favorites / Remove from favorites" so users can bookmark
  // a character without opening the sheet. Reuses the existing typed-favorite
  // store (`character:<id>` keys) shared with the Favorites page.
  const { isFavoriteTyped, toggleFavoriteTyped } = useFavorites();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'sheet'>('list');
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  const [boundaryKey, setBoundaryKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newClan, setNewClan] = useState("");
  const [newEdition, setNewEdition] = useState<EditionId>(activeEdition);
  const [newCharacterType, setNewCharacterType] = useState<CharacterType>('player');
  const [newChronicleId, setNewChronicleId] = useState<string>("");
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

  // Batch AQ — pending random-generator suggestions, keyed by the
  // GeneratorField id ('name', 'concept', 'ambition', ...). A null/
  // missing value means no suggestion is currently shown for that
  // field. The form input itself is NEVER mutated until the user
  // explicitly clicks "Use", so partially-typed entries are safe.
  const [suggestions, setSuggestions] = useState<Partial<Record<GeneratorField, string>>>({});
  // Inspiration panel — short prompts not tied to a specific form
  // input. Defaults to a fresh bundle on first render of the create
  // view; users can refresh with the on-panel button.
  const [inspiration, setInspiration] = useState<{ appearance: string; personality: string } | null>(null);

  const resetCreateForm = () => {
    setNewName("");
    setNewClan("");
    setNewCharacterType('player');
    setNewChronicleId("");
    setNewConcept("");
    setNewChronicle("");
    setNewAmbition("");
    setNewDesire("");
    setNewPredatorType("");
    setNewNature("");
    setNewDemeanor("");
    setNewSire("");
    setNewGeneration("");
    // Batch AQ — also clear any pending generator suggestions / inspiration.
    setSuggestions({});
    setInspiration(null);
  };

  // Batch AQ — generator helpers. Generation is read-only; applying a
  // suggestion is the only path that writes into a form input, and the
  // user has to click "Use" explicitly. Each setter list mirrors the
  // useState pairs declared above.
  const fieldSetters: Record<GeneratorField, ((next: string) => void) | undefined> = {
    name: setNewName,
    concept: setNewConcept,
    ambition: setNewAmbition,
    desire: setNewDesire,
    predator: setNewPredatorType,
    nature: setNewNature,
    demeanor: setNewDemeanor,
    // The inspiration-only fields don't have a target input — they live
    // in the Inspiration panel and are never auto-applied.
    appearance: undefined,
    personality: undefined,
  };

  const handleGenerateField = (field: GeneratorField, value: string) => {
    setSuggestions(prev => ({ ...prev, [field]: value }));
  };
  const handleUseSuggestion = (field: GeneratorField) => {
    const value = suggestions[field];
    if (!value) return;
    const setter = fieldSetters[field];
    if (setter) setter(value);
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const handleDismissSuggestion = (field: GeneratorField) => {
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const handleRefreshInspiration = () => {
    setInspiration(generateInspirationBundle());
  };

  // Character management state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  // Chronicle assignment modal
  const [assigningChronicleForId, setAssigningChronicleForId] = useState<string | null>(null);
  const [assignChronicleSelection, setAssignChronicleSelection] = useState<string>("");

  // List view: sort + filter UI state (purely display; never written back to storage)
  const [sortBy, setSortBy] = useState<CharacterSortKey>('updated');
  const [filterType, setFilterType] = useState<CharacterTypeFilter>('all');
  const [filterEdition, setFilterEdition] = useState<CharacterEditionFilter>('all');
  const [filterClan, setFilterClan] = useState<CharacterClanFilter>('all');
  const [filterChronicle, setFilterChronicle] = useState<CharacterChronicleFilter>('all');
  // Archive status tab. Defaults to 'active' (mirrors the Chronicle list) so
  // archived characters are tucked away until the user switches tabs.
  const [filterStatus, setFilterStatus] = useState<CharacterStatusFilter>('active');

  const availableClans = useMemo(() => clans.filter(c => c.editionAvailability.includes(newEdition)), [newEdition]);

  // Editions and clans actually present among the user's characters — keeps
  // filter dropdowns from listing options the user can't possibly use.
  const uniqueEditions = useMemo(
    () => Array.from(new Set(characters.map(c => c.edition))) as EditionId[],
    [characters]
  );
  const uniqueClans = useMemo(
    () => Array.from(new Set(characters.map(c => c.clan))).sort(),
    [characters]
  );

  // Valid chronicle id set — used by filter to treat dangling links as "unassigned".
  const validChronicleIds = useMemo(
    () => new Set(chronicles.map(c => c.id)),
    [chronicles]
  );
  const chronicleById = useMemo(() => {
    const m = new Map<string, Chronicle>();
    chronicles.forEach(c => m.set(c.id, c));
    return m;
  }, [chronicles]);

  // Sorted + filtered list for display only. Never written back to storage.
  const displayedCharacters = useMemo(
    () =>
      sortAndFilterCharacters(characters, {
        sortBy,
        filterType,
        filterEdition,
        filterClan,
        filterChronicle,
        filterStatus,
        validChronicleIds,
        language: activeLanguage,
      }),
    [characters, sortBy, filterType, filterEdition, filterClan, filterChronicle, filterStatus, validChronicleIds, activeLanguage]
  );

  const clearListFilters = () => {
    setFilterType('all');
    setFilterEdition('all');
    setFilterClan('all');
    setFilterChronicle('all');
    setFilterStatus('active');
  };

  // --- Bulk selection (Batch AB) ---
  const selection = useBulkSelection();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  // Batch AI: bulk-assign-chronicle modal state. Holds the chosen chronicle id
  // ("" means "no chronicle / unlink") while the modal is open.
  const [bulkAssignChronicleOpen, setBulkAssignChronicleOpen] = useState(false);
  const [bulkAssignChronicleSelection, setBulkAssignChronicleSelection] = useState<string>("");

  // Bulk handlers all loop over the selected ids, reusing the same per-item
  // storage helpers the single-item menu uses, then refresh + exit selection
  // mode. They never touch unselected characters.
  const bulkArchive = (status: CharacterStatus) => {
    selection.selectedIds.forEach(id => setCharacterArchived(id, status));
    setCharacters(getCharacters());
    selection.exit();
    toast({
      title: status === 'archived'
        ? (strings.bulk_archived_toast || "Archived selected")
        : (strings.bulk_unarchived_toast || "Restored selected"),
    });
  };

  const bulkSetType = (type: CharacterType) => {
    selection.selectedIds.forEach(id => setCharacterType(id, type));
    setCharacters(getCharacters());
    selection.exit();
    toast({ title: strings.bulk_updated_toast || "Selection updated" });
  };

  const bulkFavorite = (fav: boolean) => {
    // Only flip items that aren't already in the desired state, so the result
    // is deterministic regardless of each item's starting favorite status.
    selection.selectedIds.forEach(id => {
      if (isFavoriteTyped('character', id) !== fav) toggleFavoriteTyped('character', id);
    });
    selection.exit();
    toast({
      title: fav
        ? (strings.bulk_favorited_toast || "Added to favorites")
        : (strings.bulk_unfavorited_toast || "Removed from favorites"),
    });
  };

  /** Bulk JSON export of the currently-selected characters. Always one file. */
  const bulkExportSelected = () => {
    const ids = Array.from(selection.selectedIds);
    const filename = downloadCharacterBulkExport(ids);
    toast({
      title: filename
        ? (strings.bulk_exported_toast || "Exported selected characters")
        : (strings.bulk_export_failed_toast || "Bulk export failed"),
      ...(filename ? {} : { variant: "destructive" as const }),
    });
    if (filename) selection.exit();
  };

  /**
   * Batch AI — bulk assign the selected characters to a chronicle.
   *
   * Reuses the single-character `setCharacterChronicle` storage helper. That
   * helper updates only `chronicleId`; it never touches the free-text
   * `character.chronicle` field, so any manually-typed chronicle note on a
   * sheet is preserved. Stale ids (character no longer in storage) come back
   * as `null` from the helper and are silently skipped — same safe behavior
   * the per-card menu has.
   */
  const confirmBulkAssignChronicle = () => {
    const chronicleId = bulkAssignChronicleSelection || null;
    // Skip if the chosen chronicle has been deleted since the modal opened.
    if (chronicleId && !validChronicleIds.has(chronicleId)) {
      setBulkAssignChronicleOpen(false);
      setBulkAssignChronicleSelection("");
      toast({
        title: strings.char_import_failed || "Import failed",
        description: strings.chr_no_chronicles_to_link || "No chronicles yet. Create one in the Chronicle tab.",
        variant: "destructive",
      });
      return;
    }
    const ids = Array.from(selection.selectedIds);
    ids.forEach(id => setCharacterChronicle(id, chronicleId));
    setCharacters(getCharacters());
    // If the currently-open sheet is one of the reassigned characters, refresh
    // its activeChar reference so the chronicle pill repaints.
    if (activeChar && ids.includes(activeChar.id)) {
      const refreshed = getCharacterById(activeChar.id);
      if (refreshed) setActiveChar(refreshed);
    }
    setBulkAssignChronicleOpen(false);
    setBulkAssignChronicleSelection("");
    selection.exit();
    toast({ title: strings.bulk_assigned_chronicle_toast || "Characters assigned to chronicle" });
  };

  const confirmBulkDelete = () => {
    const ids = Array.from(selection.selectedIds);
    ids.forEach(id => deleteCharacter(id));
    if (activeChar && ids.includes(activeChar.id)) setActiveChar(null);
    setCharacters(getCharacters());
    setBulkDeleteOpen(false);
    selection.exit();
    toast({ title: strings.bulk_deleted_toast || "Deleted selected" });
  };

  /** Select every character in the current filtered list. */
  const selectAllDisplayed = () => selection.setSelection(displayedCharacters.map(c => c.id));

  // Refresh chronicles from storage; used after mount and when modals open
  // so the dropdowns always show the latest list.
  const refreshChronicles = useCallback(() => {
    try {
      setChronicles(getChronicles());
    } catch (error) {
      console.error('Failed to load chronicles', error);
      setChronicles([]);
    }
  }, []);

  useEffect(() => {
    try {
      const chars = getCharacters();
      setCharacters(Array.isArray(chars) ? chars : []);
    } catch (error) {
      console.error('Failed to load characters', error);
      setCharacters([]);
    }
    refreshChronicles();
  }, [boundaryKey, refreshChronicles]);

  // Batch AK — scroll the window to the top whenever we open a character
  // sheet. Without this, creating a new character (or opening one from a
  // scrolled list) lands the user mid-page, since switching `activeView`
  // does not implicitly reset scroll. Including `activeChar?.id` in the
  // deps so jumping between different sheets also resets scroll.
  useEffect(() => {
    if (activeView === 'sheet' && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeView, activeChar?.id]);

  // Cross-page deep-link: chronicle page sets `vtm-open-character-id` in
  // sessionStorage and navigates here; we consume it once on mount.
  useEffect(() => {
    try {
      const pendingId = sessionStorage.getItem('vtm-open-character-id');
      if (!pendingId) return;
      sessionStorage.removeItem('vtm-open-character-id');
      const target = getCharacterById(pendingId);
      if (target) {
        setActiveChar(target);
        setActiveView('sheet');
        setIsEditing(false);
      }
    } catch {
      // sessionStorage may be unavailable — ignore.
    }
  }, []);

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

    // Apply selected character type (createEmptyCharacter defaults to 'player';
    // override here if the user picked NPC).
    char.characterType = newCharacterType;

    // Apply optional identity fields. Only assign trimmed non-empty values
    // so empty inputs don't clutter the saved object.
    const concept = newConcept.trim();
    const chronicle = newChronicle.trim();
    if (concept) char.concept = concept;
    if (chronicle) char.chronicle = chronicle;
    // Link to a Chronicle if one was selected and still exists in storage.
    if (newChronicleId && validChronicleIds.has(newChronicleId)) {
      char.chronicleId = newChronicleId;
    }

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

  // Shared Full-App-Backup actions (export + import). The Chronicle page uses
  // the same hook so users have a single source of truth for backup behavior.
  const backup = useAppBackupActions({
    onAfterImport: () => setCharacters(getCharacters()),
  });

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

        // Batch AG post-fix: the normal Character Import button also accepts
        // the bulk export envelope (_vtmCharacterBulkExport) — same character
        // import, just multi-row. Route by shape so users do not have to pick
        // a different button.
        if (isCharacterBulkExport(parsed)) {
          const bulkResult = importCharacterBulkExport(parsed);
          if (typeof bulkResult === 'string') {
            toast({ title: strings.char_import_failed || "Import failed", description: bulkResult, variant: "destructive" });
          } else {
            setCharacters(getCharacters());
            const renamedNote = bulkResult.renamed > 0
              ? ` (${bulkResult.renamed} ${strings.char_backup_renamed || "renamed"})`
              : "";
            toast({
              title: strings.bulk_imported_toast || "Imported selected characters",
              description: `${bulkResult.imported} ${bulkResult.imported === 1 ? "character" : "characters"}${renamedNote}`,
            });
          }
          return;
        }

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

  // Full-App-Backup (v2) handlers are provided by `useAppBackupActions` above.
  // They include the export download, the file-input click, and the import
  // file reader with v2→v1 envelope auto-detection.

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

  /** Short pill label for the character-type tag (PC / NPC, localized). */
  const getTypeShortLabel = (type: CharacterType | undefined) => {
    return type === 'npc'
      ? (strings.char_type_short_npc || "NPC")
      : (strings.char_type_short_pc || "PC");
  };

  const deletingCharName = deletingId ? characters.find(c => c.id === deletingId)?.name : '';

  return (
    <CharacterErrorBoundary key={boundaryKey} onReset={resetCharacterData}>
      <div className={`max-w-5xl mx-auto w-full ${activeView === 'sheet' ? 'px-4 md:px-10 short-landscape:px-3 pt-4 md:pt-6 short-landscape:pt-2 pb-6 short-landscape:pb-2' : 'p-6 md:p-10 short-landscape:p-3'}`}>
        {/* Generic page header — redundant once a sheet is open (the sheet has
            its own large name + metadata header), so hide in sheet view. */}
        {activeView !== 'sheet' && (
          <div className="mb-8 short-landscape:mb-3">
            <h1 className="text-3xl short-landscape:text-xl font-serif font-bold text-primary mb-2 short-landscape:mb-1 flex items-center gap-2">
              <User className="w-8 h-8 short-landscape:w-5 short-landscape:h-5" />
              {strings.character}
            </h1>
            <p className="text-muted-foreground mb-6 short-landscape:mb-2 short-landscape:text-sm">{strings.characterSheet}</p>
          </div>
        )}

      {/* Chronicle assignment modal */}
      <AnimatePresence>
        {assigningChronicleForId && (() => {
          const targetChar = characters.find(c => c.id === assigningChronicleForId);
          if (!targetChar) return null;
          const handleClose = () => {
            setAssigningChronicleForId(null);
            setAssignChronicleSelection("");
          };
          const handleSave = () => {
            const value = assignChronicleSelection || null;
            const updated = setCharacterChronicle(targetChar.id, value);
            if (updated) {
              setCharacters(getCharacters());
              if (activeChar?.id === targetChar.id) setActiveChar(updated);
              toast({
                title: value
                  ? (strings.char_chronicle_set || "Chronicle assigned")
                  : (strings.char_chronicle_cleared || "Chronicle link removed"),
              });
            }
            handleClose();
          };
          return (
            <ModalPortal key="assign-chronicle">
            <motion.div
              key="assign-chronicle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 short-landscape:p-2"
              onClick={handleClose}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 short-landscape:p-3 max-w-md w-full shadow-xl short-landscape:max-h-[calc(100dvh-1rem)] short-landscape:overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-serif text-foreground mb-2">
                  {targetChar.chronicleId
                    ? (strings.char_change_chronicle || "Change Chronicle")
                    : (strings.char_assign_chronicle || "Assign Chronicle")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 truncate">
                  <span className="text-foreground font-medium">{targetChar.name}</span>
                </p>
                {chronicles.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic mb-4">
                    {strings.chr_no_chronicles_to_link || "No chronicles yet. Create one in the Chronicle tab."}
                  </p>
                ) : (
                  <div className="space-y-1.5 mb-2">
                    <label className="text-sm font-medium">
                      {strings.char_chronicle_label || "Chronicle"}
                    </label>
                    <select
                      value={assignChronicleSelection}
                      onChange={e => setAssignChronicleSelection(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">{strings.char_chronicle_none || "No chronicle"}</option>
                      {chronicles.map(chr => (
                        <option key={chr.id} value={chr.id}>
                          {chr.name}{chr.status === 'archived' ? ` (${strings.chr_status_archived || "Archived"})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3 justify-end mt-6">
                  <Button variant="outline" size="sm" onClick={handleClose} className="text-muted-foreground">
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {strings.save || "Save"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
            </ModalPortal>
          );
        })()}
      </AnimatePresence>

      {/* Bulk action bar (Batch AB) — floating, portaled above the bottom nav.
          Hidden while the bulk-delete confirm is open so it doesn't paint over
          the dialog. */}
      {selection.active && !bulkDeleteOpen && !bulkAssignChronicleOpen && (
        <BulkActionBar
          count={selection.count}
          selectedLabel={`${selection.count} ${strings.bulk_selected || "selected"}`}
          onCancel={selection.exit}
          cancelLabel={strings.cancel || "Cancel"}
          onSelectAll={selectAllDisplayed}
          selectAllLabel={strings.bulk_select_all || "Select all"}
          actionsMenuLabel={strings.bulk_actions || "Actions"}
          actions={[
            { id: 'favorite', label: strings.bulk_favorite || "Favorite", icon: <Heart className="w-3.5 h-3.5" />, onClick: () => bulkFavorite(true), disabled: selection.count === 0 },
            { id: 'unfavorite', label: strings.bulk_unfavorite || "Unfavorite", icon: <HeartOff className="w-3.5 h-3.5" />, onClick: () => bulkFavorite(false), disabled: selection.count === 0 },
            filterStatus === 'archived'
              ? { id: 'unarchive', label: strings.char_unarchive || "Unarchive", icon: <ArchiveRestore className="w-3.5 h-3.5" />, onClick: () => bulkArchive('active'), disabled: selection.count === 0 }
              : { id: 'archive', label: strings.char_archive || "Archive", icon: <Archive className="w-3.5 h-3.5" />, onClick: () => bulkArchive('archived'), disabled: selection.count === 0 },
            { id: 'npc', label: strings.char_mark_as_npc || "Mark as NPC", icon: <User className="w-3.5 h-3.5" />, onClick: () => bulkSetType('npc'), disabled: selection.count === 0 },
            { id: 'pc', label: strings.char_mark_as_player || "Mark as Player Character", icon: <User className="w-3.5 h-3.5" />, onClick: () => bulkSetType('player'), disabled: selection.count === 0 },
            { id: 'assign-chronicle', label: strings.bulk_assign_chronicle || "Assign chronicle", icon: <ScrollText className="w-3.5 h-3.5" />, onClick: () => { refreshChronicles(); setBulkAssignChronicleSelection(""); setBulkAssignChronicleOpen(true); }, disabled: selection.count === 0 },
            { id: 'export', label: strings.bulk_export || "Export", icon: <Download className="w-3.5 h-3.5" />, onClick: bulkExportSelected, disabled: selection.count === 0 },
            { id: 'delete', label: strings.delete, icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => setBulkDeleteOpen(true), disabled: selection.count === 0, destructive: true },
          ]}
        />
      )}

      {/* Bulk assign-chronicle modal (Batch AI) — portaled above everything.
          Reuses the per-character `setCharacterChronicle` helper, so the
          free-text chronicle note on each sheet is left alone. */}
      <AnimatePresence>
        {bulkAssignChronicleOpen && (() => {
          const selectedChars = characters.filter(c => selection.selectedIds.has(c.id));
          const reassignCount = selectedChars.filter(
            c => c.chronicleId && c.chronicleId !== bulkAssignChronicleSelection
          ).length;
          const noChronicles = chronicles.length === 0;
          const handleClose = () => {
            setBulkAssignChronicleOpen(false);
            setBulkAssignChronicleSelection("");
          };
          return (
            <ModalPortal key="bulk-assign-chronicle">
            <motion.div
              key="bulk-assign-chronicle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 short-landscape:p-2"
              onClick={handleClose}
              role="dialog"
              aria-modal="true"
              aria-label={strings.bulk_assign_chronicle_title || "Assign chronicle to selected"}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 short-landscape:p-3 max-w-md w-full shadow-xl short-landscape:max-h-[calc(100dvh-1rem)] short-landscape:overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-serif text-foreground mb-2">
                  {strings.bulk_assign_chronicle_title || "Assign chronicle to selected"}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="text-foreground font-medium">{selection.count}</span>{' '}
                  {strings.bulk_selected || "selected"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {strings.bulk_assign_chronicle_desc || "The selected characters will be linked to the chosen chronicle. The manually-typed chronicle text on each sheet is left alone."}
                </p>
                {noChronicles ? (
                  <p className="text-sm text-muted-foreground italic mb-4">
                    {strings.chr_no_chronicles_to_link || "No chronicles yet. Create one in the Chronicle tab."}
                  </p>
                ) : (
                  <div className="space-y-1.5 mb-2">
                    <label className="text-sm font-medium" htmlFor="bulk-assign-chronicle-select">
                      {strings.char_chronicle_label || "Chronicle"}
                    </label>
                    <select
                      id="bulk-assign-chronicle-select"
                      value={bulkAssignChronicleSelection}
                      onChange={e => setBulkAssignChronicleSelection(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">{strings.char_chronicle_none || "No chronicle"}</option>
                      {chronicles.map(chr => (
                        <option key={chr.id} value={chr.id}>
                          {chr.name}{chr.status === 'archived' ? ` (${strings.chr_status_archived || "Archived"})` : ""}
                        </option>
                      ))}
                    </select>
                    {reassignCount > 0 && bulkAssignChronicleSelection && (
                      <p className="text-[11px] text-amber-300/90 italic">
                        {strings.bulk_assign_chronicle_reassign_note || "Some selected characters are already linked to another chronicle and will be reassigned."}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-3 justify-end mt-6">
                  <Button variant="outline" size="sm" onClick={handleClose} className="text-muted-foreground">
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={confirmBulkAssignChronicle}
                    disabled={noChronicles || selection.count === 0}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {strings.save || "Save"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
            </ModalPortal>
          );
        })()}
      </AnimatePresence>

      {/* Bulk delete confirmation (Batch AB) — portaled above everything. */}
      <AnimatePresence>
        {bulkDeleteOpen && (
          <ModalPortal key="bulk-delete-characters">
          <motion.div
            key="bulk-delete-characters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setBulkDeleteOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif text-foreground mb-2">
                {strings.bulk_delete_title || "Delete selected characters?"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {strings.bulk_delete_desc || "This permanently deletes the selected characters and cannot be undone."}{' '}
                <span className="text-foreground font-medium">{`(${selection.count})`}</span>
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setBulkDeleteOpen(false)} className="text-muted-foreground">
                  {strings.cancel}
                </Button>
                <Button size="sm" onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">
                  <Trash2 className="w-4 h-4 mr-1" /> {strings.delete}
                </Button>
              </div>
            </motion.div>
          </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

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
            {/* Hidden file input for single-character import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
            {/* Hidden file input for the Full App Backup import. */}
            <input
              type="file"
              ref={backup.fileInputRef}
              accept=".json"
              className="hidden"
              onChange={backup.handleImportFile}
            />
            {/* On narrow screens we stack the title above the action row and
                give the action row a wrapping layout so Import/Backup/Create
                never overflow. The Create button is the visually primary
                action and gets full-width treatment on the smallest viewports
                so it stays reachable. */}
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-xl font-serif">{strings.myCharacters}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={handleImportClick} className="gap-2 text-muted-foreground hover:text-foreground" size="sm">
                  <Upload className="w-4 h-4" /> {strings.char_import || "Import"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-foreground"
                      aria-label={strings.full_backup || "Full Backup"}
                      title={strings.full_backup || "Full Backup"}
                    >
                      <Database className="w-4 h-4" />
                      <span className="hidden sm:inline">{strings.full_backup || "Full Backup"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1rem))]">
                    <div className="px-2 py-1.5 text-[11px] text-muted-foreground italic leading-snug">
                      {strings.full_backup_includes || "Includes characters, inventories, chronicles, sessions, locations, and relationships."}
                    </div>
                    <DropdownMenuItem
                      onClick={backup.handleExportAll}
                      className="gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> {strings.full_backup_export || "Export Full Backup"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={backup.handleImportClick}
                      className="gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> {strings.full_backup_import || "Import Full Backup"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => { refreshChronicles(); setActiveView('create'); }}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 ml-auto sm:ml-0"
                >
                  <Plus className="w-4 h-4" /> {strings.createCharacter}
                </Button>
              </div>
            </div>
            
            {/* Sort + filter controls (only when there's something to sort/filter) */}
            {characters.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  {strings.list_sort_label || "Sort"}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as CharacterSortKey)}
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary-container"
                  >
                    <option value="updated">{strings.list_sort_updated || "Recently updated"}</option>
                    <option value="name">{strings.list_sort_name || "Alphabetical (A–Z)"}</option>
                    <option value="clan">{strings.list_sort_clan || "Clan"}</option>
                    <option value="edition">{strings.list_sort_edition || "Edition"}</option>
                    <option value="type">{strings.list_sort_type || "Character type"}</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  {strings.list_filter_type_label || "Type"}
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as CharacterTypeFilter)}
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary-container"
                  >
                    <option value="all">{strings.list_filter_all || "All"}</option>
                    <option value="player">{strings.char_type_player || "Player Character"}</option>
                    <option value="npc">{strings.char_type_npc || "NPC"}</option>
                  </select>
                </label>

                {uniqueEditions.length > 1 && (
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    {strings.list_filter_edition_label || "Edition"}
                    <select
                      value={filterEdition}
                      onChange={e => setFilterEdition(e.target.value as CharacterEditionFilter)}
                      className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary-container"
                    >
                      <option value="all">{strings.list_filter_all || "All"}</option>
                      {EDITION_LIST.filter(ed => uniqueEditions.includes(ed.id)).map(ed => (
                        <option key={ed.id} value={ed.id}>{ed.shortName}</option>
                      ))}
                    </select>
                  </label>
                )}

                {uniqueClans.length > 1 && (
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    {strings.list_filter_clan_label || "Clan"}
                    <select
                      value={filterClan}
                      onChange={e => setFilterClan(e.target.value as CharacterClanFilter)}
                      className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary-container"
                    >
                      <option value="all">{strings.list_filter_all || "All"}</option>
                      {uniqueClans.map(clanId => (
                        <option key={clanId} value={clanId}>
                          {getClanDisplayNameById(clanId, activeEdition, activeLanguage)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {chronicles.length > 0 && (
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    {strings.list_filter_chronicle_label || "Chronicle"}
                    <select
                      value={filterChronicle}
                      onChange={e => setFilterChronicle(e.target.value as CharacterChronicleFilter)}
                      className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary-container"
                    >
                      <option value="all">{strings.list_filter_all || "All"}</option>
                      <option value="unassigned">{strings.char_chronicle_unassigned || "Unassigned"}</option>
                      {chronicles.map(chr => (
                        <option key={chr.id} value={chr.id}>{chr.name}</option>
                      ))}
                    </select>
                  </label>
                )}

                {!selection.active && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selection.enter}
                    className="h-8 gap-1.5 text-xs ml-auto"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    {strings.bulk_select || "Select"}
                  </Button>
                )}
              </div>
            )}

            {/* Archive status tabs (active / archived / all) — mirrors the
                Chronicle list. Counts are computed from the full character set
                so the badges stay accurate regardless of the active tab. */}
            {characters.length > 0 && (
              <div className="flex gap-1 mb-4 border-b border-border">
                {(['active', 'archived', 'all'] as CharacterStatusFilter[]).map(opt => {
                  const isActive = filterStatus === opt;
                  const count =
                    opt === 'active'   ? characters.filter(c => c.status !== 'archived').length
                    : opt === 'archived' ? characters.filter(c => c.status === 'archived').length
                    : characters.length;
                  const label =
                    opt === 'active'   ? `${strings.char_filter_active   || "Active"} (${count})`
                    : opt === 'archived' ? `${strings.char_filter_archived || "Archived"} (${count})`
                    : `${strings.char_filter_all || "All"} (${count})`;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFilterStatus(opt)}
                      aria-pressed={isActive}
                      className={`px-3 py-1.5 text-xs uppercase tracking-widest font-medium transition-colors border-b-2 -mb-px ${
                        isActive
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {characters.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-lg">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">{strings.noCharacters}</p>
              </div>
            ) : displayedCharacters.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-lg">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {strings.list_no_match || "No characters match the current filters."}
                </p>
                <Button variant="outline" size="sm" onClick={clearListFilters} className="text-muted-foreground hover:text-foreground">
                  {strings.list_clear_filters || "Clear filters"}
                </Button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${selection.active ? "pb-28" : ""}`}>
                {displayedCharacters.map(char => {
                  // Visual polish (Batch D): give each character card a
                  // subtle identity drawn from its clan's color theme.
                  // The clan data already ships a `colorTheme` hex for
                  // every clan; we reuse it as a 3px left accent strip
                  // and a faint radial glow in the top-right corner.
                  // All CSS-only — no new assets and no image loads.
                  //
                  // Batch AK follow-up (deferred): the chronicle card carries
                  // a faded ScrollText watermark in its corner. A matching
                  // clan-symbol watermark on the character card would balance
                  // them visually, but it pulls in clan-asset / licensing /
                  // responsive concerns the polish batch isn't scoped for —
                  // tracked for a dedicated batch.
                  const clanData = clans.find(c => c.id === char.clan);
                  const clanColor = clanData?.colorTheme || '#8B0000';
                  const isV5 = char.edition === 'V5';
                  const isSelected = selection.isSelected(char.id);
                  // Batch AK — visible favorite indicator. The More-menu
                  // toggle already exists; this just mirrors that state
                  // on the card itself so favorited characters are
                  // recognisable from the list without opening a menu.
                  const isFavCard = isFavoriteTyped('character', char.id);
                  return (
                  <Card
                    key={char.id}
                    onClick={() => selection.active ? selection.toggle(char.id) : handleOpenSheet(char)}
                    aria-pressed={selection.active ? isSelected : undefined}
                    className={`relative overflow-hidden bg-card hover:bg-white/[0.02] border-border cursor-pointer transition-all group focus-within:ring-1 focus-within:ring-primary/40 ${
                      selection.active && isSelected ? "ring-2 ring-primary" : ""
                    }`}
                    style={{
                      // Left accent + top-right radial glow, both keyed
                      // off the clan color. Kept very low-opacity so
                      // dense lists do not feel busy.
                      boxShadow: `inset 3px 0 0 ${clanColor}`,
                      backgroundImage: `radial-gradient(circle at top right, ${clanColor}1a, transparent 55%)`,
                    }}
                  >
                    <CardHeader className="pb-3 pl-5">
                      <div className="flex justify-between items-start gap-2">
                        {selection.active && (
                          <span
                            aria-hidden
                            className={`mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </span>
                        )}
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
                            <CardTitle className="font-serif text-xl mb-1.5 truncate tracking-tight group-hover:text-on-surface transition-colors">
                              {char.name}
                            </CardTitle>
                          )}
                          {/* Identity row: bigger clan icon + clan name,
                              with the icon visually anchored by the
                              clan color so the card reads as "a Brujah"
                              before the eye even reaches the badges. */}
                          <div className="flex items-center gap-2 text-sm text-foreground/80 mb-2">
                            <span
                              aria-hidden
                              className="text-base leading-none shrink-0"
                              style={{ color: clanColor, textShadow: `0 0 6px ${clanColor}55` }}
                            >
                              {getClanIcon(char.clan)}
                            </span>
                            <span className="truncate">{getClanName(char.clan, char.edition as EditionId)}</span>
                          </div>
                          {/* Badge row: edition, PC/NPC, optional
                              chronicle link. Edition tint follows the
                              same V5 / classic split the rest of the
                              app uses on the Tools combat summary. */}
                          <div className="flex items-center flex-wrap gap-1.5 text-sm text-muted-foreground">
                            {char.status === 'archived' && (
                              <span
                                className="inline-flex items-center gap-1 uppercase text-[10px] tracking-wider border px-1.5 rounded border-zinc-700 bg-zinc-900 text-zinc-400"
                                title={strings.char_status_archived || "Archived"}
                              >
                                <Archive className="w-3 h-3" />
                                {strings.char_status_archived || "Archived"}
                              </span>
                            )}
                            <span
                              className={`uppercase text-[10px] tracking-wider border px-1.5 rounded ${
                                isV5
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-amber-700/40 bg-amber-950/20 text-amber-300/90"
                              }`}
                              title={char.edition}
                            >
                              {char.edition}
                            </span>
                            <span
                              className={`uppercase text-[10px] tracking-wider border px-1.5 rounded ${
                                char.characterType === 'npc'
                                  ? "border-zinc-700 bg-zinc-900 text-zinc-400"
                                  : "border-primary/30 bg-primary/10 text-primary"
                              }`}
                              title={char.characterType === 'npc' ? (strings.char_type_npc || "NPC") : (strings.char_type_player || "Player Character")}
                            >
                              {getTypeShortLabel(char.characterType)}
                            </span>
                            {char.chronicleId && (() => {
                              const linkedChr = chronicleById.get(char.chronicleId);
                              const label = linkedChr ? linkedChr.name : (strings.char_chronicle_missing || "Unknown chronicle");
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] border px-1.5 rounded truncate max-w-[12rem] ${
                                    linkedChr
                                      ? "border-primary/30 bg-primary/5 text-foreground/80"
                                      : "border-zinc-700 bg-zinc-900 text-zinc-500 italic"
                                  }`}
                                  title={label}
                                >
                                  <ScrollText className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{label}</span>
                                </span>
                              );
                            })()}
                          </div>
                          {char.updatedAt && (
                            <div className="text-[10px] text-muted-foreground/60 mt-2 font-sans tracking-wide">
                              {new Date(char.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>

                        {/* ⋯ More menu.
                            Trigger visibility: the `md:opacity-0 md:group-hover:opacity-100`
                            pattern keeps the desktop card clean by only showing
                            the dots on hover/focus, but `md:` (≥ 768 px) also
                            matches landscape phones (e.g. 844×390), where there
                            is no real hover — touch users couldn't see the
                            button at all (Batch R bug report). `pointer-coarse:opacity-100`
                            forces the button visible on any touch / coarse-pointer
                            device, while desktop mouse users (pointer:fine,
                            hover:hover) keep the original reveal-on-hover
                            behaviour. The `focus:opacity-100` line still covers
                            keyboard users on desktop. */}
                        {/* Batch AK — top-right action cluster: the favourite
                            pip sits to the left of the ⋯ menu so a favourited
                            character reads as such from the corner of the
                            card, matching the chronicle card's corner-aligned
                            indicator. Always-visible (never tied to hover) so
                            touch users get the same affordance as desktop. */}
                        <div onClick={e => e.stopPropagation()} className={`flex items-center gap-1 -mt-1 -mr-1 ${selection.active ? "hidden" : ""}`}>
                          {isFavCard && (
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-primary/30 bg-primary/10 text-primary shrink-0"
                              aria-label={strings.favorite_indicator || "Favorite"}
                              title={strings.favorite_indicator || "Favorite"}
                              data-testid={`card-fav-indicator-character-${char.id}`}
                            >
                              <Heart className="w-3 h-3 fill-current" aria-hidden />
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={strings.more_actions || "More actions"}
                                title={strings.more_actions || "More actions"}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 pointer-coarse:opacity-100 transition-opacity -mt-1 -mr-2"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {/* Batch R: favorite toggle at the top of the menu.
                                  Routed through the typed-favorite store so the
                                  Favorites page picks it up alongside clans /
                                  disciplines / rules. Filled heart when already
                                  a favourite, mirroring `FavoriteButton`. No
                                  separator below — the rest of the menu items
                                  are all non-destructive actions; the only
                                  separator divides them from the red Delete at
                                  the bottom. (Initial Batch-R pass added a
                                  separator here that made the favorite item
                                  visually detached; manual QA flagged that as
                                  uneven spacing.) */}
                              {(() => {
                                const isFav = isFavoriteTyped('character', char.id);
                                return (
                                  <DropdownMenuItem
                                    onClick={() => toggleFavoriteTyped('character', char.id)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-primary' : ''}`} />
                                    {isFav
                                      ? (strings.favorite_remove || "Remove from favorites")
                                      : (strings.favorite_add || "Add to favorites")}
                                  </DropdownMenuItem>
                                );
                              })()}
                              <DropdownMenuItem
                                onClick={() => { setRenamingId(char.id); setRenameValue(char.name); }}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" /> {strings.char_rename || "Rename"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  refreshChronicles();
                                  setAssigningChronicleForId(char.id);
                                  setAssignChronicleSelection(char.chronicleId || "");
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <ScrollText className="w-4 h-4" />
                                {char.chronicleId
                                  ? (strings.char_change_chronicle || "Change Chronicle")
                                  : (strings.char_assign_chronicle || "Assign Chronicle")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const next: CharacterType = char.characterType === 'npc' ? 'player' : 'npc';
                                  const updated = setCharacterType(char.id, next);
                                  if (updated) {
                                    setCharacters(getCharacters());
                                    if (activeChar?.id === char.id) setActiveChar(updated);
                                    toast({
                                      title: next === 'npc'
                                        ? (strings.char_marked_npc || "Marked as NPC")
                                        : (strings.char_marked_player || "Marked as Player Character"),
                                    });
                                  }
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <User className="w-4 h-4" />
                                {char.characterType === 'npc'
                                  ? (strings.char_mark_as_player || "Mark as Player Character")
                                  : (strings.char_mark_as_npc || "Mark as NPC")}
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
                              <DropdownMenuItem
                                onClick={() => setPrintingId(char.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <Printer className="w-4 h-4" /> {strings.char_print_pdf || "Print / PDF"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const next: CharacterStatus = char.status === 'archived' ? 'active' : 'archived';
                                  const updated = setCharacterArchived(char.id, next);
                                  if (updated) {
                                    setCharacters(getCharacters());
                                    if (activeChar?.id === char.id) setActiveChar(updated);
                                    toast({
                                      title: next === 'archived'
                                        ? (strings.char_archived_toast || "Character archived")
                                        : (strings.char_unarchived_toast || "Character unarchived"),
                                    });
                                  }
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                {char.status === 'archived' ? (
                                  <>
                                    <ArchiveRestore className="w-4 h-4" /> {strings.char_unarchive || "Unarchive"}
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-4 h-4" /> {strings.char_archive || "Archive"}
                                  </>
                                )}
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
                  );
                })}
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
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium">{strings.sheet_name}</label>
                    <SuggestButton
                      field="name"
                      edition={newEdition}
                      onGenerate={handleGenerateField}
                      strings={strings}
                      fieldLabel={strings.sheet_name || 'Name'}
                    />
                  </div>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} className="bg-background border-border" placeholder="e.g. Jeanette Voerman" />
                  {suggestions.name && (
                    <SuggestionChip
                      field="name"
                      value={suggestions.name}
                      inputHasContent={newName.trim().length > 0}
                      onUse={() => handleUseSuggestion('name')}
                      onDismiss={() => handleDismissSuggestion('name')}
                      strings={strings}
                    />
                  )}
                </div>

                {/* Character type — Player Character vs NPC */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{strings.char_type_label || "Character Type"}</label>
                  <div className="flex gap-2" role="radiogroup" aria-label={strings.char_type_label || "Character Type"}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={newCharacterType === 'player'}
                      onClick={() => setNewCharacterType('player')}
                      className={`flex-1 px-3 py-2 rounded text-sm border transition-colors ${
                        newCharacterType === 'player'
                          ? "bg-primary/20 border-primary text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                      }`}
                    >
                      {strings.char_type_player || "Player Character"}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={newCharacterType === 'npc'}
                      onClick={() => setNewCharacterType('npc')}
                      className={`flex-1 px-3 py-2 rounded text-sm border transition-colors ${
                        newCharacterType === 'npc'
                          ? "bg-primary/20 border-primary text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-zinc-700"
                      }`}
                    >
                      {strings.char_type_npc || "NPC"}
                    </button>
                  </div>
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

                {/* Linked Chronicle — primary section, distinct from the legacy
                    free-text "Chronicle" note below. Sets `character.chronicleId`. */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <ScrollText className="w-4 h-4 text-primary" />
                    {strings.char_chronicle_label || "Linked Chronicle"}
                  </label>
                  {chronicles.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      {strings.chr_no_chronicles_to_link || "No chronicles yet. Create one in the Chronicle tab."}
                    </p>
                  ) : (
                    <select
                      value={newChronicleId}
                      onChange={e => setNewChronicleId(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">{strings.char_chronicle_none || "No chronicle"}</option>
                      {chronicles.map(chr => (
                        <option key={chr.id} value={chr.id}>
                          {chr.name}{chr.status === 'archived' ? ` (${strings.chr_status_archived || "Archived"})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {strings.char_chronicle_help || "Links this character to a saved Chronicle."}
                  </p>
                </div>

                {/* Optional identity fields */}
                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                    {strings.sheet_optional_details || "Optional details"}
                  </p>

                  {/* Batch AQ — Inspiration panel. Shows short evocative
                      prompts (appearance + personality hook) that the user
                      can read while filling out other fields. Nothing here
                      auto-fills any input — the panel is pure inspiration. */}
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2" data-testid="gen-inspiration-panel">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-primary/90 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" aria-hidden />
                        {strings.gen_inspiration_title || 'Inspiration'}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshInspiration}
                        className="h-6 px-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        data-testid="gen-inspiration-refresh"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {strings.gen_refresh || 'New suggestion'}
                      </Button>
                    </div>
                    {inspiration ? (
                      <div className="space-y-1 text-xs text-foreground/85">
                        <p data-testid="gen-inspiration-appearance">
                          <span className="text-muted-foreground italic">{strings.gen_appearance_label || 'Appearance'}: </span>
                          {inspiration.appearance}
                        </p>
                        <p data-testid="gen-inspiration-personality">
                          <span className="text-muted-foreground italic">{strings.gen_personality_label || 'Personal hook'}: </span>
                          {inspiration.personality}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-muted-foreground" data-testid="gen-inspiration-subtitle">
                        {strings.gen_inspiration_subtitle || 'Optional prompts — nothing fills in until you use it.'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium">{strings.sheet_concept || "Concept"}</label>
                      <SuggestButton
                        field="concept"
                        edition={newEdition}
                        onGenerate={handleGenerateField}
                        strings={strings}
                        fieldLabel={strings.sheet_concept || 'Concept'}
                      />
                    </div>
                    <Input value={newConcept} onChange={e => setNewConcept(e.target.value)} className="bg-background border-border" />
                    {suggestions.concept && (
                      <SuggestionChip
                        field="concept"
                        value={suggestions.concept}
                        inputHasContent={newConcept.trim().length > 0}
                        onUse={() => handleUseSuggestion('concept')}
                        onDismiss={() => handleDismissSuggestion('concept')}
                        strings={strings}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{strings.char_chronicle_note_label || "Chronicle note (free-text)"}</label>
                    <Input value={newChronicle} onChange={e => setNewChronicle(e.target.value)} className="bg-background border-border" />
                    <p className="text-[11px] text-muted-foreground">
                      {strings.char_chronicle_note_help || "Legacy free-text field. Informational only — does not link to a Chronicle."}
                    </p>
                  </div>

                  {newEdition === 'V5' ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium">{strings.sheet_ambition || "Ambition"}</label>
                          <SuggestButton field="ambition" edition={newEdition} onGenerate={handleGenerateField} strings={strings} fieldLabel={strings.sheet_ambition || 'Ambition'} />
                        </div>
                        <Input value={newAmbition} onChange={e => setNewAmbition(e.target.value)} className="bg-background border-border" />
                        {suggestions.ambition && (
                          <SuggestionChip field="ambition" value={suggestions.ambition} inputHasContent={newAmbition.trim().length > 0} onUse={() => handleUseSuggestion('ambition')} onDismiss={() => handleDismissSuggestion('ambition')} strings={strings} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium">{strings.sheet_desire || "Desire"}</label>
                          <SuggestButton field="desire" edition={newEdition} onGenerate={handleGenerateField} strings={strings} fieldLabel={strings.sheet_desire || 'Desire'} />
                        </div>
                        <Input value={newDesire} onChange={e => setNewDesire(e.target.value)} className="bg-background border-border" />
                        {suggestions.desire && (
                          <SuggestionChip field="desire" value={suggestions.desire} inputHasContent={newDesire.trim().length > 0} onUse={() => handleUseSuggestion('desire')} onDismiss={() => handleDismissSuggestion('desire')} strings={strings} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium">{strings.sheet_predator_type || "Predator Type"}</label>
                          <SuggestButton field="predator" edition={newEdition} onGenerate={handleGenerateField} strings={strings} fieldLabel={strings.sheet_predator_type || 'Predator Type'} />
                        </div>
                        <Input value={newPredatorType} onChange={e => setNewPredatorType(e.target.value)} className="bg-background border-border" />
                        {suggestions.predator && (
                          <SuggestionChip field="predator" value={suggestions.predator} inputHasContent={newPredatorType.trim().length > 0} onUse={() => handleUseSuggestion('predator')} onDismiss={() => handleDismissSuggestion('predator')} strings={strings} />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium">{strings.sheet_nature || "Nature"}</label>
                          <SuggestButton field="nature" edition={newEdition} onGenerate={handleGenerateField} strings={strings} fieldLabel={strings.sheet_nature || 'Nature'} />
                        </div>
                        <Input value={newNature} onChange={e => setNewNature(e.target.value)} className="bg-background border-border" />
                        {suggestions.nature && (
                          <SuggestionChip field="nature" value={suggestions.nature} inputHasContent={newNature.trim().length > 0} onUse={() => handleUseSuggestion('nature')} onDismiss={() => handleDismissSuggestion('nature')} strings={strings} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm font-medium">{strings.sheet_demeanor || "Demeanor"}</label>
                          <SuggestButton field="demeanor" edition={newEdition} onGenerate={handleGenerateField} strings={strings} fieldLabel={strings.sheet_demeanor || 'Demeanor'} />
                        </div>
                        <Input value={newDemeanor} onChange={e => setNewDemeanor(e.target.value)} className="bg-background border-border" />
                        {suggestions.demeanor && (
                          <SuggestionChip field="demeanor" value={suggestions.demeanor} inputHasContent={newDemeanor.trim().length > 0} onUse={() => handleUseSuggestion('demeanor')} onDismiss={() => handleDismissSuggestion('demeanor')} strings={strings} />
                        )}
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
                {/* Sheet header — see SheetHeader below for the layout. */}
                {(() => {
                  const linkedChr = activeChar.chronicleId ? chronicleById.get(activeChar.chronicleId) : undefined;
                  const hasLink = Boolean(activeChar.chronicleId);
                  const isMissing = hasLink && !linkedChr;
                  const openAssignModal = () => {
                    refreshChronicles();
                    setAssigningChronicleForId(activeChar.id);
                    setAssignChronicleSelection(activeChar.chronicleId || "");
                  };
                  const handleUnlink = () => {
                    const updated = setCharacterChronicle(activeChar.id, null);
                    if (updated) {
                      setCharacters(getCharacters());
                      setActiveChar(updated);
                      toast({ title: strings.char_chronicle_cleared || "Chronicle link removed" });
                    }
                  };
                  const handleToggleType = () => {
                    const next: CharacterType = activeChar.characterType === 'npc' ? 'player' : 'npc';
                    const updated = setCharacterType(activeChar.id, next);
                    if (updated) {
                      setCharacters(getCharacters());
                      setActiveChar(updated);
                      toast({
                        title: next === 'npc'
                          ? (strings.char_marked_npc || "Marked as NPC")
                          : (strings.char_marked_player || "Marked as Player Character"),
                      });
                    }
                  };
                  const isRenamingThis = renamingId === activeChar.id;

                  return (
                    <div className="border-b border-border/60 pb-3 short-landscape:pb-1 mb-4 short-landscape:mb-2">
                      {/* Top row — Back on the left, primary controls + More menu on the right.
                          Same flex row so the action cluster sits visually attached to the identity below. */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2 short-landscape:mb-1">
                        <Button variant="ghost" size="sm" onClick={() => { setActiveView('list'); setCharacters(getCharacters()); }} className="gap-1.5 -ml-2 h-8 px-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
                          <ChevronLeft className="w-3.5 h-3.5" /> {strings.sheet_back}
                        </Button>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase items-center gap-1.5 transition-colors hidden sm:inline-flex ${
                              isEditing
                                ? "bg-primary/20 border border-primary/40 text-primary-foreground"
                                : "bg-zinc-800/60 border border-zinc-700/50 text-muted-foreground"
                            }`}
                          >
                            {isEditing ? (strings.sheet_mode_edit || "Edit Mode") : (strings.sheet_mode_view || "View Mode")}
                          </span>
                          <FavoriteButton type="character" targetId={activeChar.id} className="h-8 w-8 text-muted-foreground" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPrintingId(activeChar.id)}
                            aria-label={strings.char_print_pdf || "Print / PDF"}
                            title={strings.char_print_pdf || "Print / PDF"}
                            className="gap-2 text-muted-foreground hover:text-foreground"
                          >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">{strings.char_print || "Print"}</span>
                          </Button>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label={strings.more_actions || "More actions"}
                                title={strings.more_actions || "More actions"}
                                className="px-2 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                              <DropdownMenuItem
                                onClick={() => { setRenamingId(activeChar.id); setRenameValue(activeChar.name); }}
                                className="gap-2 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" /> {strings.char_rename || "Rename"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { duplicateCharacter(activeChar.id); setCharacters(getCharacters()); toast({ title: strings.char_duplicated || "Character duplicated" }); }}
                                className="gap-2 cursor-pointer"
                              >
                                <Copy className="w-4 h-4" /> {strings.char_duplicate || "Duplicate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { downloadCharacterExport(activeChar.id); toast({ title: strings.char_exported || "Character exported" }); }}
                                className="gap-2 cursor-pointer"
                              >
                                <Download className="w-4 h-4" /> {strings.char_export || "Export"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={handleToggleType}
                                className="gap-2 cursor-pointer"
                              >
                                <User className="w-4 h-4" />
                                {activeChar.characterType === 'npc'
                                  ? (strings.char_mark_as_player || "Mark as Player Character")
                                  : (strings.char_mark_as_npc || "Mark as NPC")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={openAssignModal}
                                className="gap-2 cursor-pointer"
                              >
                                <ScrollText className="w-4 h-4" />
                                {hasLink
                                  ? (strings.char_change_chronicle || "Change Chronicle")
                                  : (strings.char_assign_chronicle || "Assign Chronicle")}
                              </DropdownMenuItem>
                              {hasLink && (
                                <DropdownMenuItem
                                  onClick={handleUnlink}
                                  className="gap-2 cursor-pointer"
                                >
                                  <X className="w-4 h-4" /> {strings.char_unlink_chronicle || "Unlink Chronicle"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingId(activeChar.id)}
                                className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-950/30"
                              >
                                <Trash2 className="w-4 h-4" /> {strings.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Identity block — name (inline-editable when renaming) */}
                      {isRenamingThis ? (
                        <div className="flex items-center gap-2 mb-1">
                          <Input
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            className="h-10 text-2xl md:text-3xl font-serif font-bold bg-transparent border-0 border-b border-zinc-700 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameConfirm();
                              if (e.key === 'Escape') handleRenameCancel();
                            }}
                          />
                          <Button variant="ghost" size="icon" onClick={handleRenameConfirm} className="h-9 w-9 text-green-400 hover:text-green-300 hover:bg-green-950/30 shrink-0">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={handleRenameCancel} className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <h2 className="text-2xl md:text-3xl short-landscape:text-lg font-serif font-bold text-primary leading-tight break-words">
                          {activeChar.name?.trim() || strings.unnamed_character || "Unnamed Character"}
                        </h2>
                      )}

                      {/* Metadata pill row — clan, edition, PC/NPC, chronicle.
                          All inline, pill-styled, mobile-friendly via flex-wrap. */}
                      <div className="mt-2 short-landscape:mt-1 flex flex-wrap items-center gap-2 short-landscape:gap-1.5 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true">{getClanIcon(activeChar.clan)}</span>
                          <span className="text-foreground/80">{getClanName(activeChar.clan, activeChar.edition as EditionId)}</span>
                        </span>
                        <span className="uppercase text-[10px] tracking-wider border border-border px-1.5 rounded bg-zinc-900">
                          {typeof activeChar.edition === 'string' ? activeChar.edition : 'Unknown'}
                        </span>
                        <span
                          className={`uppercase text-[10px] tracking-wider border px-1.5 rounded ${
                            activeChar.characterType === 'npc'
                              ? "border-zinc-700 bg-zinc-900 text-zinc-400"
                              : "border-primary/30 bg-primary/10 text-primary"
                          }`}
                          title={activeChar.characterType === 'npc' ? (strings.char_type_npc || "NPC") : (strings.char_type_player || "Player Character")}
                        >
                          {getTypeShortLabel(activeChar.characterType)}
                        </span>
                        {/* Chronicle pill — click to assign/change. Always visible
                            (management metadata, not gated on Edit Mode). */}
                        <button
                          type="button"
                          onClick={openAssignModal}
                          title={hasLink
                            ? (strings.char_change_chronicle || "Change Chronicle")
                            : (strings.char_assign_chronicle || "Assign Chronicle")}
                          className={`inline-flex items-center gap-1.5 text-[11px] border px-1.5 py-0.5 rounded max-w-[16rem] hover:border-primary/60 transition-colors ${
                            !hasLink
                              ? "border-zinc-700 bg-zinc-900 text-zinc-400 italic"
                              : isMissing
                                ? "border-zinc-700 bg-zinc-900 text-zinc-500 italic"
                                : "border-primary/30 bg-primary/5 text-foreground"
                          }`}
                        >
                          <ScrollText className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {hasLink
                              ? (linkedChr?.name || (strings.char_chronicle_missing || "Unknown chronicle"))
                              : (strings.char_chronicle_no_link || "No Chronicle linked")}
                          </span>
                          {linkedChr?.status === 'archived' && (
                            <span className="uppercase text-[9px] tracking-wider border border-zinc-700 px-1 rounded bg-zinc-900 text-zinc-400">
                              {strings.chr_status_archived || "Archived"}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <DynamicSheet
                  character={activeChar}
                  schema={getSchemaForEdition(activeChar.edition ?? 'V5' as EditionId)}
                  onChange={handleSheetUpdate}
                  readonly={!isEditing}
                  linkedChronicleName={activeChar.chronicleId ? chronicleById.get(activeChar.chronicleId)?.name : undefined}
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

      {/* Print preview modal — rendered at page root so it isn't constrained by motion.div transforms. */}
      {printingId && (() => {
        const target = activeChar?.id === printingId ? activeChar : getCharacterById(printingId);
        if (!target) return null;
        return (
          <CharacterPrintModal
            character={target}
            onClose={() => setPrintingId(null)}
          />
        );
      })()}

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
