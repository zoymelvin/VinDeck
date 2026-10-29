export interface NoteRevision {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  revisions: NoteRevision[];
}

const NOTES_STORAGE_KEY = "vindeck_notes_v2";
const QUICK_NOTES_KEY = "vindeck_quick_notes";
const MAX_REVISIONS = 20;

export function getNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      // Migrate old quick note if present
      const oldQuickNote = localStorage.getItem(QUICK_NOTES_KEY);
      if (oldQuickNote && oldQuickNote.trim().length > 0) {
        const importedNote: Note = {
          id: "imported-quick-note",
          title: "Quick note (imported)",
          content: oldQuickNote,
          isPinned: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          revisions: [],
        };
        saveNotes([importedNote]);
        return [importedNote];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "QuotaExceededError") {
      return false;
    }
    return false;
  }
}

export function createNote(title?: string, content: string = ""): Note {
  const now = Date.now();
  const extractedTitle = title || extractTitle(content) || "Untitled Note";
  const newNote: Note = {
    id: `note-${now}-${Math.random().toString(36).substring(2, 7)}`,
    title: extractedTitle,
    content,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    revisions: [],
  };
  const notes = getNotes();
  saveNotes([newNote, ...notes]);
  return newNote;
}

export function updateNote(
  id: string,
  content: string,
  title?: string,
  createSnapshot = false
): Note | null {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;

  const existing = notes[index];
  const now = Date.now();
  const newTitle = title || extractTitle(content) || "Untitled Note";

  let updatedRevisions = [...existing.revisions];

  // Add revision snapshot if requested and enough time passed (30s) or blur
  if (createSnapshot && content.trim() !== "") {
    const lastRev = updatedRevisions[0];
    if (!lastRev || now - lastRev.timestamp > 30000 || lastRev.content !== content) {
      const snapshot: NoteRevision = {
        id: `rev-${now}`,
        title: existing.title,
        content: existing.content,
        timestamp: now,
      };
      updatedRevisions = [snapshot, ...updatedRevisions].slice(0, MAX_REVISIONS);
    }
  }

  const updatedNote: Note = {
    ...existing,
    title: newTitle,
    content,
    updatedAt: now,
    revisions: updatedRevisions,
  };

  notes[index] = updatedNote;
  saveNotes(notes);
  return updatedNote;
}

export function deleteNote(id: string): boolean {
  const notes = getNotes();
  const filtered = notes.filter((n) => n.id !== id);
  return saveNotes(filtered);
}

export function togglePinNote(id: string): Note | null {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;

  notes[index].isPinned = !notes[index].isPinned;
  notes[index].updatedAt = Date.now();
  saveNotes(notes);
  return notes[index];
}

export function restoreRevision(noteId: string, revisionId: string): Note | null {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === noteId);
  if (index === -1) return null;

  const note = notes[index];
  const rev = note.revisions.find((r) => r.id === revisionId);
  if (!rev) return null;

  // Save current version as snapshot first
  const now = Date.now();
  const currentSnapshot: NoteRevision = {
    id: `rev-${now}`,
    title: note.title,
    content: note.content,
    timestamp: now,
  };

  const updatedRevisions = [currentSnapshot, ...note.revisions.filter((r) => r.id !== revisionId)].slice(0, MAX_REVISIONS);

  const restoredNote: Note = {
    ...note,
    title: rev.title || extractTitle(rev.content) || "Restored Note",
    content: rev.content,
    updatedAt: now,
    revisions: updatedRevisions,
  };

  notes[index] = restoredNote;
  saveNotes(notes);
  return restoredNote;
}

export function extractTitle(content: string): string {
  if (!content) return "";
  const lines = content.trim().split("\n");
  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, "").replace(/^[-*+]\s*/, "").trim();
    if (clean.length > 0) {
      return clean.slice(0, 60);
    }
  }
  return "";
}