import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollText, Trash2, Plus, Users, MapPin, Calendar, Save } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { UI_STRINGS } from "@/i18n/ui";

interface Session { id: string; title: string; date: string; summary: string; }
interface NPC { id: string; name: string; description: string; }
interface Location { id: string; name: string; description: string; }

export default function ChroniclePage() {
  const { activeLanguage } = useAppContext();
  const strings = UI_STRINGS[activeLanguage] || UI_STRINGS['en'];

  const [activeTab, setActiveTab] = useState("sessions");

  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Forms
  const [sessionForm, setSessionForm] = useState<Partial<Session>>({});
  const [npcForm, setNpcForm] = useState<Partial<NPC>>({});
  const [locForm, setLocForm] = useState<Partial<Location>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('vtm-sessions');
      const n = localStorage.getItem('vtm-npcs');
      const l = localStorage.getItem('vtm-locations');
      if (s) setSessions(JSON.parse(s));
      if (n) setNpcs(JSON.parse(n));
      if (l) setLocations(JSON.parse(l));
    } catch(e) {}
  }, []);

  const saveToLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

  // --- Sessions ---
  const saveSession = () => {
    if (!sessionForm.title) return;
    let newSessions;
    if (editingId) {
      newSessions = sessions.map(x => x.id === editingId ? { ...x, ...sessionForm } as Session : x);
    } else {
      newSessions = [...sessions, { id: crypto.randomUUID(), ...sessionForm, date: sessionForm.date || new Date().toISOString().split('T')[0] } as Session];
    }
    setSessions(newSessions);
    saveToLocal('vtm-sessions', newSessions);
    setSessionForm({});
    setEditingId(null);
  };

  const deleteSession = (id: string) => {
    const newSessions = sessions.filter(x => x.id !== id);
    setSessions(newSessions);
    saveToLocal('vtm-sessions', newSessions);
  };

  // --- NPCs ---
  const saveNpc = () => {
    if (!npcForm.name) return;
    let newNpcs;
    if (editingId) {
      newNpcs = npcs.map(x => x.id === editingId ? { ...x, ...npcForm } as NPC : x);
    } else {
      newNpcs = [...npcs, { id: crypto.randomUUID(), ...npcForm } as NPC];
    }
    setNpcs(newNpcs);
    saveToLocal('vtm-npcs', newNpcs);
    setNpcForm({});
    setEditingId(null);
  };

  const deleteNpc = (id: string) => {
    const newNpcs = npcs.filter(x => x.id !== id);
    setNpcs(newNpcs);
    saveToLocal('vtm-npcs', newNpcs);
  };

  // --- Locations ---
  const saveLoc = () => {
    if (!locForm.name) return;
    let newLocs;
    if (editingId) {
      newLocs = locations.map(x => x.id === editingId ? { ...x, ...locForm } as Location : x);
    } else {
      newLocs = [...locations, { id: crypto.randomUUID(), ...locForm } as Location];
    }
    setLocations(newLocs);
    saveToLocal('vtm-locations', newLocs);
    setLocForm({});
    setEditingId(null);
  };

  const deleteLoc = (id: string) => {
    const newLocs = locations.filter(x => x.id !== id);
    setLocations(newLocs);
    saveToLocal('vtm-locations', newLocs);
  };

  const cancelEdit = () => {
    setSessionForm({}); setNpcForm({}); setLocForm({}); setEditingId(null);
  };

  const sortedSessions = [...sessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-3">
        <ScrollText className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-foreground">{strings.chronicleTitle}</h1>
          <p className="text-muted-foreground">{strings.chronicleSubtitle}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border mb-6 flex flex-wrap h-auto">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-primary/20"><Calendar className="w-4 h-4 mr-2"/> {strings.sessionNotes}</TabsTrigger>
          <TabsTrigger value="npcs" className="data-[state=active]:bg-primary/20"><Users className="w-4 h-4 mr-2"/> {strings.npcs}</TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-primary/20"><MapPin className="w-4 h-4 mr-2"/> {strings.locations}</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-primary/20"><ScrollText className="w-4 h-4 mr-2"/> {strings.timeline}</TabsTrigger>
        </TabsList>

        {/* SESSIONS */}
        <TabsContent value="sessions" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-cinzel text-lg">{editingId ? strings.edit : strings.addSession}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs mb-1 block">{strings.sessionTitle}</label>
                  <Input value={sessionForm.title || ''} onChange={e=>setSessionForm({...sessionForm, title: e.target.value})} className="bg-background"/>
                </div>
                <div>
                  <label className="text-xs mb-1 block">{strings.sessionDate}</label>
                  <Input type="date" value={sessionForm.date || ''} onChange={e=>setSessionForm({...sessionForm, date: e.target.value})} className="bg-background"/>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block">{strings.sessionSummary}</label>
                <Textarea value={sessionForm.summary || ''} onChange={e=>setSessionForm({...sessionForm, summary: e.target.value})} className="bg-background min-h-[100px]"/>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {editingId && <Button variant="ghost" onClick={cancelEdit}>{strings.cancel}</Button>}
              <Button onClick={saveSession} className="bg-primary hover:bg-primary/90 text-white">{strings.save}</Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4">
            {sessions.length === 0 ? <p className="text-center text-muted-foreground py-8">{strings.noSessions}</p> : 
              sessions.map(s => (
                <Card key={s.id} className="bg-card border-border">
                  <CardHeader className="pb-2 flex flex-row justify-between">
                    <div>
                      <CardTitle className="font-cinzel text-xl">{s.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">{s.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSessionForm(s); setEditingId(s.id); }}>{strings.edit}</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={()=>deleteSession(s.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </CardHeader>
                  <CardContent><p className="whitespace-pre-wrap text-sm text-foreground/80">{s.summary}</p></CardContent>
                </Card>
              ))
            }
          </div>
        </TabsContent>

        {/* NPCs */}
        <TabsContent value="npcs" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-cinzel text-lg">{editingId ? strings.edit : strings.addNPC}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs mb-1 block">{strings.npcName}</label>
                <Input value={npcForm.name || ''} onChange={e=>setNpcForm({...npcForm, name: e.target.value})} className="bg-background"/>
              </div>
              <div>
                <label className="text-xs mb-1 block">{strings.npcDescription}</label>
                <Textarea value={npcForm.description || ''} onChange={e=>setNpcForm({...npcForm, description: e.target.value})} className="bg-background min-h-[80px]"/>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {editingId && <Button variant="ghost" onClick={cancelEdit}>{strings.cancel}</Button>}
              <Button onClick={saveNpc} className="bg-primary hover:bg-primary/90 text-white">{strings.save}</Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {npcs.length === 0 ? <p className="text-center text-muted-foreground py-8 col-span-full">{strings.noNPCs}</p> : 
              npcs.map(n => (
                <Card key={n.id} className="bg-card border-border">
                  <CardHeader className="pb-2 flex flex-row justify-between">
                    <CardTitle className="font-cinzel text-lg">{n.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setNpcForm(n); setEditingId(n.id); }}>{strings.edit}</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={()=>deleteNpc(n.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </CardHeader>
                  <CardContent><p className="whitespace-pre-wrap text-sm text-foreground/80">{n.description}</p></CardContent>
                </Card>
              ))
            }
          </div>
        </TabsContent>

        {/* Locations */}
        <TabsContent value="locations" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-cinzel text-lg">{editingId ? strings.edit : strings.addLocation}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs mb-1 block">{strings.locationName}</label>
                <Input value={locForm.name || ''} onChange={e=>setLocForm({...locForm, name: e.target.value})} className="bg-background"/>
              </div>
              <div>
                <label className="text-xs mb-1 block">{strings.locationDescription}</label>
                <Textarea value={locForm.description || ''} onChange={e=>setLocForm({...locForm, description: e.target.value})} className="bg-background min-h-[80px]"/>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {editingId && <Button variant="ghost" onClick={cancelEdit}>{strings.cancel}</Button>}
              <Button onClick={saveLoc} className="bg-primary hover:bg-primary/90 text-white">{strings.save}</Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.length === 0 ? <p className="text-center text-muted-foreground py-8 col-span-full">{strings.noLocations}</p> : 
              locations.map(l => (
                <Card key={l.id} className="bg-card border-border">
                  <CardHeader className="pb-2 flex flex-row justify-between">
                    <CardTitle className="font-cinzel text-lg">{l.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setLocForm(l); setEditingId(l.id); }}>{strings.edit}</Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={()=>deleteLoc(l.id)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </CardHeader>
                  <CardContent><p className="whitespace-pre-wrap text-sm text-foreground/80">{l.description}</p></CardContent>
                </Card>
              ))
            }
          </div>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <div className="space-y-8 py-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {sortedSessions.length === 0 ? <p className="text-center text-muted-foreground py-8">{strings.noSessions}</p> : 
              sortedSessions.map((s, i) => (
                <div key={s.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                    <div className="w-3 h-3 bg-primary rounded-full" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card/50 shadow">
                    <div className="flex flex-col gap-1 mb-2">
                      <span className="font-cinzel text-lg font-bold text-foreground">{s.title}</span>
                      <span className="text-xs text-primary">{s.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{s.summary}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
