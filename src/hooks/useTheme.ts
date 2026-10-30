"use client";

import { useCallback, useEffect } from "react";
import type { ThemeMode, ViewMode } from "@/lib/types";
import { useSettingsSelector, useSettingsActions } from "@/hooks/useSettingsStore";

export function useTheme() {
  const theme = useSettingsSelector((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const r = mq.matches ? "dark" : "light";
        root.setAttribute("data-theme", r);
        root.style.colorScheme = r;
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    const actions = useSettingsActions();
    actions.setTheme(mode);
  }, []);

  return { theme, setTheme: setThemeMode };
}

export function useAccentColor() {
  return { accent: "blue" as const, setAccent: () => {} };
}

export function useViewMode() {
  const viewMode = useSettingsSelector((s) => s.viewMode);

  const setViewModeCallback = useCallback((mode: ViewMode) => {
    const actions = useSettingsActions();
    actions.setViewMode(mode);
  }, []);

  return { viewMode, setViewMode: setViewModeCallback };
}