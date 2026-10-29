"use client";

import React, { useState } from "react";
import { Grid, List, Layout, Filter, Eye } from "@/components/icons";
import type { ViewMode, Category } from "@/lib/types";
import { strings } from "@/lib/strings";

interface ToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categories: Category[];
  showHiddenApps: boolean;
  onToggleShowHiddenApps: (show: boolean) => void;
}

export function Toolbar({
  viewMode,
  onViewModeChange,
  selectedCategory,
  onSelectCategory,
  categories,
  showHiddenApps,
  onToggleShowHiddenApps,
}: ToolbarProps) {
  const [isViewPopoverOpen, setIsViewPopoverOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-2">
      {/* Scrollable Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 flex-1 min-w-0">
        <button
          onClick={() => onSelectCategory(null)}
          type="button"
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
            selectedCategory === null
              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
              : "bg-slate-800/40 light:bg-slate-200/60 hover:bg-slate-800/80 text-slate-300 light:text-slate-700 border border-slate-700/30 light:border-slate-300/40"
          }`}
        >
          All categories
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
                  : "bg-slate-800/40 light:bg-slate-200/60 hover:bg-slate-800/80 text-slate-300 light:text-slate-700 border border-slate-700/30 light:border-slate-300/40"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Right Controls: View Mode & Popover */}
      <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
        {/* Segmented View Mode Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900/80 light:bg-slate-200/80 border border-slate-800 dark:border-slate-800 light:border-slate-300">
          <button
            onClick={() => onViewModeChange("cards")}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              viewMode === "cards"
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-slate-400 light:text-slate-600 hover:text-slate-200"
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
                : "text-slate-400 light:text-slate-600 hover:text-slate-200"
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
                : "text-slate-400 light:text-slate-600 hover:text-slate-200"
            }`}
            aria-label={strings.common.compact}
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{strings.common.compact}</span>
          </button>
        </div>

        {/* View Popover / Toggle Button */}
        <div className="relative">
          <button
            onClick={() => setIsViewPopoverOpen(!isViewPopoverOpen)}
            type="button"
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold border transition-all ${
              showHiddenApps
                ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                : "bg-slate-900/80 light:bg-slate-200/80 text-slate-300 light:text-slate-700 border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-slate-700"
            }`}
            aria-label="View options"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{strings.home.toolbar.view}</span>
          </button>

          {isViewPopoverOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl backdrop-blur-xl p-3 z-30 animate-in fade-in zoom-in-95 duration-150">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-200 light:text-slate-800">
                  {strings.home.toolbar.showHidden}
                </span>
                <input
                  type="checkbox"
                  checked={showHiddenApps}
                  onChange={(e) => onToggleShowHiddenApps(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-700"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}