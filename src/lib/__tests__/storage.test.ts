import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { App, Category, UserSettings, ExportData } from "@/lib/types";
import { BUILT_IN_APPS, BUILT_IN_CATEGORIES } from "@/lib/defaults";
import { DEFAULT_SETTINGS } from "@/lib/types";

const mockLocalStorage: Record<string, string> = {};

const setupMockStorage = () => {
  Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
  });
};

async function getStorage() {
  return await import("@/lib/storage");
}

describe("storage", () => {
  beforeEach(() => {
    setupMockStorage();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns built-in apps when storage empty", async () => {
    const { getApps } = await getStorage();
    const apps = getApps();
    expect(apps.length).toBe(BUILT_IN_APPS.length);
    expect(apps[0].id).toBe("immich");
  });

  it("returns built-in categories when storage empty", async () => {
    const { getCategories } = await getStorage();
    const cats = getCategories();
    expect(cats.length).toBe(BUILT_IN_CATEGORIES.length);
    expect(cats[0].id).toBe("media");
  });

  it("returns default settings when storage empty", async () => {
    const { getSettings, getSchemaVersion } = await getStorage();
    const settings = getSettings();
    if (!settings) {
      throw new Error("getSettings returned undefined");
    }
    expect(settings.greetingName).toBe(DEFAULT_SETTINGS.greetingName);
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it("persists and retrieves apps", async () => {
    const { setApps, getApps } = await getStorage();
    const customApps: App[] = [
      { id: "custom-1", name: "Custom", description: "", url: "https://custom.com", icon: "🔗", iconType: "emoji", accentColor: "blue", category: "media", tags: [], isBuiltIn: false, isHidden: false, isPinned: false, statusEnabled: true, sortOrder: 0, clickCount: 0, lastOpened: null, createdAt: Date.now(), updatedAt: Date.now() },
    ];
    setApps(customApps);
    const apps = getApps();
    expect(apps.length).toBe(BUILT_IN_APPS.length + 1);
    expect(apps.find((a) => a.id === "custom-1")).toBeDefined();
  });

  it("merges built-in with custom on migration", async () => {
    const { getApps, setApps } = await getStorage();
    const existingApps: App[] = [
      { id: "custom-1", name: "Custom", description: "", url: "https://custom.com", icon: "🔗", iconType: "emoji", accentColor: "blue", category: "media", tags: [], isBuiltIn: false, isHidden: false, isPinned: false, statusEnabled: true, sortOrder: 10, clickCount: 0, lastOpened: null, createdAt: Date.now(), updatedAt: Date.now() },
    ];
    localStorage.setItem("vindeck_apps", JSON.stringify(existingApps));
    localStorage.setItem("vindeck_schema_version", "0");

    const apps = getApps();
    expect(apps.length).toBe(BUILT_IN_APPS.length + 1);
    expect(apps.find((a) => a.id === "custom-1")).toBeDefined();
    expect(apps.find((a) => a.id === "immich")).toBeDefined();
  });

  it("preserves hidden state of built-in apps", async () => {
    const { getApps } = await getStorage();
    const existingApps: App[] = BUILT_IN_APPS.map((a) => ({ ...a, isHidden: a.id === "immich" }));
    localStorage.setItem("vindeck_apps", JSON.stringify(existingApps));
    localStorage.setItem("vindeck_schema_version", "0");

    const apps = getApps();
    const immich = apps.find((a) => a.id === "immich");
    expect(immich?.isHidden).toBe(true);
  });

  it("records click and updates app", async () => {
    const { getApps, recordClick, getClickTracking } = await getStorage();
    const apps = getApps();
    const app = apps[0];
    recordClick(app.id);

    const clicks = getClickTracking();
    expect(clicks[app.id].count).toBe(1);
    expect(clicks[app.id].lastOpened).toBeGreaterThan(0);

    const updatedApps = getApps();
    const updatedApp = updatedApps.find((a) => a.id === app.id);
    expect(updatedApp?.clickCount).toBe(1);
  });

  it("exports all data", async () => {
    const { exportAllData } = await getStorage();
    const data = exportAllData();
    expect(data.apps).toBeDefined();
    expect(data.categories).toBeDefined();
    expect(data.settings).toBeDefined();
    expect(data.schemaVersion).toBe(4);
    expect(data.exportedAt).toBeGreaterThan(0);
  });

  it("imports valid data", async () => {
    const { importAllData, getApps, getSettings } = await getStorage();
    const exportData: ExportData = {
      apps: [
        { id: "imported-1", name: "Imported", description: "", url: "https://imported.com", icon: "🔗", iconType: "emoji", accentColor: "blue", category: "media", tags: [], isBuiltIn: false, isHidden: false, isPinned: false, statusEnabled: true, sortOrder: 0, clickCount: 0, lastOpened: null, createdAt: Date.now(), updatedAt: Date.now() },
      ],
      categories: [{ id: "custom-cat", name: "Custom", isBuiltIn: false, sortOrder: 10 }],
      settings: { ...DEFAULT_SETTINGS, greetingName: "Imported User" },
      quickNotes: "Imported notes",
      exportedAt: Date.now(),
      schemaVersion: 4,
    };

    const result = importAllData(exportData);
    expect(result.success).toBe(true);

    const apps = getApps();
    expect(apps.find((a) => a.id === "imported-1")).toBeDefined();

    const settings = getSettings();
    expect(settings.greetingName).toBe("Imported User");
  });

  it("rejects invalid import data", async () => {
    const { importAllData } = await getStorage();
    const result = importAllData({} as ExportData);
    expect(result.success).toBe(false);
  });

  it("rejects wrong schema version", async () => {
    const { importAllData } = await getStorage();
    const exportData: ExportData = {
      apps: [],
      categories: [],
      settings: DEFAULT_SETTINGS,
      quickNotes: "",
      exportedAt: Date.now(),
      schemaVersion: 999,
    };
    const result = importAllData(exportData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Schema version not supported");
  });

  it("rejects invalid URL in import", async () => {
    const { importAllData } = await getStorage();
    const exportData: ExportData = {
      apps: [
        { id: "bad", name: "Bad", description: "", url: "javascript:alert(1)", icon: "🔗", iconType: "emoji", accentColor: "blue", category: "media", tags: [], isBuiltIn: false, isHidden: false, isPinned: false, statusEnabled: true, sortOrder: 0, clickCount: 0, lastOpened: null, createdAt: Date.now(), updatedAt: Date.now() },
      ],
      categories: [],
      settings: DEFAULT_SETTINGS,
      quickNotes: "",
      exportedAt: Date.now(),
      schemaVersion: 4,
    };
    const result = importAllData(exportData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid URL");
  });

  it("resets to defaults", async () => {
    const { setApps, resetToDefaults, getApps } = await getStorage();
    setApps([{ id: "custom", name: "Custom", description: "", url: "https://custom.com", icon: "🔗", iconType: "emoji", accentColor: "blue", category: "media", tags: [], isBuiltIn: false, isHidden: false, isPinned: false, statusEnabled: true, sortOrder: 0, clickCount: 0, lastOpened: null, createdAt: Date.now(), updatedAt: Date.now() }]);
    resetToDefaults();

    const apps = getApps();
    expect(apps.length).toBe(BUILT_IN_APPS.length);
    expect(apps.find((a) => a.id === "custom")).toBeUndefined();
  });
});