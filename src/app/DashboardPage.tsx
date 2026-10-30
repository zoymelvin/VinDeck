"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Pin,
  Activity,
  Zap,
  FileText,
} from "@/components/icons";
import type { App as AppType, Category, ViewMode, AccentColor } from "@/lib/types";
import {
  getApps,
  getCategories,
  getSettings,
  setApps,
  setSettings,
  setCategories,
  recordClick,
  getHiddenBuiltInApps,
  exportAllData,
  importAllData,
} from "@/lib/storage";
import { filterApps, sortAppsByOrder } from "@/lib/search";
import { getGreetingPeriod, getGreetingText, formatDateTime } from "@/lib/greeting";
import { getNotes, Note } from "@/lib/notes";
import { useSettingsSelector, SettingsProvider } from "@/hooks/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";

import { Header } from "@/components/Header";
import { Toolbar } from "@/components/Toolbar";
import AppCard from "@/components/AppCard";
import AppForm from "@/components/AppForm";
import CommandPalette from "@/components/CommandPalette";
import { ConfirmOpenDialog } from "@/components/ConfirmOpenDialog";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { MeshBackground } from "@/components/MeshBackground";
import { strings } from "@/lib/strings";

export function DashboardContent() {
  const [apps, setAppsState] = useState<AppType[]>(() => getApps());
  const [categories, setCategoriesState] = useState<Category[]>(() => getCategories());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Modals & Dialogs
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppType | null>(null);
  const [confirmApp, setConfirmApp] = useState<AppType | null>(null);

  // App statuses - using server-side API
  const [appStatuses, setAppStatuses] = useState<Record<string, "checking" | "reachable" | "unreachable" | "unsupported" | null>>({});
  const [statusInfo, setStatusInfo] = useState<Record<string, { status: "checking" | "reachable" | "unreachable" | "unsupported"; lastChecked: number; latencyMs: number; reason?: string; method: string } | null>>({});
  const statusCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialStatusCheckDone = useRef(false);

  // Clock
  const [now, setNow] = useState<Date | null>(null);

  // Notes for Bento tile
  const [recentNotes, setRecentNotes] = useState<Note[]>(() => getNotes().slice(0, 2));

  const settings = useSettingsSelector((s) => s);
  const confirmBeforeOpen = settings.confirmBeforeOpen;
  const statusEnabled = settings.statusEnabled;
  const statusCheckInterval = settings.statusCheckInterval || 60;

  const { showSuccess, showInfo, showError } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(() => {
    setAppsState(getApps());
    setCategoriesState(getCategories());
    setRecentNotes(getNotes().slice(0, 2));
}, []);

  // Server-side status checking
  const checkAllStatuses = useCallback(async () => {
    if (!statusEnabled) return;

    const urls = apps.map((app): { id: string; url: string } => ({ id: app.id, url: app.statusUrl || app.url }));

    if (urls.length === 0) return;

    setAppStatuses((prev) => {
      const next = { ...prev };
      urls.forEach(({ id }) => { next[id] = "checking"; });
      return next;
    });
    setStatusInfo((prev) => {
      const next = { ...prev };
      urls.forEach(({ id }) => { next[id] = { status: "checking", lastChecked: Date.now(), latencyMs: 0, method: "server" }; });
      return next;
    });

    try {
      const response = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: urls }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Status check failed");

      interface StatusResult {
        id: string;
        state: "checking" | "reachable" | "unreachable" | "unsupported";
        httpStatus: number | null;
        latencyMs: number;
        reason?: string;
        method: string;
        checkedAt: string;
      }

      const results: StatusResult[] = await response.json();

      setAppStatuses((prev) => {
        const next = { ...prev };
        results.forEach((result: StatusResult) => { next[result.id] = result.state; });
        return next;
      });
      setStatusInfo((prev) => {
        const next = { ...prev };
        results.forEach((result: StatusResult) => {
          next[result.id] = {
            status: result.state,
            lastChecked: Date.now(),
            latencyMs: result.latencyMs,
            reason: result.reason,
            method: result.method,
          };
        });
        return next;
      });
    } catch (error) {
      console.warn("Status check failed:", error);
      setAppStatuses((prev) => {
        const next = { ...prev };
        urls.forEach(({ id }) => { next[id] = "unreachable"; });
        return next;
      });
      setStatusInfo((prev) => {
        const next = { ...prev };
        urls.forEach(({ id }) => {
          next[id] = { status: "unreachable", lastChecked: Date.now(), latencyMs: 0, method: "server", reason: "request_failed" };
        });
        return next;
      });
    }
  }, [apps, statusEnabled]);

  useEffect(() => {
    if (statusEnabled && !initialStatusCheckDone.current) {
      initialStatusCheckDone.current = true;
      checkAllStatuses();
    }
    if (statusEnabled) {
      const interval = setInterval(checkAllStatuses, statusCheckInterval * 1000);
      statusCheckIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [statusEnabled, checkAllStatuses, statusCheckInterval]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && statusEnabled) {
        checkAllStatuses();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [statusEnabled, checkAllStatuses]);

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
    if (selectedCategory === "favorites") {
      return filterApps(apps, searchQuery, null).filter((a) => a.isPinned);
    }
    return filterApps(apps, searchQuery, selectedCategory);
  }, [apps, searchQuery, selectedCategory]);

  const allAppsSorted = useMemo(() => {
    const sorted = sortAppsByOrder(filteredApps);
    // Sort pinned first
    return sorted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
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
    if (settings.confirmBeforeOpen) {
      setConfirmApp(app);
    } else {
      handleConfirmOpen(app, newTab);
    }
  };

  const handleConfirmOpen = (app: AppType, newTabOverride?: boolean) => {
    recordClick(app.id);
    loadData();
    setConfirmApp(null);

    const openInNewTab = newTabOverride ?? (settings.openLinksIn === "new-tab");
    if (openInNewTab) {
      window.open(app.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(app.url);
    }
  };

  const handleTogglePin = (app: AppType) => {
    const updated = apps.map((a) =>
      a.id === app.id ? { ...a, isPinned: !a.isPinned, updatedAt: Date.now() } : a
    );
    setApps(updated);
    loadData();
    showInfo(app.isPinned ? strings.common.unpin : strings.common.pin);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showSuccess("Link copied");
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

  const handleExportData = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `vindeck-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess("Data exported successfully");
    } catch {
      showError("Failed to export data");
    }
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = importAllData(data);
        if (result.success) {
          showSuccess("Data imported successfully");
          loadData();
        } else {
          showError(result.error || "Failed to import data");
        }
      } catch {
        showError("Invalid backup file");
      }
    };
    input.click();
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
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenKeyboardShortcuts={() => setIsShortcutsOpen(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        profilePhoto={settings.profilePhoto}
        profileName={settings.profileName || settings.greetingName}
        theme={settings.theme}
        onSetTheme={(t) => {
          const updated = { ...settings, theme: t };
          setSettings(updated);
          loadData();
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="flex-1 max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-28 sm:pb-8 w-full space-y-4">
        {/* Hero Section - Single row */}
        <section className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 light:text-slate-900 truncate">
              {greetingText}
            </h1>
            <span className="hidden sm:inline text-xs text-slate-500 light:text-slate-500 font-medium">
              {now ? formatDateTime(now) : "—"}
            </span>
          </div>
          {apps.length > 0 && Object.keys(appStatuses).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 light:bg-slate-100 border border-slate-700/40 light:border-slate-200 text-xs font-medium text-slate-300 light:text-slate-700 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineCount}/{apps.length} online</span>
            </div>
          )}
        </section>

        {/* Toolbar Controls */}
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categories={categories}
        />

        {/* Favorites Section */}
        <section className="space-y-3">
            {allAppsSorted.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60"
              >
                <p className="text-slate-400 text-sm font-medium">No apps found</p>
                <p className="text-slate-600 text-xs mt-1">Try changing your search or category filter</p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className={
                  viewMode === "cards"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                    : viewMode === "list"
                    ? "space-y-2"
                    : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2"
                }
              >
                {allAppsSorted.map((app, index) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                  >
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
                      statusInfo={statusInfo[app.id] ?? null}
                      checking={appStatuses[app.id] === "checking"}
                      openInNewTabDefault={settings.openLinksIn === "new-tab"}
                      accentColor={app.accentColor}
                    />
                  </motion.div>
                ))}
              </motion.div>
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
          onOpenShortcuts={() => {
            setIsSearchOpen(false);
            setIsShortcutsOpen(true);
          }}
          currentTheme={settings.theme}
          onSetTheme={(t) => {
            const updated = { ...settings, theme: t };
            setSettings(updated);
            loadData();
          }}
          currentViewMode={viewMode}
          onSetViewMode={setViewMode}
          categories={categories.map((c) => c.name)}
        />
      )}

      {isAddAppOpen && (
        <AppForm
          key={editingApp?.id || "new"}
          isOpen={isAddAppOpen}
          initialData={editingApp}
          categories={categories}
          onClose={() => setIsAddAppOpen(false)}
          onSubmit={handleSaveAppForm}
          onAddCategory={handleAddCategory}
        />
      )}

      {isShortcutsOpen && (
        <KeyboardShortcutsDialog
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      )}

      {isProfileOpen && (
        <ProfileDialog
          key={settings.profileName}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentName={settings.profileName || settings.greetingName}
          currentPhoto={settings.profilePhoto || ""}
        />
      )}

      {isSettingsOpen && (
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
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