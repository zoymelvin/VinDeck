"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Pin,
  Activity,
  Zap,
  FileText,
} from "@/components/icons";
import type { App as AppType, Category, ViewMode } from "@/lib/types";
import {
  getApps,
  getCategories,
  getSettings,
  setApps,
  setSettings,
  setCategories,
  recordClick,
  getHiddenBuiltInApps,
} from "@/lib/storage";
import { filterApps, sortAppsByOrder } from "@/lib/search";
import { getGreetingPeriod, getGreetingText, formatDateTime } from "@/lib/greeting";
import { getNotes, Note } from "@/lib/notes";
import { useSettingsStore, SettingsProvider } from "@/hooks/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";

import { Header } from "@/components/Header";
import { Toolbar } from "@/components/Toolbar";
import AppCard from "@/components/AppCard";
import AppForm from "@/components/AppForm";
import SettingsDialog from "@/components/SettingsDialog";
import CommandPalette from "@/components/CommandPalette";
import { ConfirmOpenDialog } from "@/components/ConfirmOpenDialog";
import { MeshBackground } from "@/components/MeshBackground";
import { strings } from "@/lib/strings";

export function DashboardContent() {
  const [apps, setAppsState] = useState<AppType[]>(() => getApps());
  const [categories, setCategoriesState] = useState<Category[]>(() => getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHiddenApps, setShowHiddenApps] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Modals & Dialogs
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppType | null>(null);
  const [confirmApp, setConfirmApp] = useState<AppType | null>(null);

  // App statuses
  const [appStatuses] = useState<Record<string, "checking" | "reachable" | "unreachable" | null>>({});

  // Clock
  const [now, setNow] = useState<Date | null>(null);

  // Notes for Bento tile
  const [recentNotes, setRecentNotes] = useState<Note[]>(() => getNotes().slice(0, 2));

  const { theme } = useTheme();
  const { showSuccess, showInfo } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(() => {
    setAppsState(getApps());
    setCategoriesState(getCategories());
    setRecentNotes(getNotes().slice(0, 2));
  }, []);

  // Keyboard shortcut / and Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const period = now ? getGreetingPeriod(now) : "morning";
  const greetingText = getGreetingText(period, "");

  const filteredApps = useMemo(() => {
    return filterApps(apps, searchQuery, selectedCategory, showHiddenApps);
  }, [apps, searchQuery, selectedCategory, showHiddenApps]);

  const pinnedApps = useMemo(() => {
    return sortAppsByOrder(filteredApps.filter((a) => a.isPinned));
  }, [filteredApps]);

  const allAppsSorted = useMemo(() => {
    return sortAppsByOrder(filteredApps);
  }, [filteredApps]);

  // Most used computation
  const mostUsedApp = useMemo(() => {
    if (apps.length === 0) return null;
    return [...apps].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
  }, [apps]);

  const onlineCount = useMemo(() => {
    return Object.values(appStatuses).filter((s) => s === "reachable").length;
  }, [appStatuses]);

  const handleOpenApp = (app: AppType, newTab: boolean) => {
    setConfirmApp(app);
  };

  const handleConfirmOpen = (app: AppType) => {
    recordClick(app.id);
    loadData();
    setConfirmApp(null);
    window.open(app.url, "_blank", "noopener,noreferrer");
  };

  const handleTogglePin = (app: AppType) => {
    const updated = apps.map((a) =>
      a.id === app.id ? { ...a, isPinned: !a.isPinned, updatedAt: Date.now() } : a
    );
    setApps(updated);
    loadData();
    showInfo(app.isPinned ? strings.common.unpin : strings.common.pin);
  };

  const handleToggleHidden = (app: AppType) => {
    const updated = apps.map((a) =>
      a.id === app.id ? { ...a, isHidden: !a.isHidden, updatedAt: Date.now() } : a
    );
    setApps(updated);
    loadData();
  };

  const handleDeleteApp = (app: AppType) => {
    if (confirm(`Delete ${app.name}?`)) {
      const updated = apps.filter((a) => a.id !== app.id);
      setApps(updated);
      loadData();
      showInfo(strings.toasts.appDeleted);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showSuccess(strings.toasts.linkCopied);
  };

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  const handleSaveAppForm = (submitted: Partial<AppType> & { id?: string }) => {
    if (submitted.id) {
      // Edit
      const updated = apps.map((a) =>
        a.id === submitted.id ? ({ ...a, ...submitted, updatedAt: Date.now() } as AppType) : a
      );
      setApps(updated);
      showSuccess("App updated");
    } else {
      // Add
      const now = Date.now();
      const newApp: AppType = {
        id: `custom-${now}`,
        name: submitted.name || "New App",
        description: submitted.description || "",
        url: submitted.url || "https://",
        icon: submitted.icon || "🔗",
        iconType: submitted.iconType || "emoji",
        accentColor: submitted.accentColor || "blue",
        category: submitted.category || "media",
        tags: submitted.tags || [],
        isBuiltIn: false,
        isHidden: false,
        isPinned: submitted.isPinned || false,
        statusEnabled: true,
        sortOrder: apps.length + 1,
        clickCount: 0,
        lastOpened: null,
        createdAt: now,
        updatedAt: now,
      };
      setApps([newApp, ...apps]);
      showSuccess("App created");
    }
    setIsAddAppOpen(false);
    loadData();
  };

  const handleAddCategory = (name: string) => {
    const newCat: Category = {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      isBuiltIn: false,
      sortOrder: categories.length + 1,
    };
    setCategories([...categories, newCat]);
    loadData();
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      <MeshBackground />

      {/* Floating Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAddApp={() => {
          setEditingApp(null);
          setIsAddAppOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={handleSignOut}
        onOpenProfile={() => {}}
        onOpenKeyboardShortcuts={() => {}}
        onExportData={() => {}}
        onImportData={() => {}}
        profilePhoto={undefined}
        profileName=""
        theme="system"
        onSetTheme={() => {}}
        accentColor="blue"
        onSetAccentColor={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">
        {/* Hero Section */}
        <section className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-purple-300 dark:from-white dark:to-slate-300 light:from-slate-900 light:to-indigo-950 bg-clip-text text-transparent">
            {greetingText}
          </h1>
          <p className="text-sm text-slate-400 light:text-slate-600 font-medium">
            {now ? formatDateTime(now) : "—"}
          </p>
        </section>

        {/* Bento Grid (12 Columns) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Apps Online */}
          <div className="p-5 rounded-3xl bg-slate-900/60 light:bg-white/80 backdrop-blur-xl border border-slate-800/80 light:border-slate-200/80 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-1">
                Apps Online
              </p>
              <h2 className="text-2xl font-bold text-slate-100 light:text-slate-900">
                {onlineCount} / {apps.length}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Recent Notes */}
          <Link
            href="/notes"
            className="p-5 rounded-3xl bg-slate-900/60 light:bg-white/80 backdrop-blur-xl border border-slate-800/80 light:border-slate-200/80 shadow-md hover:border-indigo-500/50 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider">
                Recent Notes
              </p>
              <FileText className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            {recentNotes.length > 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200 light:text-slate-800 truncate">
                  {recentNotes[0].title}
                </p>
                <p className="text-xs text-slate-400 light:text-slate-500 line-clamp-1 font-mono">
                  {recentNotes[0].content}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No notes yet</p>
            )}
          </Link>

          {/* Most Used */}
          <div className="p-5 rounded-3xl bg-slate-900/60 light:bg-white/80 backdrop-blur-xl border border-slate-800/80 light:border-slate-200/80 shadow-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-1">
                Most Used
              </p>
              <h2 className="text-base font-bold text-slate-100 light:text-slate-900 truncate max-w-[140px]">
                {mostUsedApp ? mostUsedApp.name : "—"}
              </h2>
              {mostUsedApp && (
                <p className="text-[11px] text-slate-400 font-mono">
                  {mostUsedApp.clickCount || 0} clicks
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          {/* Shortcuts */}
          <div className="p-5 rounded-3xl bg-slate-900/60 light:bg-white/80 backdrop-blur-xl border border-slate-800/80 light:border-slate-200/80 shadow-md flex flex-col justify-between">
            <p className="text-xs font-semibold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
              Shortcuts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                type="button"
                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800/60 light:bg-slate-100 text-xs font-medium text-slate-300 light:text-slate-700 hover:bg-slate-800 text-center"
              >
                ⌘K Search
              </button>
              <Link
                href="/notes"
                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800/60 light:bg-slate-100 text-xs font-medium text-slate-300 light:text-slate-700 hover:bg-slate-800 text-center"
              >
                Notes
              </Link>
            </div>
          </div>
        </section>

        {/* Toolbar Controls */}
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categories}
          showHiddenApps={showHiddenApps}
          onToggleShowHiddenApps={setShowHiddenApps}
        />

        {/* Favorites Section */}
        {pinnedApps.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-bold tracking-tight text-slate-200 light:text-slate-900">
                {strings.home.sections.favorites}
              </h2>
            </div>
            <div
              className={
                viewMode === "cards"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : viewMode === "list"
                  ? "space-y-3"
                  : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
              }
            >
              {pinnedApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  viewMode={viewMode}
                  isPinned={true}
                  onOpen={handleOpenApp}
                  onEdit={(a) => {
                    setEditingApp(a);
                    setIsAddAppOpen(true);
                  }}
                  onTogglePin={handleTogglePin}
                  onToggleHidden={handleToggleHidden}
                  onDelete={handleDeleteApp}
                  onCopyLink={handleCopyLink}
                  status={appStatuses[app.id] ?? null}
                  checking={false}
                  openInNewTabDefault={true}
                  accentColor={app.accentColor}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Apps Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-200 light:text-slate-900">
              {strings.home.sections.allApps}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {allAppsSorted.length} {allAppsSorted.length === 1 ? "app" : "apps"}
            </span>
          </div>

          {allAppsSorted.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-slate-400 text-sm font-medium">{strings.home.sections.noApps}</p>
              <p className="text-slate-600 text-xs mt-1">{strings.home.sections.noAppsDesc}</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "cards"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : viewMode === "list"
                  ? "space-y-3"
                  : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
              }
            >
              {allAppsSorted.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  viewMode={viewMode}
                  isPinned={app.isPinned}
                  onOpen={handleOpenApp}
                  onEdit={(a) => {
                    setEditingApp(a);
                    setIsAddAppOpen(true);
                  }}
                  onTogglePin={handleTogglePin}
                  onToggleHidden={handleToggleHidden}
                  onDelete={handleDeleteApp}
                  onCopyLink={handleCopyLink}
                  status={appStatuses[app.id] ?? null}
                  checking={false}
                  openInNewTabDefault={true}
                  accentColor={app.accentColor}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmOpenDialog
        app={confirmApp}
        isOpen={!!confirmApp}
        onClose={() => setConfirmApp(null)}
        onConfirm={handleConfirmOpen}
      />

      {/* Modals & Dialogs */}
      {isSearchOpen && (
        <CommandPalette
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          apps={apps}
          onOpenApp={handleOpenApp}
          onAddApp={() => {
            setIsSearchOpen(false);
            setIsAddAppOpen(true);
          }}
          onOpenSettings={() => {
            setIsSearchOpen(false);
            setIsSettingsOpen(true);
          }}
          onLogout={handleSignOut}
          currentTheme={theme}
          onSetTheme={() => {}}
          currentViewMode={viewMode}
          onSetViewMode={setViewMode}
          currentAccent="blue"
          onSetAccent={() => {}}
          categories={categories.map((c) => c.name)}
        />
      )}

      {isAddAppOpen && (
        <AppForm
          isOpen={isAddAppOpen}
          initialData={editingApp}
          categories={categories}
          onClose={() => setIsAddAppOpen(false)}
          onSubmit={handleSaveAppForm}
          onAddCategory={handleAddCategory}
        />
      )}

      {isSettingsOpen && (
        <SettingsDialog
          isOpen={isSettingsOpen}
          settings={getSettings()}
          categories={categories}
          hiddenBuiltInApps={getHiddenBuiltInApps()}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsChange={(newSettings) => {
            setSettings({ ...getSettings(), ...newSettings });
            loadData();
          }}
          onCategoriesChange={(newCats) => {
            setCategories(newCats);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SettingsProvider>
      <DashboardContent />
    </SettingsProvider>
  );
}