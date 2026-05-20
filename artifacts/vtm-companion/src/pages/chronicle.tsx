import { useState, useEffect, useMemo, useRef } from "react";
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
  MapPin, Heart, ArrowRight, Database, Download, Upload,
  ChevronDown, ListChecks, HelpCircle, Gift, Sparkles,
} from "lucide-react";
import { useAppBackupActions } from "@/hooks/useAppBackupActions";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";
import { useToast } from "@/hooks/use-toast";
import {
  Chronicle, ChronicleStatus, EditionId, Character,
  ChronicleSession, ChronicleSessionDetails,
  ChronicleLocation, ChronicleLocationCategory,
  ChronicleRelationship, ChronicleRelationshipType, ChronicleRelationshipStatus,
} from "@/types";
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
  getAllChronicleSessions,
  saveChronicleSession,
  createEmptyChronicleSession,
  updateChronicleSession,
  deleteChronicleSession,
  deleteChronicleSessionsForChronicle,
} from "@/services/chronicleSessionStorage";
import {
  getChronicleLocations,
  getAllChronicleLocations,
  saveChronicleLocation,
  createEmptyChronicleLocation,
  updateChronicleLocation,
  deleteChronicleLocation,
  deleteChronicleLocationsForChronicle,
} from "@/services/chronicleLocationStorage";
import {
  getChronicleRelationships,
  getAllChronicleRelationships,
  saveChronicleRelationship,
  createEmptyChronicleRelationship,
  updateChronicleRelationship,
  deleteChronicleRelationship,
  deleteChronicleRelationshipsForChronicle,
} from "@/services/chronicleRelationshipStorage";
import { clans } from "@/data/clans";
import { getClanDisplayNameById } from "@/utils/content";

type StatusFilter = 'all' | 'active' | 'archived';

type LinkPickerFilter = 'all' | 'pc' | 'npc' | 'unassigned' | 'other_chronicle';

