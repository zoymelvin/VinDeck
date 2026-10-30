"use client";

import { useCallback, useEffect } from "react";
import type { ThemeMode, ViewMode } from "@/lib/types";
import { useSettingsSelector, useSettingsActions } from "@/hooks/useSettingsStore";

export function useTheme() {
  const theme = useSettingsSelector((s) => s.theme);
  const actions = useSettingsActions();

  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;

    root.classList.add("theme-transition");
    root.setAttribute("data-theme", resolved);
    root.style.colorScheme = resolved;

    const cleanup = () => {
      root.classList.remove("theme-transition");
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const r = mq.matches ? "dark" : "light";
        root.classList.add("theme-transition");
        root.setAttribute("data-theme", r);
        root.style.colorScheme = r;
        setTimeout(cleanup, 350);
      };
      mq.addEventListener("change", handler);
      return () => {
        mq.removeEventListener("change", handler);
        cleanup();
      };
    }

    setTimeout(cleanup, 350);
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    actions.setTheme(mode);
  }, [actions]);

  return { theme, setTheme: setThemeMode };
}

export function useAccentColor() {
  return { accent: "blue" as const, setAccent: () => {} };
}

export function useViewMode() {
  const viewMode = useSettingsSelector((s) => s.viewMode);
  const actions = useSettingsActions();

  const setViewModeCallback = useCallback((mode: ViewMode) => {
    actions.setViewMode(mode);
  }, [actions]);

  return { viewMode, setViewMode: setViewModeCallback };
}