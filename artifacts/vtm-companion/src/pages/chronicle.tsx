import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ScrollText, Plus, Pencil, Trash2, Archive, ArchiveRestore,
  MoreHorizontal, X, User, Users,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { useToast } from "@/hooks/use-toast";
import { Chronicle, ChronicleStatus, EditionId, Character } from "@/types";
import { EDITION_LIST } from "@/data/editions";
import {
  getChronicles,
  saveChronicle,
  createEmptyChronicle,
  updateChronicle,
  setChronicleStatus,
  deleteChronicle,
} from "@/services/chronicleStorage";
import { getCharacters } from "@/services/characterStorage";
import { clans } from "@/data/clans";
import { getClanDisplayNameById } from "@/utils/content";

type StatusFilter = 'all' | 'active' | 'archived';

interface ChronicleForm {
  name: string;
  description: string;
  setting: string;
  edition: EditionId | '';
}

const EMPTY_FORM: ChronicleForm = { name: '', description: '', setting: '', edition: '' };

export default function ChroniclePage() {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ChronicleForm>(EMPTY_FORM);

  // Edit modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChronicleForm>(EMPTY_FORM);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = () => {
    setChronicles(getChronicles());
    try {
      setCharacters(getCharacters());
    } catch (e) {
      console.error('Failed to load characters', e);
      setCharacters([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Group linked characters by chronicle id, split into PCs vs NPCs. Linked
  // characters whose chronicleId points to a missing chronicle are excluded
  // (they appear as "unassigned" elsewhere). Pure derivation from current state.
  const linkedByChronicle = useMemo(() => {
    const validIds = new Set(chronicles.map(c => c.id));
    const map = new Map<string, { pcs: Character[]; npcs: Character[] }>();
    for (const c of chronicles) map.set(c.id, { pcs: [], npcs: [] });
    for (const ch of characters) {
      if (!ch.chronicleId || !validIds.has(ch.chronicleId)) continue;
      const bucket = map.get(ch.chronicleId);
      if (!bucket) continue;
      if (ch.characterType === 'npc') bucket.npcs.push(ch);
      else bucket.pcs.push(ch);
    }
    // Stable display order: alphabetical by name
    const cmp = (a: Character, b: Character) =>
      (a.name || '').localeCompare(b.name || '', activeLanguage);
    for (const bucket of map.values()) {
      bucket.pcs.sort(cmp);
      bucket.npcs.sort(cmp);
    }
    return map;
  }, [chronicles, characters, activeLanguage]);

  const getClanIcon = (clanId: string) => {
    const clan = clans.find(c => c.id === clanId);
    return clan?.icon || "🦇";
  };

  const openCharacterSheet = (charId: string) => {
    try {
      sessionStorage.setItem('vtm-open-character-id', charId);
    } catch {
      // ignore — navigation still works, user just lands on the list
    }
    setLocation('/personaje');
  };

  const displayed = useMemo(() => {
    const filtered = chronicles.filter(c => {
      if (statusFilter === 'all') return true;
      return c.status === statusFilter;
    });
    return filtered.sort((a, b) => {
      const ta = Date.parse(a.updatedAt) || 0;
      const tb = Date.parse(b.updatedAt) || 0;
      return tb - ta;
    });
  }, [chronicles, statusFilter]);

  // --- Create ---
  const openCreate = () => {
    setCreateForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const handleCreate = () => {
    const name = createForm.name.trim();
    if (!name) {
      toast({
        title: strings.missingData || "Missing data",
        description: strings.chr_name_required || "Name is required",
        variant: "destructive",
      });
      return;
    }
    const chr = createEmptyChronicle(name, {
      description: createForm.description,
      setting: createForm.setting,
      edition: createForm.edition || undefined,
    });
    saveChronicle(chr);
    refresh();
    setCreateOpen(false);
    setCreateForm(EMPTY_FORM);
    toast({ title: strings.chr_created || "Chronicle created" });
  };

  // --- Edit ---
  const openEdit = (chr: Chronicle) => {
    setEditingId(chr.id);
    setEditForm({
      name: chr.name,
      description: chr.description || '',
      setting: chr.setting || '',
      edition: chr.edition || '',
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const trimmed = editForm.name.trim();
    if (!trimmed) {
      toast({
        title: strings.missingData || "Missing data",
        description: strings.chr_name_required || "Name is required",
        variant: "destructive",
      });
      return;
    }
    updateChronicle(editingId, {
      name: editForm.name,
      description: editForm.description,
      setting: editForm.setting,
      edition: editForm.edition || null,
    });
    refresh();
    setEditingId(null);
    setEditForm(EMPTY_FORM);
    toast({ title: strings.chr_updated || "Chronicle updated" });
  };

  // --- Archive / Unarchive ---
  const toggleArchive = (chr: Chronicle) => {
    const next: ChronicleStatus = chr.status === 'archived' ? 'active' : 'archived';
    setChronicleStatus(chr.id, next);
    refresh();
    toast({
      title: next === 'archived'
        ? (strings.chr_archived_toast || "Chronicle archived")
        : (strings.chr_unarchived_toast || "Chronicle unarchived"),
    });
  };

  // --- Delete ---
  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    deleteChronicle(deletingId);
    setDeletingId(null);
    refresh();
    toast({ title: strings.chr_deleted || "Chronicle deleted" });
  };

  const deletingChronicleName = deletingId
    ? chronicles.find(c => c.id === deletingId)?.name
    : '';

  const formatUpdatedAt = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2 flex items-center gap-2">
          <ScrollText className="w-8 h-8" />
          {strings.chronicle || "Chronicle"}
        </h1>
        <p className="text-muted-foreground">
          {strings.chr_subtitle || "Manage your campaigns and settings"}
        </p>
      </div>

      {/* Top action row */}
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <h2 className="text-xl font-serif">{strings.chronicleSection || "Chronicles"}</h2>
        <Button
          onClick={openCreate}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> {strings.chr_new_chronicle || "New Chronicle"}
        </Button>
      </div>

      {/* Status filter tabs */}
      {chronicles.length > 0 && (
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['active', 'archived', 'all'] as StatusFilter[]).map(opt => {
            const isActive = statusFilter === opt;
            const label =
              opt === 'active' ? (strings.chr_filter_active || "Active")
              : opt === 'archived' ? (strings.chr_filter_archived || "Archived")
              : (strings.chr_filter_all || "All");
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setStatusFilter(opt)}
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

      {/* List body */}
      {chronicles.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <ScrollText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {strings.chr_no_chronicles || "No chronicles yet. Create your first to get started."}
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <ScrollText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {strings.chr_no_match || "No chronicles match the filter."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-muted-foreground hover:text-foreground"
          >
            {strings.chr_filter_all || "All"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map(chr => {
            const isArchived = chr.status === 'archived';
            return (
              <Card
                key={chr.id}
                onClick={() => openEdit(chr)}
                className={`bg-card hover:bg-white/[0.02] border-border cursor-pointer transition-colors group ${
                  isArchived ? "opacity-70" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="font-serif text-xl mb-1 truncate">{chr.name}</CardTitle>
                      <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                        {chr.setting && <span className="truncate">{chr.setting}</span>}
                        {chr.setting && chr.edition && <span>•</span>}
                        {chr.edition && (
                          <span className="uppercase text-[10px] tracking-wider border border-border px-1.5 rounded bg-zinc-900">
                            {chr.edition}
                          </span>
                        )}
                        <span
                          className={`uppercase text-[10px] tracking-wider border px-1.5 rounded ${
                            isArchived
                              ? "border-zinc-700 bg-zinc-900 text-zinc-400"
                              : "border-primary/30 bg-primary/10 text-primary"
                          }`}
                        >
                          {isArchived
                            ? (strings.chr_status_archived || "Archived")
                            : (strings.chr_status_active || "Active")}
                        </span>
                      </div>
                    </div>

                    {/* ⋯ menu */}
                    <div onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity -mt-1 -mr-2"
                            aria-label="Chronicle actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => openEdit(chr)}
                            className="gap-2 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" /> {strings.edit || "Edit"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEdit(chr)}
                            className="gap-2 cursor-pointer"
                          >
                            <Users className="w-4 h-4" /> {strings.chr_manage_characters || "Linked characters"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleArchive(chr)}
                            className="gap-2 cursor-pointer"
                          >
                            {isArchived ? (
                              <>
                                <ArchiveRestore className="w-4 h-4" />
                                {strings.chr_unarchive || "Unarchive"}
                              </>
                            ) : (
                              <>
                                <Archive className="w-4 h-4" />
                                {strings.chr_archive || "Archive"}
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingId(chr.id)}
                            className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" /> {strings.delete || "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {(() => {
                  const linked = linkedByChronicle.get(chr.id);
                  const pcCount = linked?.pcs.length ?? 0;
                  const npcCount = linked?.npcs.length ?? 0;
                  const hasFooter = chr.description || pcCount > 0 || npcCount > 0 || chr.updatedAt;
                  if (!hasFooter) return null;
                  return (
                    <CardContent className="pt-0">
                      {chr.description && (
                        <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
                          {chr.description}
                        </p>
                      )}
                      {(pcCount > 0 || npcCount > 0) && (
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {pcCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] border border-primary/30 bg-primary/10 text-primary px-1.5 rounded"
                              title={strings.chr_linked_pcs || "Player Characters"}
                            >
                              <User className="w-3 h-3" /> {pcCount}
                            </span>
                          )}
                          {npcCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] border border-zinc-700 bg-zinc-900 text-zinc-400 px-1.5 rounded"
                              title={strings.chr_linked_npcs || "NPCs"}
                            >
                              <Users className="w-3 h-3" /> {npcCount}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground/60">
                        {strings.chr_updated_at || "Updated"} {formatUpdatedAt(chr.updatedAt)}
                      </div>
                    </CardContent>
                  );
                })()}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            key="create-chronicle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif text-foreground mb-4">
                {strings.chr_new_chronicle || "New Chronicle"}
              </h3>
              <ChronicleFormFields
                value={createForm}
                onChange={setCreateForm}
                strings={strings}
              />
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} className="text-muted-foreground">
                  {strings.cancel || "Cancel"}
                </Button>
                <Button size="sm" onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  {strings.chr_create_chronicle || "Create Chronicle"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingId && (() => {
          const linked = linkedByChronicle.get(editingId);
          const pcs = linked?.pcs ?? [];
          const npcs = linked?.npcs ?? [];
          const renderCharacterRow = (ch: Character) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => openCharacterSheet(ch.id)}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-colors text-sm"
              title={strings.chr_open_character || "Open sheet"}
            >
              <span className="text-base shrink-0">{getClanIcon(ch.clan)}</span>
              <span className="flex-1 min-w-0 truncate">{ch.name}</span>
              <span className="uppercase text-[10px] tracking-wider text-muted-foreground shrink-0">
                {getClanDisplayNameById(ch.clan, ch.edition as EditionId, activeLanguage)}
              </span>
            </button>
          );
          return (
            <motion.div
              key="edit-chronicle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setEditingId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-serif text-foreground mb-4">
                  {strings.chr_edit_chronicle || "Edit Chronicle"}
                </h3>
                <ChronicleFormFields
                  value={editForm}
                  onChange={setEditForm}
                  strings={strings}
                />

                {/* Linked characters */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground mb-3">
                    {strings.chr_linked_characters || "Linked characters"}
                  </p>
                  {pcs.length === 0 && npcs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      {strings.chr_no_linked_characters || "No linked characters yet."}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {pcs.length > 0 && (
                        <div>
                          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary mb-1.5">
                            <User className="w-3 h-3" /> {strings.chr_linked_pcs || "Player Characters"} ({pcs.length})
                          </p>
                          <div className="space-y-1">
                            {pcs.map(renderCharacterRow)}
                          </div>
                        </div>
                      )}
                      {npcs.length > 0 && (
                        <div>
                          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
                            <Users className="w-3 h-3" /> {strings.chr_linked_npcs || "NPCs"} ({npcs.length})
                          </p>
                          <div className="space-y-1">
                            {npcs.map(renderCharacterRow)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="text-muted-foreground">
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button size="sm" onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {strings.chr_save_changes || "Save Changes"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            key="delete-chronicle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif text-foreground mb-2">
                {strings.chr_confirm_delete || "Delete Chronicle?"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {strings.chr_confirm_delete_desc || "This action cannot be undone."}{' '}
                <span className="text-foreground font-medium">{deletingChronicleName}</span>
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setDeletingId(null)} className="text-muted-foreground">
                  {strings.cancel || "Cancel"}
                </Button>
                <Button size="sm" onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                  <Trash2 className="w-4 h-4 mr-1" /> {strings.delete || "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChronicleFormFieldsProps {
  value: ChronicleForm;
  onChange: (next: ChronicleForm) => void;
  strings: Record<string, string>;
}

function ChronicleFormFields({ value, onChange, strings }: ChronicleFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {strings.chr_chronicle_name || "Chronicle Name"}
        </label>
        <Input
          value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })}
          className="bg-background border-border"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {strings.chr_chronicle_description || "Description"}
        </label>
        <Textarea
          value={value.description}
          onChange={e => onChange({ ...value, description: e.target.value })}
          className="bg-background border-border min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {strings.chr_chronicle_setting || "Setting"}
          </label>
          <Input
            value={value.setting}
            onChange={e => onChange({ ...value, setting: e.target.value })}
            placeholder={strings.chr_chronicle_setting_placeholder || "City, region, etc."}
            className="bg-background border-border"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {strings.chr_chronicle_edition || "Edition"}
          </label>
          <select
            value={value.edition}
            onChange={e => onChange({ ...value, edition: e.target.value as EditionId | '' })}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">{strings.chr_chronicle_edition_none || "No edition"}</option>
            {EDITION_LIST.map(ed => (
              <option key={ed.id} value={ed.id}>{ed.shortName}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
