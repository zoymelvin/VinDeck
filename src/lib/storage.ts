import type { App, Category, UserSettings, ExportData, ClickTracking } from "./types";
import { DEFAULT_SETTINGS, BUILT_IN_CATEGORIES } from "./types";
import { BUILT_IN_APPS } from "./defaults";
import { isValidUrl } from "./validation";

const STORAGE_KEYS = {
  apps: "vindeck_apps",
  categories: "vindeck_categories",
  settings: "vindeck_settings",
  clickTracking: "vindeck_clicks",
  quickNotes: "vindeck_notes",
  schemaVersion: "vindeck_schema_version",
} as const;

const CURRENT_SCHEMA_VERSION = 3;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window !== "undefined" && typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage?.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window !== "undefined" && typeof localStorage === "undefined") return;
  try {
    localStorage?.setItem(key, JSON.stringify(value));
  } catch {
  }
}

function safeRemove(key: string): void {
  if (typeof window !== "undefined" && typeof localStorage === "undefined") return;
  try {
    localStorage?.removeItem(key);
  } catch {
  }
}

export function getSchemaVersion(): number {
  return safeGet(STORAGE_KEYS.schemaVersion, 0);
}

export function setSchemaVersion(version: number): void {
  safeSet(STORAGE_KEYS.schemaVersion, version);
}

export function migrateIfNeeded(): void {
  const currentVersion = getSchemaVersion();
  if (currentVersion === CURRENT_SCHEMA_VERSION) return;

  if (currentVersion === 0) {
    const existingApps = safeGet<App[]>(STORAGE_KEYS.apps, []);
    const existingCategories = safeGet<Category[]>(STORAGE_KEYS.categories, []);
    const existingSettings = safeGet<UserSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    const existingClicks = safeGet<ClickTracking>(STORAGE_KEYS.clickTracking, {});
    const existingNotes = safeGet<string>(STORAGE_KEYS.quickNotes, "");

    const mergedApps = mergeApps(BUILT_IN_APPS, existingApps);
    const mergedCategories = mergeCategories(BUILT_IN_CATEGORIES, existingCategories);
    const mergedSettings = { ...DEFAULT_SETTINGS, ...existingSettings, schemaVersion: CURRENT_SCHEMA_VERSION };

    safeSet(STORAGE_KEYS.apps, mergedApps);
    safeSet(STORAGE_KEYS.categories, mergedCategories);
    safeSet(STORAGE_KEYS.settings, mergedSettings);
    safeSet(STORAGE_KEYS.clickTracking, existingClicks);
    safeSet(STORAGE_KEYS.quickNotes, existingNotes);
    setSchemaVersion(CURRENT_SCHEMA_VERSION);
  } else if (currentVersion === 1 || currentVersion === 2) {
    // Migrate from v1/v2 to v3: update built-in apps with PNG icons and English descriptions
    const existingApps = safeGet<App[]>(STORAGE_KEYS.apps, []);
    const existingCategories = safeGet<Category[]>(STORAGE_KEYS.categories, []);
    const existingSettings = safeGet<UserSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);

    const mergedApps = mergeAppsV3(existingApps);
    const mergedCategories = migrateCategoriesV3(existingCategories);
    const mergedSettings = { ...DEFAULT_SETTINGS, ...existingSettings, schemaVersion: CURRENT_SCHEMA_VERSION };

    safeSet(STORAGE_KEYS.apps, mergedApps);
    safeSet(STORAGE_KEYS.categories, mergedCategories);
    safeSet(STORAGE_KEYS.settings, mergedSettings);
    setSchemaVersion(CURRENT_SCHEMA_VERSION);
  }
}

function mergeAppsV3(existing: App[]): App[] {
  const builtInMap = new Map(BUILT_IN_APPS.map((a) => [a.id, a]));
  const result: App[] = [];

  for (const app of existing) {
    const builtIn = builtInMap.get(app.id);
    if (builtIn && !app.iconCustomized) {
      // Migrate built-in app: update icon and description if not customized
      result.push({
        ...builtIn,
        isHidden: app.isHidden,
        isPinned: app.isPinned,
        statusEnabled: app.statusEnabled,
        sortOrder: app.sortOrder,
        clickCount: app.clickCount,
        lastOpened: app.lastOpened,
        createdAt: app.createdAt,
        updatedAt: Date.now(),
      });
    } else {
      result.push(app);
    }
  }

  // Add any new built-in apps
  for (const builtIn of BUILT_IN_APPS) {
    if (!existing.some((a) => a.id === builtIn.id)) {
      result.push(builtIn);
    }
  }

  return result;
}

function migrateCategoriesV3(existing: Category[]): Category[] {
  const categoryMap: Record<string, string> = {
    "Keamanan": "Security",
    "Sistem": "System",
    "File": "Files",
  };
  return existing.map((cat) => ({
    ...cat,
    name: categoryMap[cat.name] || cat.name,
  }));
}

