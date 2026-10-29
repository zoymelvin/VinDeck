"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ExternalLink, Settings, LogOut, Plus, Sun, Moon, Monitor, LayoutList, LayoutGrid, LayoutDashboard, X } from "lucide-react";
import type { App as AppType, ThemeMode, ViewMode, AccentColor } from "@/lib/types";
import { useKeyboardShortcuts, useFocusTrap } from "@/hooks/useKeyboardShortcuts";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppType[];
  onOpenApp: (app: AppType, newTab: boolean) => void;
  onAddApp: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  currentTheme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  currentViewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  currentAccent: AccentColor;
  onSetAccent: (accent: AccentColor) => void;
  categories: string[];
}

const ACCENT_OPTIONS: { value: AccentColor; label: string }[] = [
  { value: "blue", label: "Biru" },
  { value: "indigo", label: "Indigo" },
  { value: "violet", label: "Violet" },
  { value: "pink", label: "Pink" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
  { value: "emerald", label: "Emerald" },
];

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  category: "apps" | "actions" | "theme" | "view" | "accent";
}

export default function CommandPalette({
  isOpen,
  onClose,
  apps,
  onOpenApp,
  onAddApp,
  onOpenSettings,
  onLogout,
  currentTheme,
  onSetTheme,
  currentViewMode,
  onSetViewMode,
  currentAccent,
  onSetAccent,
  categories,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useFocusTrap(isOpen);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    
    if (isOpen && !wasOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const items = useMemo((): CommandItem[] => {
    const result: CommandItem[] = [];

    for (const app of apps) {
      if (app.isHidden) continue;
      result.push({
        id: `app-${app.id}`,
        label: app.name,
        description: app.description || app.url,
        icon: app.iconType === "emoji" ? <span className="text-lg">{app.icon}</span> : <Monitor size={16} />,
        keywords: [app.name, app.description, app.category, ...app.tags].map((s) => s.toLowerCase()),
        action: () => { onOpenApp(app, false); onClose(); },
        category: "apps",
      });
    }

    result.push(
      { id: "add-app", label: "Tambah aplikasi", description: "Buat aplikasi kustom baru", icon: <Plus size={16} />, keywords: ["tambah", "add", "aplikasi", "app", "buat", "create"], action: () => { onAddApp(); onClose(); }, category: "actions" },
      { id: "settings", label: "Pengaturan", description: "Buka halaman pengaturan", icon: <Settings size={16} />, keywords: ["pengaturan", "settings", "konfigurasi"], action: () => { onOpenSettings(); onClose(); }, category: "actions" },
      { id: "logout", label: "Keluar", description: "Keluar dari dashboard", icon: <LogOut size={16} />, keywords: ["keluar", "logout", "sign out"], action: () => { onLogout(); onClose(); }, category: "actions" }
    );

    const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
      { value: "light", label: "Terang", icon: <Sun size={16} /> },
      { value: "dark", label: "Gelap", icon: <Moon size={16} /> },
      { value: "system", label: "Ikuti sistem", icon: <Monitor size={16} /> },
    ];
    for (const t of themes) {
      result.push({
        id: `theme-${t.value}`,
        label: `Tema: ${t.label}`,
        description: `Ganti tema ke ${t.label.toLowerCase()}`,
        icon: t.icon,
        keywords: ["tema", "theme", t.label.toLowerCase(), t.value],
        action: () => onSetTheme(t.value),
        category: "theme",
      });
    }

    const views: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
      { value: "cards", label: "Kartu", icon: <LayoutGrid size={16} /> },
      { value: "list", label: "Daftar", icon: <LayoutList size={16} /> },
      { value: "compact", label: "Ringkas", icon: <LayoutDashboard size={16} /> },
    ];
    for (const v of views) {
      result.push({
        id: `view-${v.value}`,
        label: `Tampilan: ${v.label}`,
        description: `Ganti mode tampilan ke ${v.label.toLowerCase()}`,
        icon: v.icon,
        keywords: ["tampilan", "view", "mode", v.label.toLowerCase(), v.value],
        action: () => onSetViewMode(v.value),
        category: "view",
      });
    }

    for (const a of ACCENT_OPTIONS) {
      result.push({
        id: `accent-${a.value}`,
        label: `Warna aksen: ${a.label}`,
        description: `Ganti warna aksen ke ${a.label}`,
        icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `var(--color-${a.value}-500)` }} />,
        keywords: ["warna", "aksen", "color", "accent", a.label.toLowerCase(), a.value],
        action: () => onSetAccent(a.value),
        category: "accent",
      });
    }

    return result;
  }, [apps, currentTheme, currentViewMode, currentAccent, onOpenApp, onAddApp, onOpenSettings, onLogout, onSetTheme, onSetViewMode, onSetAccent]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter((item) => item.keywords.includes(lowerQuery) || item.label.toLowerCase().includes(lowerQuery) || item.description.toLowerCase().includes(lowerQuery));
  }, [items, query]);

  const visibleItems = filteredItems.slice(0, 8);

  useKeyboardShortcuts([
    { key: "Escape", handler: onClose, description: "Tutup palet perintah" },
    { key: "ArrowDown", handler: () => setSelectedIndex((i) => Math.min(i + 1, visibleItems.length - 1)), description: "Item berikutnya" },
    { key: "ArrowUp", handler: () => setSelectedIndex((i) => Math.max(i - 1, 0)), description: "Item sebelumnya" },
    { key: "Enter", handler: () => visibleItems[selectedIndex]?.action(), description: "Jalankan perintah" },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={(e) => e.stopPropagation()} />
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              placeholder="Ketik perintah atau cari aplikasi..."
              className="w-full pl-10 pr-10 py-3 text-base bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
              Ctrl+K
            </kbd>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <X className="mx-auto mb-2 text-gray-300 dark:text-gray-500" size={32} />
              Tidak ada perintah yang cocok
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {visibleItems.map((item, index) => (
                <li key={item.id}>
                  <button
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      index === selectedIndex
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 uppercase">
                      {item.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>↑↓ Navigasi • Enter Pilih • Esc Tutup</span>
          <span>{visibleItems.length} hasil</span>
        </div>
      </div>
    </div>
  );
}