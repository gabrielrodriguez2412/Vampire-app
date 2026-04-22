import { useState, useEffect } from 'react';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const item = window.localStorage.getItem('vtm-notes');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.warn("Error reading localStorage for notes", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('vtm-notes', JSON.stringify(notes));
    } catch (error) {
      console.warn("Error setting localStorage for notes", error);
    }
  }, [notes]);

  const addNote = (note: Omit<Note, 'id' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, 'id' | 'updatedAt'>>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: Date.now() }
        : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return { notes, addNote, updateNote, deleteNote };
}