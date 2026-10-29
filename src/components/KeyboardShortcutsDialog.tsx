"use client";

import React from "react";
import { X, Keyboard } from "@/components/icons";

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "/", description: "Focus search" },
    { key: "Ctrl / ⌘ K", description: "Open command palette" },
    { key: "?", description: "Open keyboard shortcuts" },
    { key: "Esc", description: "Close dialog or popover" },
    { key: "Ctrl / ⌘ S", description: "Save note (in Notes)" },
    { key: "Enter / Space", description: "Open selected app card" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="relative w-full max-w-md rounded-3xl bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/95 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl backdrop-blur-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h2 id="shortcuts-title" className="text-lg font-bold text-slate-100 light:text-slate-900">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-slate-400">Quick keys to navigate VinDeck</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 light:bg-slate-100 border border-slate-800/80 light:border-slate-200 text-sm"
            >
              <span className="text-slate-300 light:text-slate-700">{s.description}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 light:bg-white font-mono text-xs text-indigo-400 light:text-indigo-600 border border-slate-700/60 light:border-slate-300 shadow-2xs font-semibold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}