type ManageTab = 'overview' | 'characters' | 'sessions' | 'locations' | 'relationships';

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
  // Advanced detail fields are edited as plain text — array fields use
  // one-entry-per-line; the splitter that converts back to string[] lives in
  // `handleSessionSave` so the editor state stays simple.
  const [sessionEditor, setSessionEditor] = useState<{
    id: string | null;
    title: string;
    summary: string;
    sessionDate: string;
    taggedCharacterIds: string[];
    keyEventsText: string;
    unresolvedQuestionsText: string;
    rewards: string;
    nextHooks: string;
  } | null>(null);
  /** Local-only collapsed state for the editor's advanced detail group.
   *  Starts collapsed for new sessions (keeps the editor light) and opens
   *  automatically when an existing session already has detail content. */
  const [sessionAdvancedOpen, setSessionAdvancedOpen] = useState(false);
  /** Ref to the native date input in the session editor — used by the
   *  explicit "open picker" button to invoke showPicker() / focus(). */
  const sessionDateInputRef = useRef<HTMLInputElement>(null);
  // Confirm modal for session deletion.
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Locations belonging to the chronicle currently being managed.
  const [locations, setLocations] = useState<ChronicleLocation[]>([]);
  // Location editor (create or edit). `id === null` while creating a new one.
  const [locationEditor, setLocationEditor] = useState<{
    id: string | null;
    name: string;
    category: ChronicleLocationCategory;
    description: string;
    district: string;
    notes: string;
    linkedCharacterIds: string[];
  } | null>(null);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);

  // Relationships for the chronicle currently being managed.
  const [relationships, setRelationships] = useState<ChronicleRelationship[]>([]);
  const [relationshipEditor, setRelationshipEditor] = useState<{
    id: string | null;
    sourceCharacterId: string;
    targetCharacterId: string;
    relationshipType: ChronicleRelationshipType;
    status: ChronicleRelationshipStatus;
    description: string;
  } | null>(null);
  const [deletingRelationshipId, setDeletingRelationshipId] = useState<string | null>(null);

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

  // Full-App-Backup actions (shared with the Character page). Users browsing
  // the Chronicle area also need a way to back up — Chronicles, sessions,
  // locations, and relationships are all part of the same v2 backup.
  const backup = useAppBackupActions({
    onAfterImport: () => refresh(),
  });

  // Cross-page deep-link: home dashboard sets `vtm-open-chronicle-id` (and
  // optionally `vtm-open-chronicle-tab`) in sessionStorage and navigates here;
  // we consume it once on mount and open the manage modal for that chronicle.
  useEffect(() => {
    try {
      const pendingId = sessionStorage.getItem('vtm-open-chronicle-id');
      if (!pendingId) return;
      const pendingTab = sessionStorage.getItem('vtm-open-chronicle-tab') as ManageTab | null;
      sessionStorage.removeItem('vtm-open-chronicle-id');
      sessionStorage.removeItem('vtm-open-chronicle-tab');
      const target = getChronicles().find(c => c.id === pendingId);
      if (target) {
        setManagingId(target.id);
        const validTabs: ManageTab[] = ['overview', 'characters', 'sessions', 'locations', 'relationships'];
        setManageTab(pendingTab && validTabs.includes(pendingTab) ? pendingTab : 'overview');
      }
    } catch {
      // sessionStorage may be unavailable — ignore.
    }
  }, []);

  // Reload sessions whenever the user opens/switches the manage modal. Cleared
  // when the modal closes so we don't leak the previous chronicle's sessions
  // into a future open.
  useEffect(() => {
    if (managingId) {
      setSessions(getChronicleSessions(managingId));
      setLocations(getChronicleLocations(managingId));
      setRelationships(getChronicleRelationships(managingId));
    } else {
      setSessions([]);
      setLocations([]);
      setRelationships([]);
    }
  }, [managingId]);

  const refreshSessions = () => {
    if (managingId) setSessions(getChronicleSessions(managingId));
  };

  const refreshLocations = () => {
    if (managingId) setLocations(getChronicleLocations(managingId));
  };

  const refreshRelationships = () => {
    if (managingId) setRelationships(getChronicleRelationships(managingId));
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

  // Preload session/location/relationship counts for every chronicle so cards
  // can display all stats without opening the manage modal. Refreshes when the
  // manage modal closes (managingId flips to null) so counts stay accurate.
  const statsByChronicle = useMemo(() => {
    const allSessions = getAllChronicleSessions();
    const allLocations = getAllChronicleLocations();
    const allRelationships = getAllChronicleRelationships();
    const map = new Map<string, { sessions: number; locations: number; relationships: number }>();
    for (const c of chronicles) map.set(c.id, { sessions: 0, locations: 0, relationships: 0 });
    for (const s of allSessions) { const e = map.get(s.chronicleId); if (e) e.sessions++; }
    for (const l of allLocations) { const e = map.get(l.chronicleId); if (e) e.locations++; }
    for (const r of allRelationships) { const e = map.get(r.chronicleId); if (e) e.relationships++; }
    return map;
  }, [chronicles, managingId]);

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
    setLocationEditor(null);
    setDeletingLocationId(null);
    setRelationshipEditor(null);
    setDeletingRelationshipId(null);
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
    // Cascade: drop sessions and locations tied to this chronicle so they
    // don't accumulate as orphans in localStorage. Character links are NOT
    // touched — characters simply revert to "Unknown chronicle" until
    // reassigned.
    deleteChronicleSessionsForChronicle(deletingId);
    deleteChronicleLocationsForChronicle(deletingId);
    deleteChronicleRelationshipsForChronicle(deletingId);
    deleteChronicle(deletingId);
    setDeletingId(null);
    refresh();
    toast({ title: strings.chr_deleted || "Chronicle deleted" });
  };

  // --- Session handlers (all scoped to `managingId`) ---

  /**
   * Open the native date picker for the session-date input. Prefers
   * `HTMLInputElement.showPicker()` (modern Chromium / Firefox / Edge) so a
   * click on the explicit calendar button feels identical to clicking the
   * native calendar indicator. Falls back to focusing the input on browsers
   * without `showPicker` (older Safari), and swallows any thrown error
   * (`showPicker` can throw `NotAllowedError` if not triggered by user
   * activation, which our button-click satisfies but defensively guard
   * against to keep keyboard date entry usable everywhere).
   */
  const openSessionDatePicker = () => {
    const el = sessionDateInputRef.current;
    if (!el) return;
    const showPicker = (el as HTMLInputElement & { showPicker?: () => void }).showPicker;
    if (typeof showPicker === 'function') {
      try {
        showPicker.call(el);
        return;
      } catch {
        // Fall through to focus().
      }
    }
    el.focus();
  };

  /** Convert a string[] from storage back to a newline-joined string for the
   *  array-style textareas in the editor. Empty/missing → empty string. */
  const arrayToText = (arr?: string[]): string =>
    Array.isArray(arr) && arr.length > 0 ? arr.join('\n') : '';

  /** Convert the editor's newline-joined text back to a clean string[].
   *  Storage's `normalizeSessionDetails` will re-validate, but doing it here
   *  too keeps the in-memory state honest before persistence. */
  const textToArray = (text: string): string[] =>
    text.split('\n').map(s => s.trim()).filter(s => s.length > 0);

  /** Builds the `ChronicleSessionDetails | null` to pass to storage from the
   *  current editor state. Returns `null` when nothing meaningful remains so
   *  the caller can clear the field on the session. */
  const buildEditorDetails = (
    editor: NonNullable<typeof sessionEditor>
  ): ChronicleSessionDetails | null => {
    const keyEvents = textToArray(editor.keyEventsText);
    const unresolvedQuestions = textToArray(editor.unresolvedQuestionsText);
    const rewards = editor.rewards.trim();
    const nextHooks = editor.nextHooks.trim();
    const details: ChronicleSessionDetails = {};
    if (keyEvents.length > 0) details.keyEvents = keyEvents;
    if (unresolvedQuestions.length > 0) details.unresolvedQuestions = unresolvedQuestions;
    if (rewards) details.rewards = rewards;
    if (nextHooks) details.nextHooks = nextHooks;
    return Object.keys(details).length > 0 ? details : null;
  };

  const openCreateSession = () => {
    if (!managingId) return;
    setSessionEditor({
      id: null,
      title: '',
      summary: '',
      sessionDate: '',
      taggedCharacterIds: [],
      keyEventsText: '',
      unresolvedQuestionsText: '',
      rewards: '',
      nextHooks: '',
    });
    // New sessions start with the advanced group collapsed — keeps the
    // editor light for the common "title + summary + tags" use case.
    setSessionAdvancedOpen(false);
  };

  const openEditSession = (session: ChronicleSession) => {
    const d = session.details;
    const hasAdvanced = !!(
      d?.keyEvents?.length ||
      d?.unresolvedQuestions?.length ||
      d?.rewards ||
      d?.nextHooks
    );
    setSessionEditor({
      id: session.id,
      title: session.title,
      summary: session.summary || '',
      sessionDate: session.sessionDate || '',
      taggedCharacterIds: [...session.taggedCharacterIds],
      keyEventsText: arrayToText(d?.keyEvents),
      unresolvedQuestionsText: arrayToText(d?.unresolvedQuestions),
      rewards: d?.rewards || '',
      nextHooks: d?.nextHooks || '',
    });
    // Auto-expand the advanced group when there's existing content so the
    // user doesn't think their notes were lost.
    setSessionAdvancedOpen(hasAdvanced);
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
    const details = buildEditorDetails(sessionEditor);
    if (sessionEditor.id) {
      updateChronicleSession(sessionEditor.id, {
        title,
        summary: sessionEditor.summary,
        sessionDate: sessionEditor.sessionDate,
        taggedCharacterIds: sessionEditor.taggedCharacterIds,
        details,
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
        details: details ?? undefined,
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

  // --- Location handlers (all scoped to `managingId`) ---
  const openCreateLocation = () => {
    if (!managingId) return;
    setLocationEditor({
      id: null,
      name: '',
      category: 'other',
      description: '',
      district: '',
      notes: '',
      linkedCharacterIds: [],
    });
  };

  const openEditLocation = (loc: ChronicleLocation) => {
    setLocationEditor({
      id: loc.id,
      name: loc.name,
      category: loc.category,
      description: loc.description || '',
      district: loc.district || '',
      notes: loc.notes || '',
      linkedCharacterIds: [...loc.linkedCharacterIds],
    });
  };

  const handleLocationSave = () => {
    if (!managingId || !locationEditor) return;
    const name = locationEditor.name.trim();
    if (!name) {
      toast({
        title: strings.missingData || "Missing data",
        description: strings.chr_location_name_required || "Name is required",
        variant: "destructive",
      });
      return;
    }
    if (locationEditor.id) {
      updateChronicleLocation(locationEditor.id, {
        name,
        category: locationEditor.category,
        description: locationEditor.description,
        district: locationEditor.district,
        notes: locationEditor.notes,
        linkedCharacterIds: locationEditor.linkedCharacterIds,
      });
      toast({ title: strings.chr_location_updated || "Location updated" });
    } else {
      const draft = createEmptyChronicleLocation(managingId);
      saveChronicleLocation({
        ...draft,
        name,
        category: locationEditor.category,
        description: locationEditor.description || undefined,
        district: locationEditor.district || undefined,
        notes: locationEditor.notes || undefined,
        linkedCharacterIds: locationEditor.linkedCharacterIds,
      });
      toast({ title: strings.chr_location_created || "Location created" });
    }
    setLocationEditor(null);
    refreshLocations();
  };

  const handleLocationDeleteConfirm = () => {
    if (!deletingLocationId) return;
    deleteChronicleLocation(deletingLocationId);
    setDeletingLocationId(null);
    refreshLocations();
    toast({ title: strings.chr_location_deleted || "Location deleted" });
  };

  const toggleLocationLink = (charId: string) => {
    setLocationEditor(prev => {
      if (!prev) return prev;
      const has = prev.linkedCharacterIds.includes(charId);
      return {
        ...prev,
        linkedCharacterIds: has
          ? prev.linkedCharacterIds.filter(id => id !== charId)
          : [...prev.linkedCharacterIds, charId],
      };
    });
  };

  const locationCategoryLabel = (cat: ChronicleLocationCategory): string => {
    switch (cat) {
      case 'haven':        return strings.chr_loc_cat_haven        || "Haven";
      case 'elysium':      return strings.chr_loc_cat_elysium      || "Elysium";
      case 'domain':       return strings.chr_loc_cat_domain       || "Domain";
      case 'business':     return strings.chr_loc_cat_business     || "Business";
      case 'street':       return strings.chr_loc_cat_street       || "Street";
      case 'neighborhood': return strings.chr_loc_cat_neighborhood || "Neighborhood";
      case 'enemy_base':   return strings.chr_loc_cat_enemy_base   || "Enemy Base";
      case 'other':
      default:             return strings.chr_loc_cat_other        || "Other";
    }
  };

  const LOCATION_CATEGORIES: ChronicleLocationCategory[] = [
    'haven', 'elysium', 'domain', 'business', 'street', 'neighborhood', 'enemy_base', 'other',
  ];

  // --- Relationship handlers (scoped to `managingId`) ---
  const openCreateRelationship = () => {
    if (!managingId) return;
    setRelationshipEditor({
      id: null,
      sourceCharacterId: '',
      targetCharacterId: '',
      relationshipType: 'other',
      status: 'active',
      description: '',
    });
  };

  const openEditRelationship = (rel: ChronicleRelationship) => {
    setRelationshipEditor({
      id: rel.id,
      sourceCharacterId: rel.sourceCharacterId,
      targetCharacterId: rel.targetCharacterId,
      relationshipType: rel.relationshipType,
      status: rel.status,
      description: rel.description || '',
    });
  };

  const handleRelationshipSave = () => {
    if (!managingId || !relationshipEditor) return;
    const sourceId = relationshipEditor.sourceCharacterId.trim();
    const targetId = relationshipEditor.targetCharacterId.trim();
    if (!sourceId || !targetId) {
      toast({
        title: strings.missingData || "Missing data",
        description: strings.chr_rel_endpoints_required || "Both characters are required",
        variant: "destructive",
      });
      return;
    }
    if (sourceId === targetId) {
      toast({
        title: strings.missingData || "Missing data",
        description: strings.chr_rel_same_endpoints || "Source and target must differ",
        variant: "destructive",
      });
      return;
    }
    if (relationshipEditor.id) {
      updateChronicleRelationship(relationshipEditor.id, {
        sourceCharacterId: sourceId,
        targetCharacterId: targetId,
        relationshipType: relationshipEditor.relationshipType,
        status: relationshipEditor.status,
        description: relationshipEditor.description,
      });
      toast({ title: strings.chr_rel_updated || "Relationship updated" });
    } else {
      const draft = createEmptyChronicleRelationship(managingId);
      const saved = saveChronicleRelationship({
        ...draft,
        sourceCharacterId: sourceId,
        targetCharacterId: targetId,
        relationshipType: relationshipEditor.relationshipType,
        status: relationshipEditor.status,
        description: relationshipEditor.description || undefined,
      });
      if (!saved) {
        toast({
          title: strings.chr_rel_save_failed || "Could not save relationship",
          variant: "destructive",
        });
        return;
      }
      toast({ title: strings.chr_rel_created || "Relationship created" });
    }
    setRelationshipEditor(null);
    refreshRelationships();
  };

  const handleRelationshipDeleteConfirm = () => {
    if (!deletingRelationshipId) return;
    deleteChronicleRelationship(deletingRelationshipId);
    setDeletingRelationshipId(null);
    refreshRelationships();
    toast({ title: strings.chr_rel_deleted || "Relationship deleted" });
  };

  const relationshipTypeLabel = (t: ChronicleRelationshipType): string => {
    switch (t) {
      case 'ally':         return strings.chr_rel_type_ally         || "Ally";
      case 'enemy':        return strings.chr_rel_type_enemy        || "Enemy";
      case 'sire':         return strings.chr_rel_type_sire         || "Sire";
      case 'childe':       return strings.chr_rel_type_childe       || "Childe";
      case 'rival':        return strings.chr_rel_type_rival        || "Rival";
      case 'contact':      return strings.chr_rel_type_contact      || "Contact";
      case 'mawla':        return strings.chr_rel_type_mawla        || "Mawla";
      case 'touchstone':   return strings.chr_rel_type_touchstone   || "Touchstone";
      case 'coterie_mate': return strings.chr_rel_type_coterie_mate || "Coterie Mate";
      case 'other':
      default:             return strings.chr_rel_type_other        || "Other";
    }
  };

  const relationshipStatusLabel = (s: ChronicleRelationshipStatus): string => {
    switch (s) {
      case 'broken':  return strings.chr_rel_status_broken  || "Broken";
      case 'unknown': return strings.chr_rel_status_unknown || "Unknown";
      case 'secret':  return strings.chr_rel_status_secret  || "Secret";
      case 'active':
      default:        return strings.chr_rel_status_active  || "Active";
    }
  };

  const RELATIONSHIP_TYPES: ChronicleRelationshipType[] = [
    'ally', 'enemy', 'sire', 'childe', 'rival', 'contact', 'mawla', 'touchstone', 'coterie_mate', 'other',
  ];
  const RELATIONSHIP_STATUSES: ChronicleRelationshipStatus[] = [
    'active', 'broken', 'unknown', 'secret',
  ];

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

      {/* Hidden file input for Full App Backup import (driven by the hook). */}
      <input
        type="file"
        ref={backup.fileInputRef}
        accept=".json"
        className="hidden"
        onChange={backup.handleImportFile}
      />

      {/* Top action row */}
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <h2 className="text-xl font-serif">{strings.chronicleSection || "Chronicles"}</h2>
        <div className="flex items-center gap-2">
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
              <DropdownMenuItem onClick={backup.handleExportAll} className="gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> {strings.full_backup_export || "Export Full Backup"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={backup.handleImportClick} className="gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> {strings.full_backup_import || "Import Full Backup"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={openCreate}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> {strings.chr_new_chronicle || "New Chronicle"}
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      {chronicles.length > 0 && (
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['active', 'archived', 'all'] as StatusFilter[]).map(opt => {
            const isActive = statusFilter === opt;
            const count =
              opt === 'active'   ? chronicles.filter(c => c.status === 'active').length
              : opt === 'archived' ? chronicles.filter(c => c.status === 'archived').length
              : chronicles.length;
            const label =
              opt === 'active'   ? `${strings.chr_filter_active   || "Active"} (${count})`
              : opt === 'archived' ? `${strings.chr_filter_archived || "Archived"} (${count})`
              : `${strings.chr_filter_all || "All"} (${count})`;
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
        <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800/70 rounded-lg">
          <ScrollText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {strings.chr_no_chronicles || "No chronicles yet."}
          </p>
          <p className="text-xs text-muted-foreground/50">
            {strings.chr_create_first || "Create your first to get started."}
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800/70 rounded-lg">
          {statusFilter === 'archived'
            ? <Archive className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            : <ScrollText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />}
          <p className="text-sm text-muted-foreground mb-4">
            {statusFilter === 'active'
              ? (strings.chr_no_active || "No active chronicles.")
              : statusFilter === 'archived'
              ? (strings.chr_no_archived || "No archived chronicles.")
              : (strings.chr_no_match || "No chronicles match the filter.")}
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
            const linked = linkedByChronicle.get(chr.id);
            const pcCount = linked?.pcs.length ?? 0;
            const npcCount = linked?.npcs.length ?? 0;
            const stats = statsByChronicle.get(chr.id) ?? { sessions: 0, locations: 0, relationships: 0 };
            return (
              <Card
                key={chr.id}
                onClick={() => openManage(chr, 'overview')}
                className={`group cursor-pointer transition-all ${
                  isArchived
                    ? "bg-zinc-900/30 border-zinc-800/60 opacity-60 hover:opacity-80 hover:border-zinc-700"
                    : "bg-card border-border hover:border-primary/40 hover:bg-white/[0.02]"
                }`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <CardTitle className="font-serif text-lg leading-snug truncate flex-1 min-w-0">
                          {chr.name}
                        </CardTitle>
                        <span className={`shrink-0 mt-0.5 uppercase text-[9px] tracking-wider border px-1.5 py-0.5 rounded ${
                          isArchived
                            ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                            : "border-primary/30 bg-primary/10 text-primary"
                        }`}>
                          {isArchived
                            ? (strings.chr_status_archived || "Archived")
                            : (strings.chr_status_active || "Active")}
                        </span>
                      </div>
                      {(chr.setting || chr.edition) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {chr.setting && (
                            <span className="text-xs text-muted-foreground/80 truncate max-w-[14rem]">
                              {chr.setting}
                            </span>
                          )}
                          {chr.setting && chr.edition && (
                            <span className="text-muted-foreground/30 text-xs select-none">·</span>
                          )}
                          {chr.edition && (
                            <span className="uppercase text-[9px] tracking-wider border border-zinc-700 px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400">
                              {chr.edition}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ⋯ menu */}
                    <div onClick={e => e.stopPropagation()} className="shrink-0 -mt-1 -mr-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity"
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
                            onClick={() => openManage(chr, 'locations')}
                            className="gap-2 cursor-pointer"
                          >
                            <MapPin className="w-4 h-4" /> {strings.chr_locations || "Locations"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openManage(chr, 'relationships')}
                            className="gap-2 cursor-pointer"
                          >
                            <Heart className="w-4 h-4" /> {strings.chr_relationships || "Relationships"}
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

                <CardContent className="pt-0 pb-4 px-4">
                  {chr.description && (
                    <p className="text-xs text-foreground/65 line-clamp-2 mb-3">
                      {chr.description}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      title={strings.chr_linked_pcs || "Player Characters"}
                    >
                      <User className="w-3 h-3 text-primary/70" /> {pcCount}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      title={strings.chr_linked_npcs || "NPCs"}
                    >
                      <Users className="w-3 h-3 text-muted-foreground/60" /> {npcCount}
                    </span>
                    <span className="text-muted-foreground/25 text-xs select-none" aria-hidden>·</span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      title={strings.chr_sessions || "Sessions"}
                    >
                      <BookOpen className="w-3 h-3" /> {stats.sessions}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      title={strings.chr_locations || "Locations"}
                    >
                      <MapPin className="w-3 h-3" /> {stats.locations}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      title={strings.chr_relationships || "Relationships"}
                    >
                      <Heart className="w-3 h-3" /> {stats.relationships}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] text-muted-foreground/50">
                      {strings.chr_updated_at || "Updated"} {formatUpdatedAt(chr.updatedAt)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
                      {strings.chr_open_manage || "Open"} →
                    </span>
                  </div>
                </CardContent>
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
            const d = session.details;
            const keyEventCount = d?.keyEvents?.length ?? 0;
            const questionCount = d?.unresolvedQuestions?.length ?? 0;
            const hasRewards = !!d?.rewards;
            const hasHooks = !!d?.nextHooks;
            const hasAnyIndicator = keyEventCount > 0 || questionCount > 0 || hasRewards || hasHooks;
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    {hasAnyIndicator && (
                      /* Compact at-a-glance detail indicators. Count chips for
                         the array fields; plain icon pills for the free-text
                         fields so the row stays one line of badges. */
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {keyEventCount > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300"
                            title={strings.chr_session_key_events || "Key events"}
                          >
                            <ListChecks className="w-3 h-3 text-primary/80" aria-hidden="true" />
                            {keyEventCount}
                          </span>
                        )}
                        {questionCount > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300"
                            title={strings.chr_session_unresolved_questions || "Unresolved questions"}
                          >
                            <HelpCircle className="w-3 h-3 text-amber-400/80" aria-hidden="true" />
                            {questionCount}
                          </span>
                        )}
                        {hasRewards && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300"
                            title={strings.chr_session_rewards || "Rewards / XP"}
                          >
                            <Gift className="w-3 h-3 text-emerald-400/80" aria-hidden="true" />
                          </span>
                        )}
                        {hasHooks && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300"
                            title={strings.chr_session_next_hooks || "Next session hooks"}
                          >
                            <Sparkles className="w-3 h-3 text-purple-400/80" aria-hidden="true" />
                          </span>
                        )}
                      </div>
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
            { id: 'overview',      label: strings.chr_tab_overview      || "Overview" },
            { id: 'characters',    label: strings.chr_tab_characters    || "Characters" },
            { id: 'sessions',      label: strings.chr_tab_sessions      || "Sessions" },
            { id: 'locations',     label: strings.chr_tab_locations     || "Locations" },
            { id: 'relationships', label: strings.chr_tab_relationships || "Relationships" },
          ];

          // Endpoint pill used inside a relationship row: clickable when the
          // character resolves, italic "Unknown" otherwise. Linked chips show
          // a faint indicator when the character is NOT linked to this
          // Chronicle, so the storyteller knows the link is "external".
          const linkedToManagedIds = new Set(
            [...(linked?.pcs ?? []), ...(linked?.npcs ?? [])].map(c => c.id)
          );
          const renderRelationshipEndpoint = (charId: string) => {
            const ch = characterById.get(charId);
            const baseClass =
              "inline-flex items-center gap-1 max-w-full text-[11px] px-1.5 py-0.5 rounded border transition-colors";
            if (!ch) {
              return (
                <span
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
            const external = !linkedToManagedIds.has(ch.id);
            return (
              <button
                type="button"
                onClick={() => openCharacterSheet(charId)}
                className={`${baseClass} ${
                  external
                    ? "border-zinc-600 bg-zinc-900 text-zinc-300 hover:border-primary/40"
                    : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                }`}
                title={external
                  ? `${ch.name} · ${strings.chr_rel_external_character || "Not linked to this Chronicle"}`
                  : ch.name}
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

          const renderRelationshipRow = (rel: ChronicleRelationship) => (
            <li
              key={rel.id}
              className="rounded border border-zinc-800 bg-zinc-950/40 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-2 p-2.5">
                <button
                  type="button"
                  onClick={() => openEditRelationship(rel)}
                  className="flex-1 min-w-0 text-left"
                  title={strings.chr_rel_edit || "Edit relationship"}
                >
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {renderRelationshipEndpoint(rel.sourceCharacterId)}
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    {renderRelationshipEndpoint(rel.targetCharacterId)}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="uppercase text-[10px] tracking-wider border border-primary/30 bg-primary/10 text-primary px-1.5 rounded">
                      {relationshipTypeLabel(rel.relationshipType)}
                    </span>
                    <span
                      className={`uppercase text-[10px] tracking-wider border px-1.5 rounded ${
                        rel.status === 'active'
                          ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
                          : rel.status === 'broken'
                          ? "border-red-800 bg-red-950/40 text-red-300"
                          : rel.status === 'secret'
                          ? "border-violet-800 bg-violet-950/40 text-violet-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {relationshipStatusLabel(rel.status)}
                    </span>
                  </div>
                  {rel.description && (
                    <p className="text-xs text-foreground/70 line-clamp-2 mt-1.5">{rel.description}</p>
                  )}
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditRelationship(rel)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title={strings.chr_rel_edit || "Edit relationship"}
                    aria-label={strings.chr_rel_edit || "Edit relationship"}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingRelationshipId(rel.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-red-400"
                    title={strings.chr_rel_delete || "Delete relationship"}
                    aria-label={strings.chr_rel_delete || "Delete relationship"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          );

          const renderLocationRow = (loc: ChronicleLocation) => (
            <li
              key={loc.id}
              className="rounded border border-zinc-800 bg-zinc-950/40 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-2 p-2.5">
                <button
                  type="button"
                  onClick={() => openEditLocation(loc)}
                  className="flex-1 min-w-0 text-left"
                  title={strings.chr_location_edit || "Edit location"}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium text-sm truncate">{loc.name}</span>
                    <span className="uppercase text-[10px] tracking-wider border border-primary/30 bg-primary/10 text-primary px-1.5 rounded shrink-0">
                      {locationCategoryLabel(loc.category)}
                    </span>
                    {loc.district && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {loc.district}
                      </span>
                    )}
                  </div>
                  {loc.description && (
                    <p className="text-xs text-foreground/70 line-clamp-2 mb-1.5">{loc.description}</p>
                  )}
                  {loc.linkedCharacterIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {loc.linkedCharacterIds.map(renderTagChip)}
                    </div>
                  )}
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditLocation(loc)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    title={strings.chr_location_edit || "Edit location"}
                    aria-label={strings.chr_location_edit || "Edit location"}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingLocationId(loc.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-red-400"
                    title={strings.chr_location_delete || "Delete location"}
                    aria-label={strings.chr_location_delete || "Delete location"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          );

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
                className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-lg md:max-w-2xl lg:max-w-3xl shadow-xl max-h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-10rem)] md:max-h-[calc(100dvh-13rem)] flex flex-col overflow-hidden"
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

                {/* Tab strip: wraps onto a second row when needed instead of
                    requiring a horizontal scroll. Each tab is a generous,
                    full-width-share tap target. */}
                <div className="shrink-0 flex flex-wrap px-2 border-b border-zinc-800">
                  {tabs.map(t => {
                    const active = manageTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setManageTab(t.id)}
                        aria-pressed={active}
                        className={`flex-1 min-w-[5rem] px-2 py-2.5 text-[11px] uppercase tracking-wider font-medium text-center transition-colors border-b-2 -mb-px ${
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
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
                  {manageTab === 'overview' && (() => {
                    const latestLocation = locations.length > 0
                      ? locations.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b)
                      : null;
                    const latestRelationship = relationships.length > 0
                      ? relationships.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b)
                      : null;
                    const hasActivity = sessions.length > 0 || latestLocation !== null || latestRelationship !== null;
                    return (
                      <div className="space-y-5">
                        {/* Description */}
                        {chr.description ? (
                          <p className="text-sm text-foreground/85 whitespace-pre-wrap">{chr.description}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {strings.chr_no_description || "No description."}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-zinc-800">
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
                            <p className="text-[10px] text-muted-foreground truncate">
                              {sessions[0]?.sessionDate
                                ? formatSessionDate(sessions[0].sessionDate)
                                : sessions[0]?.title
                                ? sessions[0].title
                                : `${strings.chr_updated_at || "Updated"} ${formatUpdatedAt(chr.updatedAt)}`}
                            </p>
                          </div>
                          <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {strings.chr_overview_locations || "Locations"}
                            </p>
                            <p className="text-2xl font-serif text-foreground">{locations.length}</p>
                          </div>
                          <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {strings.chr_overview_relationships || "Relationships"}
                            </p>
                            <p className="text-2xl font-serif text-foreground">{relationships.length}</p>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="pt-3 border-t border-zinc-800">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                            {strings.chr_overview_quick_actions || "Quick actions"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => setManageTab('characters')} className="gap-1.5 h-7 text-xs">
                              <Users className="w-3.5 h-3.5" />
                              {strings.chr_overview_manage_characters || "Manage characters"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={openCreateSession} className="gap-1.5 h-7 text-xs">
                              <Plus className="w-3.5 h-3.5" />
                              {strings.chr_overview_new_session || "New session"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={openCreateLocation} className="gap-1.5 h-7 text-xs">
                              <MapPin className="w-3.5 h-3.5" />
                              {strings.chr_overview_add_location || "Add location"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={openCreateRelationship} className="gap-1.5 h-7 text-xs">
                              <Heart className="w-3.5 h-3.5" />
                              {strings.chr_overview_add_relationship || "Add relationship"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { closeManage(); openEdit(chr); }} className="gap-1.5 h-7 text-xs">
                              <Pencil className="w-3.5 h-3.5" />
                              {strings.chr_edit_basic_info || "Edit basic info"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleArchive(chr)} className="gap-1.5 h-7 text-xs">
                              {isArchived ? (
                                <><ArchiveRestore className="w-3.5 h-3.5" />{strings.chr_unarchive || "Unarchive"}</>
                              ) : (
                                <><Archive className="w-3.5 h-3.5" />{strings.chr_archive || "Archive"}</>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Recent activity */}
                        <div className="pt-3 border-t border-zinc-800">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                            {strings.chr_overview_recent_activity || "Recent activity"}
                          </p>
                          {!hasActivity ? (
                            <p className="text-xs text-muted-foreground italic">
                              {strings.chr_overview_no_activity || "No recent activity yet."}
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {sessions[0] && (
                                <button
                                  type="button"
                                  onClick={() => openEditSession(sessions[0])}
                                  className="w-full text-left rounded border border-zinc-800 bg-zinc-950/40 hover:border-primary/30 px-3 py-2 transition-colors"
                                >
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                    {strings.chr_overview_latest_session || "Latest session"}
                                  </p>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-sm font-medium truncate">{sessions[0].title}</span>
                                    {sessions[0].sessionDate && (
                                      <span className="text-[10px] text-muted-foreground shrink-0">
                                        {formatSessionDate(sessions[0].sessionDate)}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              )}
                              {latestLocation && (
                                <button
                                  type="button"
                                  onClick={() => openEditLocation(latestLocation)}
                                  className="w-full text-left rounded border border-zinc-800 bg-zinc-950/40 hover:border-primary/30 px-3 py-2 transition-colors"
                                >
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                    {strings.chr_overview_latest_location || "Latest location"}
                                  </p>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-sm font-medium truncate">{latestLocation.name}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      {locationCategoryLabel(latestLocation.category)}
                                    </span>
                                  </div>
                                </button>
                              )}
                              {latestRelationship && (
                                <button
                                  type="button"
                                  onClick={() => openEditRelationship(latestRelationship)}
                                  className="w-full text-left rounded border border-zinc-800 bg-zinc-950/40 hover:border-primary/30 px-3 py-2 transition-colors"
                                >
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                    {strings.chr_overview_latest_relationship || "Latest relationship"}
                                  </p>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Heart className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-sm font-medium truncate">
                                      {characterById.get(latestRelationship.sourceCharacterId)?.name ?? (strings.chr_session_unknown_character || "Unknown")}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="text-sm truncate">
                                      {characterById.get(latestRelationship.targetCharacterId)?.name ?? (strings.chr_session_unknown_character || "Unknown")}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      {relationshipTypeLabel(latestRelationship.relationshipType)}
                                    </span>
                                  </div>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

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

                  {manageTab === 'locations' && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {strings.chr_locations || "Locations"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={openCreateLocation}
                          className="gap-1.5 h-7 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {strings.chr_location_new || "New location"}
                        </Button>
                      </div>
                      {locations.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          {strings.chr_no_locations || "No locations yet."}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {locations.map(renderLocationRow)}
                        </ul>
                      )}
                    </div>
                  )}

                  {manageTab === 'relationships' && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-muted-foreground">
                          <Heart className="w-3.5 h-3.5" />
                          {strings.chr_relationships || "Relationships"}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={openCreateRelationship}
                          className="gap-1.5 h-7 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {strings.chr_rel_new || "New relationship"}
                        </Button>
                      </div>
                      {relationships.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          {strings.chr_no_relationships || "No relationships yet."}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {relationships.map(renderRelationshipRow)}
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
                    <label htmlFor="chr-session-date-input" className="text-sm font-medium">
                      {strings.chr_session_date || "Session date"}
                    </label>
                    {/* The native ::-webkit-calendar-picker-indicator is made
                        visible on dark background via index.css (color-scheme:
                        dark + filter on the indicator). We also surface an
                        explicit calendar button as a discoverability
                        belt-and-suspenders for browsers (e.g. some Safari
                        builds) that render no indicator at all. The button
                        calls input.showPicker() — supported in modern
                        Chromium / Firefox / Edge — and falls back to
                        focusing the input so keyboard date entry still
                        works everywhere. */}
                    <div className="flex items-center gap-2">
                      <Input
                        id="chr-session-date-input"
                        ref={sessionDateInputRef}
                        type="date"
                        value={sessionEditor.sessionDate}
                        onChange={e =>
                          setSessionEditor(prev => prev ? { ...prev, sessionDate: e.target.value } : prev)
                        }
                        className="bg-background border-border flex-1 min-w-0"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={openSessionDatePicker}
                        aria-label={strings.chr_session_date_open_picker || strings.chr_session_date || "Open date picker"}
                        title={strings.chr_session_date_open_picker || strings.chr_session_date || "Open date picker"}
                        className="h-9 w-9 shrink-0 bg-background border-border hover:bg-primary/10 hover:border-primary/40"
                      >
                        <CalendarDays className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
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

                  {/* Collapsible "Advanced" group — keeps the editor compact
                      for simple sessions; all four detail fields are optional
                      and each rolls up to omitted-from-storage when blank. */}
                  <div className="pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setSessionAdvancedOpen(o => !o)}
                      aria-expanded={sessionAdvancedOpen}
                      aria-controls="session-editor-advanced"
                      className="w-full flex items-center justify-between gap-2 py-1 text-xs font-sans uppercase tracking-widest text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                    >
                      <span>{strings.chr_session_advanced || "Advanced details"}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${sessionAdvancedOpen ? '' : '-rotate-90'}`}
                        aria-hidden="true"
                      />
                    </button>
                    {sessionAdvancedOpen && (
                      <div id="session-editor-advanced" className="mt-3 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium inline-flex items-center gap-1.5">
                            <ListChecks className="w-3.5 h-3.5 text-primary/80" aria-hidden="true" />
                            {strings.chr_session_key_events || "Key events"}
                          </label>
                          <Textarea
                            value={sessionEditor.keyEventsText}
                            onChange={e =>
                              setSessionEditor(prev => prev ? { ...prev, keyEventsText: e.target.value } : prev)
                            }
                            placeholder={strings.chr_session_key_events_placeholder || "One per line"}
                            className="bg-background border-border min-h-[72px] text-sm leading-snug"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium inline-flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400/80" aria-hidden="true" />
                            {strings.chr_session_unresolved_questions || "Unresolved questions"}
                          </label>
                          <Textarea
                            value={sessionEditor.unresolvedQuestionsText}
                            onChange={e =>
                              setSessionEditor(prev => prev ? { ...prev, unresolvedQuestionsText: e.target.value } : prev)
                            }
                            placeholder={strings.chr_session_unresolved_questions_placeholder || "One per line"}
                            className="bg-background border-border min-h-[60px] text-sm leading-snug"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium inline-flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-emerald-400/80" aria-hidden="true" />
                            {strings.chr_session_rewards || "Rewards / XP"}
                          </label>
                          <Textarea
                            value={sessionEditor.rewards}
                            onChange={e =>
                              setSessionEditor(prev => prev ? { ...prev, rewards: e.target.value } : prev)
                            }
                            placeholder={strings.chr_session_rewards_placeholder || "XP, boons, loot…"}
                            className="bg-background border-border min-h-[60px] text-sm leading-snug"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium inline-flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400/80" aria-hidden="true" />
                            {strings.chr_session_next_hooks || "Next session hooks"}
                          </label>
                          <Textarea
                            value={sessionEditor.nextHooks}
                            onChange={e =>
                              setSessionEditor(prev => prev ? { ...prev, nextHooks: e.target.value } : prev)
                            }
                            placeholder={strings.chr_session_next_hooks_placeholder || "Where the story goes next…"}
                            className="bg-background border-border min-h-[60px] text-sm leading-snug"
                          />
                        </div>
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

      {/* Location editor (create + edit). Linked characters of the current
          Chronicle appear first as default link candidates; others fall under
          "Other characters". Click chips to toggle. */}
      <AnimatePresence>
        {locationEditor && managingId && (() => {
          const linked = linkedByChronicle.get(managingId);
          const linkedAll = [...(linked?.pcs ?? []), ...(linked?.npcs ?? [])];
          const linkedIds = new Set(linkedAll.map(c => c.id));
          const others = characters
            .filter(c => !linkedIds.has(c.id))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', activeLanguage));
          const isEditing = locationEditor.id !== null;

          const renderEditChip = (ch: Character) => {
            const selected = locationEditor.linkedCharacterIds.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggleLocationLink(ch.id)}
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
              key="location-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pt-20 pb-28"
              onClick={() => setLocationEditor(null)}
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
                      ? (strings.chr_location_edit || "Edit location")
                      : (strings.chr_location_new || "New location")}
                  </h3>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {strings.chr_location_name || "Name"}
                    </label>
                    <Input
                      value={locationEditor.name}
                      onChange={e =>
                        setLocationEditor(prev => prev ? { ...prev, name: e.target.value } : prev)
                      }
                      className="bg-background border-border"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {strings.chr_location_category || "Category"}
                      </label>
                      <select
                        value={locationEditor.category}
                        onChange={e =>
                          setLocationEditor(prev => prev ? {
                            ...prev,
                            category: e.target.value as ChronicleLocationCategory,
                          } : prev)
                        }
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                      >
                        {LOCATION_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{locationCategoryLabel(cat)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {strings.chr_location_district || "District / Area"}
                      </label>
                      <Input
                        value={locationEditor.district}
                        onChange={e =>
                          setLocationEditor(prev => prev ? { ...prev, district: e.target.value } : prev)
                        }
                        className="bg-background border-border"
                        placeholder={strings.chr_location_district_placeholder || "Downtown, etc."}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {strings.chr_location_description || "Description"}
                    </label>
                    <Textarea
                      value={locationEditor.description}
                      onChange={e =>
                        setLocationEditor(prev => prev ? { ...prev, description: e.target.value } : prev)
                      }
                      className="bg-background border-border min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {strings.chr_location_notes || "Notes"}
                    </label>
                    <Textarea
                      value={locationEditor.notes}
                      onChange={e =>
                        setLocationEditor(prev => prev ? { ...prev, notes: e.target.value } : prev)
                      }
                      className="bg-background border-border min-h-[60px]"
                      placeholder={strings.chr_location_notes_placeholder || "Secrets, rules, hooks..."}
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                    <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
                      {strings.chr_location_link_characters || "Linked characters"}
                    </p>

                    {linkedAll.length === 0 && others.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        {strings.chr_location_no_characters || "No characters available."}
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
                    onClick={() => setLocationEditor(null)}
                    className="text-muted-foreground"
                  >
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLocationSave}
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

      {/* Location delete confirm */}
      <AnimatePresence>
        {deletingLocationId && (() => {
          const target = locations.find(l => l.id === deletingLocationId);
          return (
            <motion.div
              key="delete-location"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setDeletingLocationId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-serif text-foreground mb-2">
                  {strings.chr_location_confirm_delete || "Delete location?"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {strings.chr_location_confirm_delete_desc || "This action cannot be undone."}{' '}
                  {target?.name && (
                    <span className="text-foreground font-medium">{target.name}</span>
                  )}
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingLocationId(null)}
                    className="text-muted-foreground"
                  >
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLocationDeleteConfirm}
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

      {/* Relationship editor. Source/Target are full character selects.
          Characters linked to the current Chronicle appear first as the
          natural choice; others fall under an "Other characters" group so
          users can still wire NPCs or unlinked PCs into a story arc. */}
      <AnimatePresence>
        {relationshipEditor && managingId && (() => {
          const linked = linkedByChronicle.get(managingId);
          const linkedAll = [...(linked?.pcs ?? []), ...(linked?.npcs ?? [])];
          const linkedIds = new Set(linkedAll.map(c => c.id));
          const others = characters
            .filter(c => !linkedIds.has(c.id))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', activeLanguage));
          const isEditing = relationshipEditor.id !== null;

          // Build a <select> with two optgroups; show "[External]" suffix on
          // others so the storyteller spots non-linked characters at a glance.
          const renderCharacterSelect = (
            value: string,
            onChange: (id: string) => void,
            id: string,
          ) => (
            <select
              id={id}
              value={value}
              onChange={e => onChange(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">
                {strings.chr_rel_select_character || "Select character..."}
              </option>
              {linkedAll.length > 0 && (
                <optgroup label={strings.chr_session_tag_linked || "Linked to this Chronicle"}>
                  {linkedAll.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.characterType === 'npc' ? ` · ${strings.char_type_short_npc || "NPC"}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {others.length > 0 && (
                <optgroup label={strings.chr_session_tag_other || "Other characters"}>
                  {others.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.characterType === 'npc' ? ` · ${strings.char_type_short_npc || "NPC"}` : ''}
                      {` · ${strings.chr_rel_external_character || "Not linked"}`}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          );

          return (
            <motion.div
              key="relationship-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pt-20 pb-28"
              onClick={() => setRelationshipEditor(null)}
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
                      ? (strings.chr_rel_edit || "Edit relationship")
                      : (strings.chr_rel_new || "New relationship")}
                  </h3>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="rel-source">
                      {strings.chr_rel_source || "Source character"}
                    </label>
                    {renderCharacterSelect(
                      relationshipEditor.sourceCharacterId,
                      id => setRelationshipEditor(prev => prev ? { ...prev, sourceCharacterId: id } : prev),
                      'rel-source',
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="rel-target">
                      {strings.chr_rel_target || "Target character"}
                    </label>
                    {renderCharacterSelect(
                      relationshipEditor.targetCharacterId,
                      id => setRelationshipEditor(prev => prev ? { ...prev, targetCharacterId: id } : prev),
                      'rel-target',
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {strings.chr_rel_direction_hint || "Source → Target"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {strings.chr_rel_type || "Type"}
                      </label>
                      <select
                        value={relationshipEditor.relationshipType}
                        onChange={e =>
                          setRelationshipEditor(prev => prev ? {
                            ...prev,
                            relationshipType: e.target.value as ChronicleRelationshipType,
                          } : prev)
                        }
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                      >
                        {RELATIONSHIP_TYPES.map(t => (
                          <option key={t} value={t}>{relationshipTypeLabel(t)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {strings.chr_rel_status || "Status"}
                      </label>
                      <select
                        value={relationshipEditor.status}
                        onChange={e =>
                          setRelationshipEditor(prev => prev ? {
                            ...prev,
                            status: e.target.value as ChronicleRelationshipStatus,
                          } : prev)
                        }
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                      >
                        {RELATIONSHIP_STATUSES.map(s => (
                          <option key={s} value={s}>{relationshipStatusLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      {strings.chr_rel_description || "Notes / description"}
                    </label>
                    <Textarea
                      value={relationshipEditor.description}
                      onChange={e =>
                        setRelationshipEditor(prev => prev ? { ...prev, description: e.target.value } : prev)
                      }
                      className="bg-background border-border min-h-[100px]"
                      placeholder={strings.chr_rel_description_placeholder || "How and why this matters..."}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex gap-3 justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-900 rounded-b-lg">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRelationshipEditor(null)}
                    className="text-muted-foreground"
                  >
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRelationshipSave}
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

      {/* Relationship delete confirm */}
      <AnimatePresence>
        {deletingRelationshipId && (() => {
          const target = relationships.find(r => r.id === deletingRelationshipId);
          const srcName = target ? (characterById.get(target.sourceCharacterId)?.name
            || (strings.chr_session_unknown_character || "Unknown character")) : '';
          const tgtName = target ? (characterById.get(target.targetCharacterId)?.name
            || (strings.chr_session_unknown_character || "Unknown character")) : '';
          return (
            <motion.div
              key="delete-relationship"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setDeletingRelationshipId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-serif text-foreground mb-2">
                  {strings.chr_rel_confirm_delete || "Delete relationship?"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {strings.chr_rel_confirm_delete_desc || "This action cannot be undone."}{' '}
                  {target && (
                    <span className="text-foreground font-medium">
                      {srcName} → {tgtName}
                    </span>
                  )}
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingRelationshipId(null)}
                    className="text-muted-foreground"
                  >
                    {strings.cancel || "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleRelationshipDeleteConfirm}
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
