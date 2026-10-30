"use client";

import React, { createContext, useContext, useSyncExternalStore, useCallback, useEffect } from "react";
import type { UserSettings } from "@/lib/types";

const defaultSettings: UserSettings = {
  greetingName: "",
  dashboardTitle: "VinDeck",
  theme: "system",
  viewMode: "cards",
  openInNewTab: false,
  openLinksIn: "same-tab",
  statusEnabled: true,
  statusCheckInterval: 60,
  confirmBeforeOpen: true,
  animations: "full",
  backgroundEffects: true,
  profilePhoto: "",
  profileName: "",
  schemaVersion: 4,
};

const SETTINGS_KEY = "vindeck_settings_v2";

let cachedSettings: UserSettings = defaultSettings;
let cachedSettingsKey: string | null = null;

function getStoredSettings(): UserSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored === cachedSettingsKey) return cachedSettings;
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedSettings = { ...defaultSettings, ...parsed };
      cachedSettingsKey = stored;
      return cachedSettings;
    }
  } catch {
  }
  cachedSettings = defaultSettings;
  cachedSettingsKey = null;
  return defaultSettings;
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
    window.addEventListener("vindeck-settings-changed", () => notify());
  }

  return {
    getSnapshot: () => getStoredSettings(),
    getServerSnapshot: () => defaultSettings,
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

export function useSettingsSelector<T>(selector: (settings: UserSettings) => T): T {
  const settings = useSettings();
  return selector(settings);
}

export function useSettingsActions() {
  const setTheme = useCallback((theme: UserSettings["theme"]) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, theme };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setViewMode = useCallback((viewMode: UserSettings["viewMode"]) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, viewMode };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setOpenInNewTab = useCallback((openInNewTab: boolean) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, openInNewTab };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setStatusEnabled = useCallback((statusEnabled: boolean) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, statusEnabled };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setConfirmBeforeOpen = useCallback((confirmBeforeOpen: boolean) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, confirmBeforeOpen };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setAnimations = useCallback((animations: "full" | "reduced") => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, animations };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setBackgroundEffects = useCallback((backgroundEffects: boolean) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, backgroundEffects };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setGreetingName = useCallback((greetingName: string) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, greetingName };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setDashboardTitle = useCallback((dashboardTitle: string) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, dashboardTitle };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setOpenLinksIn = useCallback((openLinksIn: "same-tab" | "new-tab") => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, openLinksIn, openInNewTab: openLinksIn === "new-tab" };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setStatusCheckInterval = useCallback((statusCheckInterval: number) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, statusCheckInterval };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setProfilePhoto = useCallback((profilePhoto: string) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, profilePhoto };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const setProfileName = useCallback((profileName: string) => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const current = stored ? JSON.parse(stored) : {};
      const updated = { ...defaultSettings, ...current, profileName, greetingName: profileName };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      settingsStore.notify();
    } catch {
    }
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings }));
      settingsStore.notify();
    } catch {
    }
  }, []);

  return {
    setTheme,
    setViewMode,
    setOpenInNewTab,
    setOpenLinksIn,
    setStatusEnabled,
    setStatusCheckInterval,
    setConfirmBeforeOpen,
    setAnimations,
    setBackgroundEffects,
    setGreetingName,
    setProfilePhoto,
    setProfileName,
    setDashboardTitle,
    reset,
  };
}

type SettingsActions = ReturnType<typeof useSettingsActions>;
const SettingsContext = createContext<SettingsActions | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const actions = useSettingsActions();
  return (
    <SettingsContext.Provider value={actions}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsStore() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsStore must be used within a SettingsProvider");
  }
  return context;
}