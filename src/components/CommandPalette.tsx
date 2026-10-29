"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Plus, Settings, LogOut, Sun, Moon, Monitor, LayoutList, LayoutGrid, LayoutDashboard, X, Keyboard } from "@/components/icons";
import { AppIcon } from "@/components/AppIcon";
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
  onOpenShortcuts?: () => void;
  currentTheme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  currentViewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  currentAccent: AccentColor;
  onSetAccent: (accent: AccentColor) => void;
  categories: string[];
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  category: "recent" | "most-used" | "apps" | "actions" | "theme" | "view";
}

export default function CommandPalette({
  isOpen,
  onClose,
  apps,
  onOpenApp,
  onAddApp,
  onOpenSettings,
  onLogout,
  onOpenShortcuts,
  currentTheme,
  onSetTheme,
  currentViewMode,
  onSetViewMode,
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

    // When query is empty, add Recent and Most Used first
    if (!query.trim()) {
      const recent = [...apps]
        .filter((a) => a.lastOpened && !a.isHidden)
        .sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0))
        .slice(0, 3);

      for (const app of recent) {
        result.push({
          id: `recent-${app.id}`,
          label: app.name,
          description: "Recent app",
          icon: <AppIcon icon={app.icon} iconType={app.iconType === "emoji" ? "emoji" : app.iconType === "lucide" ? "lucide" : "brand"} iconSrc={app.iconSrc} name={app.name} className="w-5 h-5" size={20} />,
          keywords: [app.name, "recent"],
          action: () => { onOpenApp(app, false); onClose(); },
          category: "recent",
        });
      }

      const mostUsed = [...apps]
        .filter((a) => (a.clickCount || 0) > 0 && !a.isHidden)
        .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
        .slice(0, 3);

      for (const app of mostUsed) {
        if (!recent.some((r) => r.id === app.id)) {
          result.push({
            id: `most-used-${app.id}`,
            label: app.name,
            description: `${app.clickCount} opens`,
            icon: <AppIcon icon={app.icon} iconType={app.iconType === "emoji" ? "emoji" : app.iconType === "lucide" ? "lucide" : "brand"} iconSrc={app.iconSrc} name={app.name} className="w-5 h-5" size={20} />,
            keywords: [app.name, "most used", "frequent"],
            action: () => { onOpenApp(app, false); onClose(); },
            category: "most-used",
          });
        }
      }
    }

    // Apps
    for (const app of apps) {
      if (app.isHidden) continue;
      result.push({
        id: `app-${app.id}`,
        label: app.name,
        description: app.description || app.url,
        icon: <AppIcon icon={app.icon} iconType={app.iconType === "emoji" ? "emoji" : app.iconType === "lucide" ? "lucide" : "brand"} iconSrc={app.iconSrc} name={app.name} className="w-5 h-5" size={20} />,
        keywords: [app.name, app.description || "", app.category, ...(app.tags || [])].map((s) => s.toLowerCase()),
        action: () => { onOpenApp(app, false); onClose(); },
        category: "apps",
      });
    }

    // Actions
    result.push(
      { id: "add-app", label: "Add app", description: "Create a new custom app", icon: <Plus className="w-4 h-4" />, keywords: ["add", "new", "app", "create"], action: () => { onAddApp(); onClose(); }, category: "actions" },
      { id: "settings", label: "Settings", description: "Open dashboard settings", icon: <Settings className="w-4 h-4" />, keywords: ["settings", "preferences", "config"], action: () => { onOpenSettings(); onClose(); }, category: "actions" },
      { id: "shortcuts", label: "Keyboard shortcuts", description: "View all keyboard shortcuts", icon: <Keyboard className="w-4 h-4" />, keywords: ["shortcuts", "keys", "help"], action: () => { onOpenShortcuts?.(); onClose(); }, category: "actions" },
      { id: "logout", label: "Sign out", description: "Sign out of VinDeck", icon: <LogOut className="w-4 h-4" />, keywords: ["logout", "sign out", "exit"], action: () => { onLogout(); onClose(); }, category: "actions" }
    );

    // Theme toggles
    const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
      { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
      { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
      { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
    ];
    for (const t of themes) {
      result.push({
        id: `theme-${t.value}`,
        label: `Theme: ${t.label}`,
        description: `Switch theme to ${t.label.toLowerCase()}`,
        icon: t.icon,
        keywords: ["theme", t.label.toLowerCase(), t.value],
        action: () => onSetTheme(t.value),
        category: "theme",
      });
    }

    // View toggles
    const views: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
      { value: "cards", label: "Grid", icon: <LayoutGrid className="w-4 h-4" /> },
      { value: "list", label: "List", icon: <LayoutList className="w-4 h-4" /> },
      { value: "compact", label: "Compact", icon: <LayoutDashboard className="w-4 h-4" /> },
    ];
    for (const v of views) {
      result.push({
        id: `view-${v.value}`,
        label: `View: ${v.label}`,
        description: `Switch view mode to ${v.label.toLowerCase()}`,
        icon: v.icon,
        keywords: ["view", "mode", v.label.toLowerCase(), v.value],
        action: () => onSetViewMode(v.value),
        category: "view",
      });
    }

    return result;
  }, [apps, query, onOpenApp, onAddApp, onOpenSettings, onOpenShortcuts, onLogout, onSetTheme, onSetViewMode, onClose]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter((item) =>
      item.keywords.some((k) => k.includes(lower)) ||
      item.label.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower)
    );
  }, [items, query]);

  const visibleItems = filteredItems.slice(0, 10);

  useKeyboardShortcuts([
    { key: "Escape", handler: onClose, description: "Close command palette" },
    { key: "ArrowDown", handler: () => setSelectedIndex((i) => Math.min(i + 1, visibleItems.length - 1)), description: "Next item" },
    { key: "ArrowUp", handler: () => setSelectedIndex((i) => Math.max(i - 1, 0)), description: "Previous item" },
    { key: "Enter", handler: () => visibleItems[selectedIndex]?.action(), description: "Run command" },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div
        ref={containerRef}
        className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 light:border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search apps…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 light:text-slate-900 placeholder-slate-500"
          />
          <button onClick={onClose} type="button" className="p-1 rounded-xl text-slate-400 hover:text-slate-200" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {visibleItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No matching results</div>
          ) : (
            visibleItems.map((item, index) => (
              <button
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
                type="button"
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-colors ${
                  selectedIndex === index
                    ? "bg-indigo-500/15 text-indigo-300 light:text-indigo-600 border border-indigo-500/30"
                    : "text-slate-300 light:text-slate-700 hover:bg-slate-800/50 light:hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/80 light:bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-300 light:text-slate-700">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{item.label}</p>
                    <p className="text-xs text-slate-400 light:text-slate-500 truncate">{item.description}</p>
                  </div>
                </div>
                {item.category === "recent" && (
                  <span className="text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Recent
                  </span>
                )}
                {item.category === "most-used" && (
                  <span className="text-[10px] uppercase font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    Frequent
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}