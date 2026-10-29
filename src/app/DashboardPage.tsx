"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { Search, Menu, X, Sun, Moon, Settings, LogOut, Plus, Pin, ChevronDown, Clock, Calendar, HelpCircle, Bell, Zap } from "lucide-react";
import type { App as AppType, Category, UserSettings, ViewMode, AccentColor } from "@/lib/types";
import { getApps, getCategories, getSettings, setApps, setCategories, setSettings, recordClick, getQuickNotes, setQuickNotes, exportAllData, importAllData, resetToDefaults, getHiddenBuiltInApps, restoreBuiltInApp } from "@/lib/storage";
import { filterApps, sortAppsByOrder, getUniqueCategories } from "@/lib/search";
import { getGreetingPeriod, getGreetingText, formatDateTime } from "@/lib/greeting";
import { useTheme, useAccentColor, useViewMode } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { useKeyboardShortcuts, useFocusTrap } from "@/hooks/useKeyboardShortcuts";
import CommandPalette from "@/components/CommandPalette";
import AppCard from "@/components/AppCard";
import AppForm from "@/components/AppForm";
import SettingsDialog from "@/components/SettingsDialog";

const STATUS_CHECK_INTERVAL = 60000;
const STATUS_TIMEOUT = 4000;

const SERVER_TIME = new Date(0);

