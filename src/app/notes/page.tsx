"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Save,
  Clock,
  ArrowLeft,
  Edit,
  Eye,
  RotateCcw,
  Check,
  FileText,
} from "@/components/icons";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Note,
  NoteRevision,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
  restoreRevision,
} from "@/lib/notes";
import { formatRelativeTime } from "@/lib/greeting";
import { strings } from "@/lib/strings";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const loadedNotes = getNotes();
    if (loadedNotes.length > 0) return loadedNotes;
    const initial = createNote("My First Note", "# Welcome to VinDeck Notes\n\nStart typing here...");
    return [initial];
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    return notes.length > 0 ? notes[0].id : null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"edit" | "preview" | "split">("edit");
  const [showHistory, setShowHistory] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [deletedNote, setDeletedNote] = useState<Note | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Editor states
  const [title, setTitle] = useState(() => (notes.length > 0 ? notes[0].title : ""));
  const [content, setContent] = useState(() => (notes.length > 0 ? notes[0].content : ""));

  // Mobile navigation
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSaveStatus("saved");
    setMobileView("editor");
  };

  // Debounced Autosave
  useEffect(() => {
    if (!selectedNoteId || !selectedNote) return;
    if (content === selectedNote.content && title === selectedNote.title) return;

    const timer = setTimeout(() => {
      setSaveStatus("saving");
      const updated = updateNote(selectedNoteId, content, title, false);
      if (updated) {
        setNotes(getNotes());
        setSaveStatus("saved");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [content, title, selectedNoteId, selectedNote]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (selectedNoteId) {
          setSaveStatus("saving");
          const updated = updateNote(selectedNoteId, content, title, true);
          if (updated) {
            setNotes(getNotes());
            setSaveStatus("saved");
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNoteId, content, title]);

  const handleCreateNote = () => {
    const newNote = createNote("Untitled Note", "");
    const updatedNotes = getNotes();
    setNotes(updatedNotes);
    setSelectedNoteId(newNote.id);
    setTitle(newNote.title);
    setContent(newNote.content);
    setMobileView("editor");
  };

  const handleDeleteNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    if (confirm(`Delete "${target.title}"?`)) {
      setDeletedNote(target);
      deleteNote(id);
      const remaining = getNotes();
      setNotes(remaining);

      if (remaining.length > 0) {
        setSelectedNoteId(remaining[0].id);
      } else {
        setSelectedNoteId(null);
        setTitle("");
        setContent("");
      }

      setShowUndoToast(true);
      setTimeout(() => setShowUndoToast(false), 5000);
    }
  };

  const handleUndoDelete = () => {
    if (deletedNote) {
      const restored = createNote(deletedNote.title, deletedNote.content);
      const updated = getNotes();
      setNotes(updated);
      setSelectedNoteId(restored.id);
      setShowUndoToast(false);
      setDeletedNote(null);
    }
  };

  const handleToggleTask = (lineIndex: number) => {
    const lines = content.split("\n");
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    const taskMatch = line.match(/^(\s*[-*+]\s+\[)([ xX])(\]\s+.*)$/);
    if (taskMatch) {
      const currentStatus = taskMatch[2].toLowerCase();
      const newStatus = currentStatus === "x" ? " " : "x";
      lines[lineIndex] = `${taskMatch[1]}${newStatus}${taskMatch[3]}`;
      const newContent = lines.join("\n");
      setContent(newContent);
    }
  };

  const handleRestoreRevision = (revId: string) => {
    if (!selectedNoteId) return;
    const restored = restoreRevision(selectedNoteId, revId);
    if (restored) {
      setNotes(getNotes());
      setTitle(restored.title);
      setContent(restored.content);
      setShowHistory(false);
      setSaveStatus("saved");
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const otherNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold tracking-tight">Notes</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNote}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {/* Main Two-Panel Layout */}
      <div className="flex-1 flex overflow-hidden max-w-[1760px] w-full mx-auto p-2 sm:p-4 gap-4">
        {/* Left Panel: Note List */}
        <div
          className={`w-full sm:w-80 md:w-96 flex-shrink-0 flex flex-col bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-3 overflow-hidden ${
            mobileView === "editor" ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No notes found</div>
            ) : (
              <>
                {pinnedNotes.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      Pinned
                    </div>
                    {pinnedNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        type="button"
                        className={`w-full p-3 rounded-2xl text-left transition-all mb-1 ${
                          selectedNoteId === note.id
                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                            : "bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800/50 border border-transparent text-slate-900 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{note.title || "Untitled"}</span>
                          <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {note.content || "Empty note"}
                        </p>
                        <div className="text-[10px] text-slate-500 mt-2">
                          {formatRelativeTime(new Date(note.updatedAt))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {otherNotes.length > 0 && (
                  <div>
                    {pinnedNotes.length > 0 && (
                      <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase mt-3">
                        All Notes
                      </div>
                    )}
                    {otherNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        type="button"
                        className={`w-full p-3 rounded-2xl text-left transition-all mb-1 ${
                          selectedNoteId === note.id
                            ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                            : "bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800/50 border border-transparent text-slate-900 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">{note.title || "Untitled"}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {note.content || "Empty note"}
                        </p>
                        <div className="text-[10px] text-slate-500 mt-2">
                          {formatRelativeTime(new Date(note.updatedAt))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Editor & Preview */}
        <div
          className={`flex-1 flex flex-col bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-4 overflow-hidden ${
            mobileView === "list" ? "hidden sm:flex" : "flex"
          }`}
        >
          {selectedNote ? (
            <>
              {/* Editor Action Bar */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileView("list")}
                    type="button"
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-100 sm:hidden"
                    aria-label="Back to notes list"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Mode Selector */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setMode("edit")}
                      type="button"
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        mode === "edit" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setMode("preview")}
                      type="button"
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        mode === "preview" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setMode("split")}
                      type="button"
                      className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        mode === "split" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>Split</span>
                    </button>
                  </div>

                  {/* Save Indicator */}
                  <span className="text-xs text-slate-500 font-mono">
                    {saveStatus === "saving" && "Saving…"}
                    {saveStatus === "unsaved" && "Unsaved"}
                    {saveStatus === "saved" && "Saved"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => togglePinNote(selectedNote.id) && setNotes(getNotes())}
                    type="button"
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    aria-label="Pin note"
                  >
                    {selectedNote.isPinned ? <PinOff className="w-4 h-4 text-amber-400" /> : <Pin className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    type="button"
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    aria-label="History"
                  >
                    <Clock className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    type="button"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className="w-full text-xl font-bold bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-500 mb-3"
              />

              {/* Main Content Area */}
              <div className="flex-1 flex gap-4 overflow-hidden relative">
                {/* Editor textarea */}
                {(mode === "edit" || mode === "split") && (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing markdown..."
                    className={`flex-1 w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono leading-relaxed ${
                      mode === "split" ? "w-1/2" : "w-full"
                    }`}
                  />
                )}

                {/* Preview Panel */}
                {(mode === "preview" || mode === "split") && (
                  <div
                    className={`flex-1 bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 overflow-y-auto ${
                      mode === "split" ? "w-1/2" : "w-full"
                    }`}
                  >
                    <MarkdownRenderer content={content} onToggleTask={handleToggleTask} />
                  </div>
                )}

                {/* History Drawer Overlay */}
                {showHistory && (
                  <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-4 flex flex-col z-20 animate-in slide-in-from-right duration-200">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <h3 className="font-semibold text-sm">Revision History</h3>
                      <button onClick={() => setShowHistory(false)} type="button" className="text-slate-400 hover:text-slate-200">
                        ✕
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                      {selectedNote.revisions.length === 0 ? (
                        <div className="text-xs text-slate-500 italic p-4 text-center">No history yet</div>
                      ) : (
                        selectedNote.revisions.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-slate-400">
                              <span>{formatRelativeTime(new Date(rev.timestamp))}</span>
                              <button
                                onClick={() => handleRestoreRevision(rev.id)}
                                type="button"
                                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 line-clamp-2 font-mono text-[11px]">{rev.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
              <FileText className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm">Select or create a note to start editing</p>
            </div>
          )}
        </div>
      </div>

      {/* Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <span className="text-sm font-medium">Note deleted</span>
          <button
            onClick={handleUndoDelete}
            type="button"
            className="px-3 py-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}