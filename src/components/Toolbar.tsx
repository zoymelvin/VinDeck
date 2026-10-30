"use client";

import React from "react";
import { Grid, List, Layout } from "@/components/icons";
import type { ViewMode, Category } from "@/lib/types";
import { strings } from "@/lib/strings";

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categories: Category[];
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  selectedCategory,
  onSelectCategory,
  categories,
}: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4 pb-1">
      {/* Scrollable Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 flex-1 min-w-0" data-testid="category-chips">
        <button
          onClick={() => onSelectCategory(null)}
          type="button"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
            selectedCategory === null
              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 dark:text-slate-300 border border-slate-200 dark:border-slate-700/30"
          }`}
        >
          All
        </button>

        <button
          onClick={() => onSelectCategory("favorites")}
          type="button"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
            selectedCategory === "favorites"
              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 dark:text-slate-300 border border-slate-200 dark:border-slate-700/30"
          }`}
        >
          ★ Favorites
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              type="button"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 dark:text-slate-300 border border-slate-200 dark:border-slate-700/30"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Right Controls: View Mode & Popover */}
      <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0" data-testid="view-switcher">
        {/* Segmented View Mode Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onViewModeChange("cards")}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              viewMode === "cards"
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            aria-label={strings.common.grid}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{strings.common.grid}</span>
          </button>

          <button
            onClick={() => onViewModeChange("list")}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              viewMode === "list"
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            aria-label={strings.common.list}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{strings.common.list}</span>
          </button>

          <button
            onClick={() => onViewModeChange("compact")}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              viewMode === "compact"
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
            aria-label={strings.common.compact}
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{strings.common.compact}</span>
          </button>
        </div>
      </div>
    </div>
  );
}