const timeStore = (() => {
  let currentTime = new Date();
  const subscribers = new Set<() => void>();

  if (typeof window !== "undefined") {
    setInterval(() => {
      currentTime = new Date();
      subscribers.forEach((cb) => cb());
    }, 1000);
  }

  return {
    getSnapshot: () => currentTime,
    getServerSnapshot: () => SERVER_TIME,
    subscribe: (callback: () => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
})();

export default function DashboardPage() {
  const { theme, setTheme: setThemeMode } = useTheme();
  const { accent, setAccent: setAccentColor } = useAccentColor();
  const { viewMode, setViewMode: setViewModeMode } = useViewMode();
  const { toasts, removeToast, showSuccess, showError, showInfo, showUndo } = useToast();

  const now = useSyncExternalStore<Date>(
    timeStore.subscribe,
    timeStore.getSnapshot,
    timeStore.getServerSnapshot
  );

  const [apps, setAppsState] = useState<AppType[]>(() => getApps());
  const [categories, setCategoriesState] = useState<Category[]>(() => getCategories());
  const [settings, setSettingsState] = useState<UserSettings>(() => getSettings());
  const [quickNotes, setQuickNotesState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("vindeck_collapsed_categories");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [appFormOpen, setAppFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppType | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deletingApp, setDeletingApp] = useState<AppType | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, "checking" | "reachable" | "unreachable" | null>>({});
  const [checkingStatus, setCheckingStatus] = useState<Set<string>>(new Set());
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialStatusCheckDone = useRef(false);

  const containerRef = useFocusTrap(commandPaletteOpen || appFormOpen || settingsOpen || helpOpen);

  useEffect(() => {
    localStorage.setItem("vindeck_collapsed_categories", JSON.stringify(Array.from(collapsedCategories)));
  }, [collapsedCategories]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useKeyboardShortcuts([
    { key: "k", ctrlKey: true, metaKey: false, handler: () => setCommandPaletteOpen(true), description: "Buka palet perintah" },
    { key: "k", ctrlKey: false, metaKey: true, handler: () => setCommandPaletteOpen(true), description: "Buka palet perintah (Mac)" },
    { key: "Escape", handler: () => { setCommandPaletteOpen(false); setAppFormOpen(false); setEditingApp(null); setSettingsOpen(false); setHelpOpen(false); }, description: "Tutup dialog" },
    { key: "?", shiftKey: true, handler: () => setHelpOpen(true), description: "Buka bantuan pintasan" },
  ]);

  const checkAppStatus = useCallback(async (app: AppType) => {
    if (!settings.statusEnabled || !app.statusEnabled) return;
    setCheckingStatus((prev) => new Set(prev).add(app.id));
    setStatuses((prev) => ({ ...prev, [app.id]: "checking" }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STATUS_TIMEOUT);

    try {
      await fetch(app.url, { method: "HEAD", mode: "no-cors", signal: controller.signal, cache: "no-cache" });
      clearTimeout(timeoutId);
      setStatuses((prev) => ({ ...prev, [app.id]: "reachable" }));
    } catch {
      clearTimeout(timeoutId);
      setStatuses((prev) => ({ ...prev, [app.id]: "unreachable" }));
    } finally {
      setCheckingStatus((prev) => { const next = new Set(prev); next.delete(app.id); return next; });
    }
  }, [settings.statusEnabled]);

  const checkAllStatuses = useCallback(() => {
    const visibleApps = apps.filter((a) => !a.isHidden || showHidden);
    for (const app of visibleApps) {
      checkAppStatus(app);
    }
  }, [apps, showHidden, checkAppStatus]);

  useEffect(() => {
    if (settings.statusEnabled && !initialStatusCheckDone.current) {
      initialStatusCheckDone.current = true;
      checkAllStatuses();
    }
    if (settings.statusEnabled) {
      const interval = setInterval(checkAllStatuses, STATUS_CHECK_INTERVAL);
      statusCheckIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [settings.statusEnabled, checkAllStatuses]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && settings.statusEnabled) {
        checkAllStatuses();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [settings.statusEnabled, checkAllStatuses]);

  const filteredApps = useMemo(() => filterApps(apps, searchQuery, categoryFilter, showHidden), [apps, searchQuery, categoryFilter, showHidden]);
  const sortedApps = useMemo(() => sortAppsByOrder(filteredApps), [filteredApps]);
  const uniqueCategories = useMemo(() => getUniqueCategories(apps), [apps]);
  const pinnedApps = useMemo(() => sortedApps.filter((a) => a.isPinned), [sortedApps]);
  const unpinnedApps = useMemo(() => sortedApps.filter((a) => !a.isPinned), [sortedApps]);
  const recentApps = useMemo(() => [...sortedApps].filter((a) => a.lastOpened).sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0)).slice(0, 5), [sortedApps]);
  const topApps = useMemo(() => [...sortedApps].filter((a) => a.clickCount > 0).sort((a, b) => b.clickCount - a.clickCount).slice(0, 3), [sortedApps]);

  const greetingPeriod = getGreetingPeriod(now);
  const greetingText = getGreetingText(greetingPeriod, settings.greetingName);

  const handleOpenApp = (app: AppType, newTab: boolean) => {
    recordClick(app.id);
    if (newTab) {
      window.open(app.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = app.url;
    }
  };

  const handleAddApp = () => {
    setEditingApp(null);
    setAppFormOpen(true);
  };

  const handleEditApp = (app: AppType) => {
    setEditingApp(app);
    setAppFormOpen(true);
  };

  const handleSubmitApp = (appData: Partial<AppType> & { id?: string }) => {
    const currentApps = getApps();
    let newApps: AppType[];

    if (appData.id) {
      newApps = currentApps.map((a) => (a.id === appData.id ? { ...a, ...appData, updatedAt: Date.now() } : a));
    } else {
      const newApp: AppType = {
        id: `app-${Date.now()}`,
        name: appData.name!,
        description: appData.description || "",
        url: appData.url!,
        icon: appData.icon!,
        iconType: appData.iconType!,
        accentColor: appData.accentColor!,
        category: appData.category!,
        tags: appData.tags || [],
        isBuiltIn: false,
        isHidden: false,
        isPinned: false,
        statusEnabled: true,
        sortOrder: currentApps.length,
        clickCount: 0,
        lastOpened: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      newApps = [...currentApps, newApp];
    }

    setApps(newApps);
    setAppsState(newApps);
    showSuccess(appData.id ? "Aplikasi diperbarui" : "Aplikasi ditambahkan");
    setAppFormOpen(false);
    setEditingApp(null);
  };

  const handleTogglePin = (app: AppType) => {
    const newApps = apps.map((a) => (a.id === app.id ? { ...a, isPinned: !a.isPinned, updatedAt: Date.now() } : a));
    setApps(newApps);
    setAppsState(newApps);
  };

  const handleToggleHidden = (app: AppType) => {
    const newApps = apps.map((a) => (a.id === app.id ? { ...a, isHidden: !a.isHidden, updatedAt: Date.now() } : a));
    setApps(newApps);
    setAppsState(newApps);
  };

  const handleDeleteApp = (app: AppType) => {
    setDeletingApp(app);
  };

  const confirmDeleteApp = () => {
    if (!deletingApp) return;
    if (deletingApp.isBuiltIn) {
      handleToggleHidden(deletingApp);
      setDeletingApp(null);
      return;
    }
    const newApps = apps.filter((a) => a.id !== deletingApp.id);
    setApps(newApps);
    setAppsState(newApps);
    showUndo(`${deletingApp.name} dihapus`, () => {
      const restoredApps = [...apps, deletingApp];
      setApps(restoredApps);
      setAppsState(restoredApps);
      showSuccess("Dihapus diurungkan");
    });
    setDeletingApp(null);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showSuccess("Tautan disalin");
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleAddCategory = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const newCategory: Category = { id, name, isBuiltIn: false, sortOrder: categories.length + 1 };
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    setCategoriesState(newCategories);
  };

  const handleSettingsSave = (newSettings: Partial<UserSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    setSettingsState(merged);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vindeck-backup-${now.toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("Data diekspor");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = importAllData(data);
      if (result.success) {
        showSuccess("Data diimpor");
        window.location.reload();
      } else {
        showError(result.error || "Gagal impor");
      }
    } catch {
      showError("File tidak valid");
    }
    e.target.value = "";
  };

  const handleReset = () => {
    if (confirm("Yakin ingin reset ke bawaan? Semua data kustom hilang.")) {
      resetToDefaults();
      showSuccess("Direset ke bawaan");
      window.location.reload();
    }
  };

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, app: AppType) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ id: app.id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetApp: AppType) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const draggedId = data.id;
      if (draggedId === targetApp.id) return;

      const currentApps = [...apps];
      const draggedIndex = currentApps.findIndex((a) => a.id === draggedId);
      const targetIndex = currentApps.findIndex((a) => a.id === targetApp.id);
      if (draggedIndex === -1 || targetIndex === -1) return;

      const [draggedApp] = currentApps.splice(draggedIndex, 1);
      currentApps.splice(targetIndex, 0, draggedApp);

      const reordered = currentApps.map((a, i) => ({ ...a, sortOrder: i, updatedAt: Date.now() }));
      setApps(reordered);
      setAppsState(reordered);
    } catch {}
  };

  const handleKeyDownReorder = (e: React.KeyboardEvent, app: AppType, direction: "up" | "down") => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if ((direction === "up" && e.key !== "ArrowUp") || (direction === "down" && e.key !== "ArrowDown")) return;

    e.preventDefault();
    const currentApps = [...apps];
    const index = currentApps.findIndex((a) => a.id === app.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentApps.length) return;

    [currentApps[index], currentApps[targetIndex]] = [currentApps[targetIndex], currentApps[index]];
    const reordered = currentApps.map((a, i) => ({ ...a, sortOrder: i, updatedAt: Date.now() }));
    setApps(reordered);
    setAppsState(reordered);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">{settings.dashboardTitle}</h1>
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  id="search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari aplikasi... (/)"
                  className="bg-transparent border-none outline-none text-sm text-foreground placeholder-gray-400 w-64"
                  aria-label="Cari aplikasi"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setCommandPaletteOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Palet perintah (Ctrl+K)">
                <Menu className="w-5 h-5" />
              </button>
              <button onClick={() => setThemeMode(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}>
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Pengaturan">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Keluar">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {greetingText} • {formatDateTime(now)}
              </div>
              <div className="flex items-center gap-2">
                <select value={viewMode} onChange={(e) => setViewModeMode(e.target.value as ViewMode)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="cards">Kartu</option>
                  <option value="list">Daftar</option>
                  <option value="compact">Ringkas</option>
                </select>
                {(viewMode !== "compact") && (
                  <select value={categoryFilter || ""} onChange={(e) => setCategoryFilter(e.target.value || null)} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Semua Kategori</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>{categories.find((c) => c.id === cat)?.name || cat}</option>
                    ))}
                  </select>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Tampilkan tersembunyi
                </label>
              </div>
            </div>
            <button onClick={handleAddApp} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Tambah Aplikasi
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" ref={containerRef}>
        <section aria-labelledby="greeting-heading" className="mb-8">
          <h2 id="greeting-heading" className="text-2xl font-semibold text-foreground mb-2">{greetingText}</h2>
          <p className="text-gray-500 dark:text-gray-400">{formatDateTime(now)}</p>
        </section>

        {quickNotes !== undefined && (
          <section className="mb-8">
            <textarea
              value={quickNotes}
              onChange={(e) => { setQuickNotesState(e.target.value); setQuickNotes(e.target.value); }}
              placeholder="Catatan cepat... (tersimpan otomatis)"
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              aria-label="Catatan cepat"
            />
          </section>
        )}

        {(pinnedApps.length > 0 || recentApps.length > 0 || topApps.length > 0) && (
          <section className="mb-8 space-y-6">
            {pinnedApps.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2"><Pin className="w-5 h-5 text-yellow-500" /> Favorit</h3>
                <div className={viewMode === "list" ? "space-y-2" : viewMode === "compact" ? "space-y-1" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                  {pinnedApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      viewMode={viewMode}
                      isPinned={true}
                      onOpen={handleOpenApp}
                      onEdit={handleEditApp}
                      onTogglePin={handleTogglePin}
                      onToggleHidden={handleToggleHidden}
                      onDelete={handleDeleteApp}
                      onCopyLink={handleCopyLink}
                      onStatusChange={() => {}}
                      status={statuses[app.id] || null}
                      checking={checkingStatus.has(app.id)}
                      openInNewTabDefault={settings.openInNewTab}
                      accentColor={app.accentColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {recentApps.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2"><Clock className="w-5 h-5" /> Terakhir Dibuka</h3>
                <div className={viewMode === "list" ? "space-y-2" : viewMode === "compact" ? "space-y-1" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                  {recentApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      viewMode={viewMode}
                      isPinned={app.isPinned}
                      onOpen={handleOpenApp}
                      onEdit={handleEditApp}
                      onTogglePin={handleTogglePin}
                      onToggleHidden={handleToggleHidden}
                      onDelete={handleDeleteApp}
                      onCopyLink={handleCopyLink}
                      onStatusChange={() => {}}
                      status={statuses[app.id] || null}
                      checking={checkingStatus.has(app.id)}
                      openInNewTabDefault={settings.openInNewTab}
                      accentColor={app.accentColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {topApps.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2"><Zap className="w-5 h-5" /> Paling Sering Dipakai</h3>
                <div className={viewMode === "list" ? "space-y-2" : viewMode === "compact" ? "space-y-1" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                  {topApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      viewMode={viewMode}
                      isPinned={app.isPinned}
                      onOpen={handleOpenApp}
                      onEdit={handleEditApp}
                      onTogglePin={handleTogglePin}
                      onToggleHidden={handleToggleHidden}
                      onDelete={handleDeleteApp}
                      onCopyLink={handleCopyLink}
                      onStatusChange={() => {}}
                      status={statuses[app.id] || null}
                      checking={checkingStatus.has(app.id)}
                      openInNewTabDefault={settings.openInNewTab}
                      accentColor={app.accentColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold text-foreground">Semua Aplikasi</h2>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Tampilkan tersembunyi
              </label>
            </div>
          </div>

          {uniqueCategories.map((catId) => {
            const catApps = unpinnedApps.filter((a) => a.category === catId);
            if (catApps.length === 0) return null;
            const category = categories.find((c) => c.id === catId);
            const isCollapsed = collapsedCategories.has(catId);

            return (
              <div key={catId} className="mb-6">
                <button onClick={() => toggleCategoryCollapse(catId)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                    <span className="font-medium text-foreground capitalize">{category?.name || catId}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({catApps.length})</span>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className={viewMode === "list" ? "space-y-2 mt-3" : viewMode === "compact" ? "space-y-1 mt-3" : "mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                    {catApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, app)}
                        onKeyDown={(e) => {
                          handleKeyDownReorder(e, app, "up");
                          handleKeyDownReorder(e, app, "down");
                        }}
                        tabIndex={0}
                      >
                        <AppCard
                          app={app}
                          viewMode={viewMode}
                          isPinned={app.isPinned}
                          onOpen={handleOpenApp}
                          onEdit={handleEditApp}
                          onTogglePin={handleTogglePin}
                          onToggleHidden={handleToggleHidden}
                          onDelete={handleDeleteApp}
                          onCopyLink={handleCopyLink}
                          onStatusChange={() => {}}
                          status={statuses[app.id] || null}
                          checking={checkingStatus.has(app.id)}
                          openInNewTabDefault={settings.openInNewTab}
                          accentColor={app.accentColor}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={48} />
              <p className="text-lg">Tidak ada aplikasi yang cocok</p>
              <p className="text-sm mt-1">Coba ubah pencarian atau filter kategori</p>
            </div>
          )}
        </section>
      </main>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        apps={apps}
        onOpenApp={handleOpenApp}
        onAddApp={handleAddApp}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        currentTheme={theme}
        onSetTheme={setThemeMode}
        currentViewMode={viewMode}
        onSetViewMode={setViewModeMode}
        currentAccent={accent}
        onSetAccent={setAccentColor}
        categories={uniqueCategories}
      />

      <AppForm
        isOpen={appFormOpen}
        onClose={() => { setAppFormOpen(false); setEditingApp(null); }}
        onSubmit={handleSubmitApp}
        initialData={editingApp}
        categories={categories}
        onAddCategory={handleAddCategory}
      />

      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsSave}
        categories={categories}
        onCategoriesChange={setCategoriesState}
        hiddenBuiltInApps={getHiddenBuiltInApps()}
      />

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bantuan Pintasan</h3>
              <button onClick={() => setHelpOpen(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start"><dt className="font-mono text-blue-600 dark:text-blue-400">Ctrl/Cmd + K</dt><dd>Buka palet perintah</dd></div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start"><dt className="font-mono text-blue-600 dark:text-blue-400">/</dt><dd>Fokus pencarian</dd></div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start"><dt className="font-mono text-blue-600 dark:text-blue-400">?</dt><dd>Buka bantuan ini</dd></div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start"><dt className="font-mono text-blue-600 dark:text-blue-400">Esc</dt><dd>Tutup dialog/palet</dd></div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start"><dt className="font-mono text-blue-600 dark:text-blue-400">Arrow Up/Down</dt><dd>Navigasi palet perintah</dd></div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start"><dt className="font-mono text-blue-600 dark:text-blue-400">Enter</dt><dd>Pilih perintah / Buka aplikasi</dd></div>
              <div className="grid grid-cols-[auto_1fr] gap-2 items-start"><dt className="font-mono text-blue-600 dark:text-blue-400">Tab</dt><dd>Navigasi elemen fokus</dd></div>
            </dl>
          </div>
        </div>
      )}

      {deletingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeletingApp(null)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Hapus Aplikasi</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Yakin hapus <strong>{deletingApp.name}</strong>? Tindakan ini bisa diurungkan selama 5 detik.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingApp(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">Batal</button>
              <button onClick={confirmDeleteApp} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-label="Notifikasi">
        {toasts.map((toast) => {
          const action = toast.action;
          return (
            <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slide-up min-w-[280px] max-w-md ${
              toast.type === "success" ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" :
              toast.type === "error" ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" :
              toast.type === "warning" ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200" :
              "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
            }`}>
              <span className="flex-1 text-sm">{toast.message}</span>
              {action && (
                <button onClick={() => { action.onClick(); removeToast(toast.id); }} className="px-3 py-1 text-sm font-medium bg-current/20 rounded-lg hover:bg-current/30">{action.label}</button>
              )}
              <button onClick={() => removeToast(toast.id)} className="p-1 text-current/60 hover:text-current"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}