function mergeApps(builtIn: App[], existing: App[]): App[] {
  const builtInMap = new Map(builtIn.map((a) => [a.id, a]));
  const existingMap = new Map(existing.map((a) => [a.id, a]));

  const result: App[] = [];

  for (const app of builtIn) {
    const existingApp = existingMap.get(app.id);
    if (existingApp) {
      result.push({
        ...app,
        isHidden: existingApp.isHidden ?? false,
        isPinned: existingApp.isPinned ?? app.isPinned,
        sortOrder: existingApp.sortOrder ?? app.sortOrder,
        clickCount: existingApp.clickCount ?? 0,
        lastOpened: existingApp.lastOpened ?? null,
        updatedAt: existingApp.updatedAt ?? Date.now(),
      });
    } else {
      result.push(app);
    }
  }

  for (const app of existing) {
    if (!builtInMap.has(app.id)) {
      result.push(app);
    }
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

function mergeCategories(builtIn: Category[], existing: Category[]): Category[] {
  const builtInMap = new Map(builtIn.map((c) => [c.id, c]));
  const existingMap = new Map(existing.map((c) => [c.id, c]));

  const result: Category[] = [];

  for (const cat of builtIn) {
    const existingCat = existingMap.get(cat.id);
    if (existingCat) {
      result.push({ ...cat, sortOrder: existingCat.sortOrder ?? cat.sortOrder });
    } else {
      result.push(cat);
    }
  }

  for (const cat of existing) {
    if (!builtInMap.has(cat.id)) {
      result.push(cat);
    }
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getApps(): App[] {
  migrateIfNeeded();
  return safeGet<App[]>(STORAGE_KEYS.apps, BUILT_IN_APPS);
}

export function setApps(apps: App[]): void {
  safeSet(STORAGE_KEYS.apps, apps);
}

export function getCategories(): Category[] {
  migrateIfNeeded();
  return safeGet<Category[]>(STORAGE_KEYS.categories, BUILT_IN_CATEGORIES);
}

export function setCategories(categories: Category[]): void {
  safeSet(STORAGE_KEYS.categories, categories);
}

export function getSettings(): UserSettings {
  migrateIfNeeded();
  return safeGet<UserSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function setSettings(settings: UserSettings): void {
  safeSet(STORAGE_KEYS.settings, { ...settings, schemaVersion: CURRENT_SCHEMA_VERSION });
}

export function getClickTracking(): ClickTracking {
  return safeGet<ClickTracking>(STORAGE_KEYS.clickTracking, {});
}

export function setClickTracking(clicks: ClickTracking): void {
  safeSet(STORAGE_KEYS.clickTracking, clicks);
}

export function recordClick(appId: string): void {
  const clicks = getClickTracking();
  const now = Date.now();
  clicks[appId] = { count: (clicks[appId]?.count ?? 0) + 1, lastOpened: now };
  setClickTracking(clicks);

  const apps = getApps();
  const appIndex = apps.findIndex((a) => a.id === appId);
  if (appIndex !== -1) {
    apps[appIndex] = { ...apps[appIndex], clickCount: clicks[appId].count, lastOpened: now, updatedAt: now };
    setApps(apps);
  }
}

export function getQuickNotes(): string {
  return safeGet<string>(STORAGE_KEYS.quickNotes, "");
}

export function setQuickNotes(notes: string): void {
  safeSet(STORAGE_KEYS.quickNotes, notes);
}

export function exportAllData(): ExportData {
  return {
    apps: getApps(),
    categories: getCategories(),
    settings: getSettings(),
    quickNotes: getQuickNotes(),
    exportedAt: Date.now(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export function importAllData(data: ExportData): { success: boolean; error?: string } {
  try {
    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid data" };
    }
    if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return { success: false, error: `Schema version not supported: ${data.schemaVersion}` };
    }
    if (!Array.isArray(data.apps) || !Array.isArray(data.categories) || !data.settings) {
      return { success: false, error: "Incomplete data structure" };
    }

    for (const app of data.apps) {
      if (!app.id || !app.name || !app.url) {
        return { success: false, error: "Invalid app: required fields missing" };
      }
      if (!isValidUrl(app.url)) {
        return { success: false, error: `Invalid URL: ${app.url}` };
      }
    }

    setApps(data.apps);
    setCategories(data.categories);
    setSettings({ ...data.settings, schemaVersion: CURRENT_SCHEMA_VERSION });
    setQuickNotes(data.quickNotes ?? "");
    setClickTracking({});
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to process import" };
  }
}

export function resetToDefaults(): void {
  safeSet(STORAGE_KEYS.apps, BUILT_IN_APPS);
  safeSet(STORAGE_KEYS.categories, BUILT_IN_CATEGORIES);
  safeSet(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  safeSet(STORAGE_KEYS.clickTracking, {});
  safeSet(STORAGE_KEYS.quickNotes, "");
  setSchemaVersion(CURRENT_SCHEMA_VERSION);
}

export function getHiddenBuiltInApps(): string[] {
  const apps = getApps();
  return apps.filter((a) => a.isBuiltIn && a.isHidden).map((a) => a.id);
}

export function restoreBuiltInApp(appId: string): void {
  const apps = getApps();
  const updated = apps.map((a) => (a.id === appId ? { ...a, isHidden: false, updatedAt: Date.now() } : a));
  setApps(updated);
}

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}