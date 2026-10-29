"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";
import type { ThemeMode, AccentColor, ViewMode, UserSettings } from "@/lib/types";

const DEFAULT_SETTINGS: UserSettings = {
  greetingName: "",
  dashboardTitle: "VinDeck",
  theme: "system",
  accentColor: "blue",
  viewMode: "cards",
  openInNewTab: true,
  statusEnabled: true,
  confirmBeforeOpen: true,
  animations: "full",
  backgroundEffects: true,
  schemaVersion: 2,
};

const SETTINGS_KEY = "vindeck_settings";

let cachedSettings: UserSettings = DEFAULT_SETTINGS;
let cachedSettingsKey: string | null = null;

function getStoredSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored === cachedSettingsKey) return cachedSettings;
    if (stored) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      cachedSettingsKey = stored;
      return cachedSettings;
    }
  } catch {
  }
  cachedSettings = DEFAULT_SETTINGS;
  cachedSettingsKey = null;
  return DEFAULT_SETTINGS;
}

function createSettingsStore() {
  const subscribers = new Set<() => void>();

  const notify = () => {
    cachedSettingsKey = null;
    subscribers.forEach((cb) => cb());
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === SETTINGS_KEY) notify();
    });
  }

  return {
    getSnapshot: () => getStoredSettings(),
    getServerSnapshot: () => DEFAULT_SETTINGS,
    subscribe: (callback: () => void) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    notify,
  };
}

const settingsStore = createSettingsStore();

export function useSettings(): UserSettings {
  return useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getServerSnapshot
  );
}

export function useTheme() {
  const settings = useSettings();
  const theme = settings.theme;

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(mode);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") applyTheme("system");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...DEFAULT_SETTINGS, ...current, theme: mode };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  return { theme, setTheme: setThemeMode };
}

export function useAccentColor() {
  const settings = useSettings();
  const accent = settings.accentColor;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", `var(--color-${accent}-500)`);
    document.documentElement.style.setProperty("--accent-hover", `var(--color-${accent}-600)`);
    document.documentElement.style.setProperty("--accent-light", `var(--color-${accent}-100)`);
    document.documentElement.style.setProperty("--accent-dark", `var(--color-${accent}-900)`);
  }, [accent]);

  const setAccentColor = useCallback((color: AccentColor) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...DEFAULT_SETTINGS, ...current, accentColor: color };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  return { accent, setAccent: setAccentColor };
}

export function useViewMode() {
  const settings = useSettings();
  const viewMode = settings.viewMode;

  const setViewModeCallback = useCallback((mode: ViewMode) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...DEFAULT_SETTINGS, ...current, viewMode: mode };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  return { viewMode, setViewMode: setViewModeCallback };
}