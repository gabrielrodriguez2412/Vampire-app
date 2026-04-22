import { useState } from "react";
import { motion } from "framer-motion";
import { useNotes } from "@/hooks/useNotes";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Save } from "lucide-react";
import { format } from "date-fns";

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsCreating(false);
      return;
    }
    addNote({ title: newTitle || "Sin título", content: newContent });
    setNewTitle("");
    setNewContent("");
    setIsCreating(false);
  };

  const startEdit = (note: any) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSave = () => {
    if (editingId) {
      updateNote(editingId, { title: editTitle, content: editContent });
      setEditingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-cinzel font-bold text-primary mb-2">Notas del Jugador</h1>
          <p className="text-muted-foreground">Apuntes privados guardados en tu dispositivo.</p>
        </div>
        {!isCreating && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" /> Nueva Nota
          </Button>
        )}
      </div>

      {isCreating && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card className="bg-card border-primary/30 shadow-lg shadow-primary/5">
            <CardContent className="pt-6 space-y-4">
              <Input
                placeholder="Título de la nota..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="font-cinzel text-lg bg-background border-border"
                autoFocus
              />
              <Textarea
                placeholder="Escribe tus notas aquí..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="min-h-[150px] bg-background border-border resize-y"
              />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
              <Button onClick={handleCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Save className="w-4 h-4 mr-2" /> Guardar
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.map(note => (
          <motion.div key={note.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-card border-border h-full flex flex-col group">
              {editingId === note.id ? (
                <>
                  <CardContent className="pt-6 space-y-4 flex-1">
                    <Input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="font-cinzel bg-background border-border"
                    />
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="min-h-[150px] bg-background border-border"
                    />
                  </CardContent>
                  <CardFooter className="justify-end gap-2 border-t border-border pt-4">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancelar</Button>
                    <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Guardar</Button>
                  </CardFooter>
                </>
              ) : (
                <>
                  <CardHeader className="pb-2 cursor-pointer" onClick={() => startEdit(note)}>
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="font-cinzel text-xl text-foreground">{note.title}</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="flex-1 cursor-pointer" 
                    onClick={() => startEdit(note)}
                  >
                    <p className="text-foreground/80 whitespace-pre-wrap text-sm line-clamp-6">
                      {note.content || <span className="text-muted-foreground italic">Sin contenido</span>}
                    </p>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground pt-0 pb-4">
                    Actualizado: {format(note.updatedAt, "dd/MM/yyyy HH:mm")}
                  </CardFooter>
                </>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {!isCreating && notes.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No tienes notas guardadas.
        </div>
      )}
    </div>
  );
}