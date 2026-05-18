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
  MoreHorizontal, X, User, Users, Link2, Link2Off, BookOpen, CalendarDays,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { useToast } from "@/hooks/use-toast";
import { Chronicle, ChronicleStatus, EditionId, Character, ChronicleSession } from "@/types";
import { EDITION_LIST } from "@/data/editions";
import {
  getChronicles,
  saveChronicle,
  createEmptyChronicle,
  updateChronicle,
  setChronicleStatus,
  deleteChronicle,
} from "@/services/chronicleStorage";
import { getCharacters, setCharacterChronicle } from "@/services/characterStorage";
import {
  getChronicleSessions,
  saveChronicleSession,
  createEmptyChronicleSession,
  updateChronicleSession,
  deleteChronicleSession,
  deleteChronicleSessionsForChronicle,
} from "@/services/chronicleSessionStorage";
import { clans } from "@/data/clans";
import { getClanDisplayNameById } from "@/utils/content";

type StatusFilter = 'all' | 'active' | 'archived';

type LinkPickerFilter = 'all' | 'pc' | 'npc' | 'unassigned' | 'other_chronicle';

type ManageTab = 'overview' | 'characters' | 'sessions';

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

  // Basic edit modal (core fields only: name/description/setting/edition)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChronicleForm>(EMPTY_FORM);

  // Manage modal (linked characters + sessions, tabbed)
  const [managingId, setManagingId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<ManageTab>('overview');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Link-picker modal state (opens from inside the manage modal)
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [linkPickerFilter, setLinkPickerFilter] = useState<LinkPickerFilter>('all');

  // Reassignment confirm (when picking a character that's linked elsewhere)
  const [pendingReassign, setPendingReassign] = useState<Character | null>(null);

  // Sessions belonging to the chronicle currently being managed.
  const [sessions, setSessions] = useState<ChronicleSession[]>([]);
  // Session editor (create or edit). `id === null` while creating a new one.
  const [sessionEditor, setSessionEditor] = useState<{
    id: string | null;
    title: string;
    summary: string;
    sessionDate: string;
    taggedCharacterIds: string[];
  } | null>(null);
  // Confirm modal for session deletion.
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

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

  // Reload sessions whenever the user opens/switches the manage modal. Cleared
  // when the modal closes so we don't leak the previous chronicle's sessions
  // into a future open.
  useEffect(() => {
    if (managingId) {
      setSessions(getChronicleSessions(managingId));
    } else {
      setSessions([]);
    }
  }, [managingId]);

  const refreshSessions = () => {
    if (managingId) setSessions(getChronicleSessions(managingId));
  };

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

  const chronicleNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of chronicles) m.set(c.id, c.name);
    return m;
  }, [chronicles]);

  const characterById = useMemo(() => {
    const m = new Map<string, Character>();
    for (const c of characters) m.set(c.id, c);
    return m;
  }, [characters]);

  const formatSessionDate = (iso: string): string => {
    try {
      // Accept both "YYYY-MM-DD" and full ISO timestamps. Local date display.
      const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  // Link a character to the chronicle currently being edited. If the character
  // already has a different chronicleId, callers should route through the
  // reassignment confirm — this helper just performs the write.
  const performLink = (charId: string, chronicleId: string) => {
    const updated = setCharacterChronicle(charId, chronicleId);
    if (!updated) return;
    setCharacters(getCharacters());
    toast({ title: strings.chr_character_linked || "Character linked" });
  };

  const performUnlink = (charId: string) => {
    const updated = setCharacterChronicle(charId, null);
    if (!updated) return;
    setCharacters(getCharacters());
    toast({ title: strings.chr_character_unlinked || "Character unlinked" });
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

  const closeEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  // --- Manage modal (linked characters + sessions, tabbed) ---
  const openManage = (chr: Chronicle, tab: ManageTab = 'overview') => {
    setManagingId(chr.id);
    setManageTab(tab);
  };

  const closeManage = () => {
    setManagingId(null);
    setManageTab('overview');
    setLinkPickerOpen(false);
    setPendingReassign(null);
    setSessionEditor(null);
    setDeletingSessionId(null);
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
    closeEdit();
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
    // Cascade: drop sessions tied to this chronicle so they don't accumulate
    // as orphans in localStorage. Character links are NOT touched — characters
    // simply revert to "Unknown chronicle" until reassigned.
    deleteChronicleSessionsForChronicle(deletingId);
    deleteChronicle(deletingId);
    setDeletingId(null);
    refresh();
    toast({ title: strings.chr_deleted || "Chronicle deleted" });
  };

  // --- Session handlers (all scoped to `managingId`) ---
  const openCreateSession = () => {
    if (!managingId) return;
    setSessionEditor({
      id: null,
      title: '',
      summary: '',
      sessionDate: '',
      taggedCharacterIds: [],
    });
  };

  const openEditSession = (session: ChronicleSession) => {
    setSessionEditor({
      id: session.id,
      title: session.title,
      summary: session.summary || '',
      sessionDate: session.sessionDate || '',
      taggedCharacterIds: [...session.taggedCharacterIds],
    });
  };

  const handleSessionSave = () => {
    if (!managingId || !sessionEditor) return;
    const title = sessionEditor.title.trim();
    if (!title) {
      toast({
        title: strings.missingData || "Missing data",
        description: strings.chr_session_title_required || "Title is required",
        variant: "destructive",
      });
      return;
    }
    if (sessionEditor.id) {
      updateChronicleSession(sessionEditor.id, {
        title,
        summary: sessionEditor.summary,
        sessionDate: sessionEditor.sessionDate,
        taggedCharacterIds: sessionEditor.taggedCharacterIds,
      });
      toast({ title: strings.chr_session_updated || "Session updated" });
    } else {
      const draft = createEmptyChronicleSession(managingId);
      saveChronicleSession({
        ...draft,
        title,
        summary: sessionEditor.summary || undefined,
        sessionDate: sessionEditor.sessionDate || undefined,
        taggedCharacterIds: sessionEditor.taggedCharacterIds,
      });
      toast({ title: strings.chr_session_created || "Session created" });
    }
    setSessionEditor(null);
    refreshSessions();
  };

  const handleSessionDeleteConfirm = () => {
    if (!deletingSessionId) return;
    deleteChronicleSession(deletingSessionId);
    setDeletingSessionId(null);
    refreshSessions();
    toast({ title: strings.chr_session_deleted || "Session deleted" });
  };

  const toggleSessionTag = (charId: string) => {
    setSessionEditor(prev => {
      if (!prev) return prev;
      const has = prev.taggedCharacterIds.includes(charId);
      return {
        ...prev,
        taggedCharacterIds: has
          ? prev.taggedCharacterIds.filter(id => id !== charId)
          : [...prev.taggedCharacterIds, charId],
      };
    });
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
                onClick={() => openManage(chr, 'overview')}
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
                            onClick={() => openManage(chr, 'overview')}
                            className="gap-2 cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" /> {strings.chr_open_manage || "Open"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEdit(chr)}
                            className="gap-2 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" /> {strings.chr_edit_basic_info || "Edit basic info"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openManage(chr, 'characters')}
                            className="gap-2 cursor-pointer"
                          >
                            <Users className="w-4 h-4" /> {strings.chr_manage_characters || "Linked characters"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openManage(chr, 'sessions')}
                            className="gap-2 cursor-pointer"
                          >
                            <ScrollText className="w-4 h-4" /> {strings.chr_sessions || "Session summaries"}
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

      {/* Basic Edit modal — core fields only (name, description, setting, edition).
          Linked characters and session summaries live in the Manage modal. */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            key="edit-chronicle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 pt-20 pb-28"
            onClick={closeEdit}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full shadow-xl max-h-[calc(100dvh-13rem)] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="shrink-0 px-6 pt-6 pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-serif text-foreground">
                  {strings.chr_edit_chronicle || "Edit Chronicle"}
                </h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                <ChronicleFormFields
                  value={editForm}
                  onChange={setEditForm}
                  strings={strings}
                />
              </div>
              <div className="shrink-0 flex gap-3 justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-900 rounded-b-lg">
                <Button variant="outline" size="sm" onClick={closeEdit} className="text-muted-foreground">
                  {strings.cancel || "Cancel"}
                </Button>
                <Button size="sm" onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {strings.chr_save_changes || "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage modal — tabbed view (Overview / Characters / Sessions). Opens
          via card click or the "Manage" dropdown item. Houses everything that
          used to be in the edit modal beyond basic fields. */}
      <AnimatePresence>
        {managingId && (() => {
          const chr = chronicles.find(c => c.id === managingId);
          if (!chr) return null;
          const linked = linkedByChronicle.get(managingId);
          const pcs = linked?.pcs ?? [];
          const npcs = linked?.npcs ?? [];
          const isArchived = chr.status === 'archived';

          const renderCharacterRow = (ch: Character) => (
            <div
              key={ch.id}
              className="flex items-center gap-1 rounded border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <button
                type="button"
                onClick={() => openCharacterSheet(ch.id)}
                className="flex-1 min-w-0 text-left flex items-center gap-2 px-2 py-1.5 text-sm"
                title={strings.chr_open_character || "Open sheet"}
              >
                <span className="text-base shrink-0">{getClanIcon(ch.clan)}</span>
                <span className="flex-1 min-w-0 truncate">{ch.name}</span>
                <span className="uppercase text-[10px] tracking-wider text-muted-foreground shrink-0">
                  {getClanDisplayNameById(ch.clan, ch.edition as EditionId, activeLanguage)}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => performUnlink(ch.id)}
                className="h-7 w-7 mr-1 text-muted-foreground hover:text-red-400"
                title={strings.chr_unlink_character || "Unlink"}
                aria-label={strings.chr_unlink_character || "Unlink"}
              >
                <Link2Off className="w-3.5 h-3.5" />
              </Button>
            </div>
          );

          const renderTagChip = (charId: string) => {
            const ch = characterById.get(charId);
            const baseClass =
              "inline-flex items-center gap-1 max-w-full text-[11px] px-1.5 py-0.5 rounded border transition-colors";
            if (!ch) {
              return (
                <span
                  key={charId}
                  className={`${baseClass} border-zinc-700 bg-zinc-900 text-zinc-500 italic`}
                  title={strings.chr_session_unknown_character || "Unknown character"}
                >
                  <X className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {strings.chr_session_unknown_character || "Unknown character"}
                  </span>
                </span>
              );
            }
            return (
              <button
                key={charId}
                type="button"
                onClick={() => openCharacterSheet(charId)}
                className={`${baseClass} border-primary/30 bg-primary/10 text-primary hover:bg-primary/20`}
                title={ch.name}
              >
                <span className="shrink-0">{getClanIcon(ch.clan)}</span>
                <span className="truncate">{ch.name}</span>
                {ch.characterType === 'npc' && (
                  <span className="uppercase text-[9px] tracking-wider opacity-70 shrink-0">
                    {strings.char_type_short_npc || "NPC"}
                  </span>
                )}
              </button>
            );
          };

          const renderSessionRow = (session: ChronicleSession) => {
            const dateLabel = session.sessionDate ? formatSessionDate(session.sessionDate) : '';
            return (
              <li
                key={session.id}
                className="rounded border border-zinc-800 bg-zinc-950/40 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-2 p-2.5">
                  <button
                    type="button"
                    onClick={() => openEditSession(session)}
                    className="flex-1 min-w-0 text-left"
                    title={strings.chr_session_edit || "Edit session"}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{session.title}</span>
                      {dateLabel && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                          <CalendarDays className="w-3 h-3" /> {dateLabel}
                        </span>
                      )}
                    </div>
                    {session.summary && (
                      <p className="text-xs text-foreground/70 line-clamp-2 mb-1.5">{session.summary}</p>
                    )}
                    {session.taggedCharacterIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {session.taggedCharacterIds.map(renderTagChip)}
                      </div>
                    )}
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditSession(session)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title={strings.chr_session_edit || "Edit session"}
                      aria-label={strings.chr_session_edit || "Edit session"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingSessionId(session.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-red-400"
                      title={strings.chr_session_delete || "Delete session"}
                      aria-label={strings.chr_session_delete || "Delete session"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          };

          const tabs: { id: ManageTab; label: string }[] = [
            { id: 'overview',   label: strings.chr_tab_overview   || "Overview" },
            { id: 'characters', label: strings.chr_tab_characters || "Characters" },
            { id: 'sessions',   label: strings.chr_tab_sessions   || "Sessions" },
          ];

          return (
            <motion.div
              key="manage-chronicle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 pt-20 pb-28"
              onClick={closeManage}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full shadow-xl max-h-[calc(100dvh-13rem)] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header: chronicle title + status, no tabs yet */}
                <div className="shrink-0 px-6 pt-6 pb-3 border-b border-zinc-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-serif text-foreground truncate">{chr.name}</h3>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mt-1">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeManage}
                      className="h-7 w-7 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
                      aria-label={strings.close || "Close"}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tab strip */}
                <div className="shrink-0 flex gap-1 px-4 border-b border-zinc-800 overflow-x-auto">
                  {tabs.map(t => {
                    const active = manageTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setManageTab(t.id)}
                        aria-pressed={active}
                        className={`px-3 py-2 text-xs uppercase tracking-widest font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                          active
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Body */}
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                  {manageTab === 'overview' && (
                    <div className="space-y-4">
                      {chr.description ? (
                        <p className="text-sm text-foreground/85 whitespace-pre-wrap">{chr.description}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          {strings.chr_no_description || "No description."}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
                        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {strings.chr_overview_characters || "Linked characters"}
                          </p>
                          <p className="text-2xl font-serif text-foreground">{pcs.length + npcs.length}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {pcs.length} {strings.char_type_short_pc || "PC"} · {npcs.length} {strings.char_type_short_npc || "NPC"}
                          </p>
                        </div>
                        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {strings.chr_overview_sessions || "Sessions"}
                          </p>
                          <p className="text-2xl font-serif text-foreground">{sessions.length}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {strings.chr_updated_at || "Updated"} {formatUpdatedAt(chr.updatedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-800 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { closeManage(); openEdit(chr); }}
                          className="gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {strings.chr_edit_basic_info || "Edit basic info"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleArchive(chr)}
                          className="gap-1.5"
                        >
                          {isArchived ? (
                            <>
                              <ArchiveRestore className="w-3.5 h-3.5" />
                              {strings.chr_unarchive || "Unarchive"}
                            </>
                          ) : (
                            <>
                              <Archive className="w-3.5 h-3.5" />
                              {strings.chr_archive || "Archive"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {manageTab === 'characters' && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                          {strings.chr_linked_characters || "Linked characters"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setLinkPickerFilter('all');
                            setLinkPickerOpen(true);
                          }}
                          className="gap-1.5 h-7 text-xs"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          {strings.chr_link_existing_character || "Link character"}
                        </Button>
                      </div>
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
                  )}

                  {manageTab === 'sessions' && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-muted-foreground">
                          <BookOpen className="w-3.5 h-3.5" />
                          {strings.chr_sessions || "Session summaries"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={openCreateSession}
                          className="gap-1.5 h-7 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {strings.chr_session_new || "New session"}
                        </Button>
                      </div>
                      {sessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          {strings.chr_no_sessions || "No session summaries yet."}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {sessions.map(renderSessionRow)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex gap-3 justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-900 rounded-b-lg">
                  <Button variant="outline" size="sm" onClick={closeManage} className="text-muted-foreground">
                    {strings.close || "Close"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Link picker modal: select an existing character to link to the chronicle
          currently being edited. Filterable by PC/NPC/unassigned/other-chronicle.
          Picking a character already linked elsewhere routes through a reassign
          confirm; otherwise links immediately. */}
      <AnimatePresence>
        {linkPickerOpen && managingId && (() => {
          // Candidates: everyone NOT already linked to this chronicle.
          const targetChronicleId = managingId;
          const candidates = characters.filter(ch => ch.chronicleId !== targetChronicleId);

          const filtered = candidates.filter(ch => {
            switch (linkPickerFilter) {
              case 'pc':
                return ch.characterType !== 'npc';
              case 'npc':
                return ch.characterType === 'npc';
              case 'unassigned':
                return !ch.chronicleId;
              case 'other_chronicle':
                return !!ch.chronicleId && ch.chronicleId !== targetChronicleId;
              case 'all':
              default:
                return true;
            }
          }).sort((a, b) => (a.name || '').localeCompare(b.name || '', activeLanguage));

          const handlePick = (ch: Character) => {
            if (ch.chronicleId && ch.chronicleId !== targetChronicleId) {
              setPendingReassign(ch);
              return;
            }
            performLink(ch.id, targetChronicleId);
          };

          const filterOptions: { value: LinkPickerFilter; label: string }[] = [
            { value: 'all', label: strings.chr_link_filter_all || "All" },
            { value: 'pc', label: strings.chr_link_filter_pc || "Player Characters" },
            { value: 'npc', label: strings.chr_link_filter_npc || "NPCs" },
            { value: 'unassigned', label: strings.chr_link_filter_unassigned || "Unassigned" },
            { value: 'other_chronicle', label: strings.chr_link_filter_other || "Linked to another Chronicle" },
          ];

          return (
            <motion.div
              key="link-picker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setLinkPickerOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full shadow-xl max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-serif text-foreground">
                    {strings.chr_link_existing_character || "Link character"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLinkPickerOpen(false)}
                    className="h-7 w-7 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
                    aria-label={strings.close || "Close"}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1.5 mb-3">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {strings.chr_link_filter_label || "Show"}
                  </label>
                  <select
                    value={linkPickerFilter}
                    onChange={e => setLinkPickerFilter(e.target.value as LinkPickerFilter)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none"
                  >
                    {filterOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
                  {characters.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">
                      {strings.chr_link_no_characters || "No characters available. Create one in the Character tab."}
                    </p>
                  ) : filtered.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">
                      {strings.chr_link_no_match || "No characters match this filter."}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {filtered.map(ch => {
                        const otherChronicleName = ch.chronicleId && ch.chronicleId !== targetChronicleId
                          ? chronicleNameById.get(ch.chronicleId)
                          : null;
                        const isNpc = ch.characterType === 'npc';
                        return (
                          <li key={ch.id}>
                            <button
                              type="button"
                              onClick={() => handlePick(ch)}
                              className="w-full text-left flex items-center gap-2 px-2 py-2 rounded border border-transparent hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm"
                            >
                              <span className="text-base shrink-0">{getClanIcon(ch.clan)}</span>
                              <span className="flex-1 min-w-0">
                                <span className="block truncate">{ch.name}</span>
                                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                                  {getClanDisplayNameById(ch.clan, ch.edition as EditionId, activeLanguage)}
                                  {ch.edition ? ` · ${ch.edition}` : ''}
                                  {otherChronicleName
                                    ? ` · ${strings.chr_link_currently_in || "in"} ${otherChronicleName}`
                                    : (!ch.chronicleId ? ` · ${strings.char_chronicle_unassigned || "Unassigned"}` : '')}
                                </span>
                              </span>
                              <span
                                className={`uppercase text-[10px] tracking-wider border px-1.5 rounded shrink-0 ${
                                  isNpc
                                    ? "border-zinc-700 bg-zinc-900 text-zinc-400"
                                    : "border-primary/30 bg-primary/10 text-primary"
                                }`}
                              >
                                {isNpc
                                  ? (strings.char_type_short_npc || "NPC")
                                  : (strings.char_type_short_pc || "PC")}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-zinc-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkPickerOpen(false)}
                    className="text-muted-foreground"
                  >
                    {strings.close || "Close"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Reassign confirm modal: shown when the picked character is already
          linked to a different Chronicle. Reassignment only happens on
          explicit confirm. */}
      <AnimatePresence>
        {pendingReassign && managingId && (() => {
          const targetChronicleId = managingId;
          const targetChronicleName = chronicleNameById.get(targetChronicleId) || '';
          const currentChronicleName = pendingReassign.chronicleId
            ? chronicleNameById.get(pendingReassign.chronicleId) || ''
            : '';
          const handleConfirm = () => {
            performLink(pendingReassign.id, targetChronicleId);
            setPendingReassign(null);
          };
          return (
            <motion.div
              key="reassign-confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setPendingReassign(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-serif text-foreground mb-2">
                  {strings.chr_reassign_title || "Reassign Character?"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {strings.chr_reassign_desc || "This character is already linked to another Chronicle."}
                </p>
                <div className="text-sm space-y-1 mb-6">
                  <div>
                    <span className="text-muted-foreground">{strings.chr_reassign_character || "Character"}:</span>{' '}
                    <span className="text-foreground font-medium">{pendingReassign.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{strings.chr_reassign_from || "Currently in"}:</span>{' '}
                    <span className="text-foreground">{currentChronicleName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{strings.chr_reassign_to || "Move to"}:</span>{' '}
                    <span className="text-foreground">{targetChronicleName}</span>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingReassign(null)}
                    className="text-muted-foreground"
                  >
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {strings.chr_reassign_confirm || "Reassign"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Session editor (create + edit). Linked characters of the current
          Chronicle appear first as "Linked" tag candidates; other characters
          fall under "Other". Tags toggle by click. */}
      <AnimatePresence>
        {sessionEditor && managingId && (() => {
          const linked = linkedByChronicle.get(managingId);
          const linkedAll = [...(linked?.pcs ?? []), ...(linked?.npcs ?? [])];
          const linkedIds = new Set(linkedAll.map(c => c.id));
          const others = characters
            .filter(c => !linkedIds.has(c.id))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', activeLanguage));
          const isEditing = sessionEditor.id !== null;

          const renderEditChip = (ch: Character) => {
            const selected = sessionEditor.taggedCharacterIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleSessionTag(ch.id)}
                className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border transition-colors ${
                  selected
                    ? "border-primary/60 bg-primary/20 text-primary"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                }`}
                title={ch.name}
              >
                <span className="shrink-0">{getClanIcon(ch.clan)}</span>
                <span className="truncate max-w-[10rem]">{ch.name}</span>
                {ch.characterType === 'npc' && (
                  <span className="uppercase text-[9px] tracking-wider opacity-70 shrink-0">
                    {strings.char_type_short_npc || "NPC"}
                  </span>
                )}
              </button>
            );
          };

          return (
            <motion.div
              key="session-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pt-20 pb-28"
              onClick={() => setSessionEditor(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full shadow-xl max-h-[calc(100dvh-13rem)] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="shrink-0 px-6 pt-6 pb-3 border-b border-zinc-800">
                  <h3 className="text-lg font-serif text-foreground">
                    {isEditing
                      ? (strings.chr_session_edit || "Edit session")
                      : (strings.chr_session_new || "New session")}
                  </h3>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {strings.chr_session_title || "Title"}
                    </label>
                    <Input
                      value={sessionEditor.title}
                      onChange={e =>
                        setSessionEditor(prev => prev ? { ...prev, title: e.target.value } : prev)
                      }
                      className="bg-background border-border"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {strings.chr_session_date || "Session date"}
                    </label>
                    <Input
                      type="date"
                      value={sessionEditor.sessionDate}
                      onChange={e =>
                        setSessionEditor(prev => prev ? { ...prev, sessionDate: e.target.value } : prev)
                      }
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {strings.chr_session_summary || "Summary"}
                    </label>
                    <Textarea
                      value={sessionEditor.summary}
                      onChange={e =>
                        setSessionEditor(prev => prev ? { ...prev, summary: e.target.value } : prev)
                      }
                      className="bg-background border-border min-h-[120px]"
                      placeholder={strings.chr_session_summary_placeholder || "What happened in this session?"}
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                      {strings.chr_session_tag_characters || "Tag characters"}
                    </p>

                    {linkedAll.length === 0 && others.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        {strings.chr_session_no_characters || "No characters available."}
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {linkedAll.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-primary mb-1.5">
                              {strings.chr_session_tag_linked || "Linked to this Chronicle"}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {linkedAll.map(renderEditChip)}
                            </div>
                          </div>
                        )}
                        {others.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                              {strings.chr_session_tag_other || "Other characters"}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {others.map(renderEditChip)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex gap-3 justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-900 rounded-b-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSessionEditor(null)}
                    className="text-muted-foreground"
                  >
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSessionSave}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {strings.save || "Save"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Session delete confirm */}
      <AnimatePresence>
        {deletingSessionId && (() => {
          const target = sessions.find(s => s.id === deletingSessionId);
          return (
            <motion.div
              key="delete-session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setDeletingSessionId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-serif text-foreground mb-2">
                  {strings.chr_session_confirm_delete || "Delete session?"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {strings.chr_session_confirm_delete_desc || "This action cannot be undone."}{' '}
                  {target?.title && (
                    <span className="text-foreground font-medium">{target.title}</span>
                  )}
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingSessionId(null)}
                    className="text-muted-foreground"
                  >
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSessionDeleteConfirm}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> {strings.delete || "Delete"}
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
