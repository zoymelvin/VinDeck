"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp, RotateCcw } from "@/components/icons";
import { AppIcon } from "@/components/AppIcon";
import type { App as AppType, Category, AccentColor } from "@/lib/types";
import { ACCENT_COLORS } from "@/lib/types";

interface AppFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (app: Partial<AppType> & { id?: string }) => void;
  initialData?: AppType | null;
  categories: Category[];
  onAddCategory: (name: string) => void;
}

export default function AppForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  onAddCategory,
}: AppFormProps) {
  const getInitialState = () => {
    if (initialData) {
      return {
        name: initialData.name,
        description: initialData.description || "",
        url: initialData.url,
        iconUrl: initialData.iconSrc || "",
        accentColor: initialData.accentColor,
        category: initialData.category,
        tags: initialData.tags || [],
        iconStatus: (initialData.iconSrc ? "valid" : "idle") as "idle" | "loading" | "valid" | "error",
      };
    }
    return {
      name: "",
      description: "",
      url: "",
      iconUrl: "",
      accentColor: "blue" as AccentColor,
      category: categories[0]?.id || "media",
      tags: [] as string[],
      iconStatus: "idle" as "idle" | "loading" | "valid" | "error",
    };
  };

  const initial = getInitialState();

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [url, setUrl] = useState(initial.url);
  const [iconUrl, setIconUrl] = useState(initial.iconUrl);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [category, setCategory] = useState(initial.category);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [tags, setTags] = useState(initial.tags);
  const [tagInput, setTagInput] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [iconStatus, setIconStatus] = useState(initial.iconStatus);
  const [iconError, setIconError] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, []);

  // Validate Icon URL
  useEffect(() => {
    const trimmed = iconUrl.trim();
    if (!trimmed) {
      // Use setTimeout to avoid synchronous setState
      const id = setTimeout(() => {
        setIconStatus("idle");
        setIconError("");
      }, 0);
      return () => clearTimeout(id);
    }

    // Must be https: (reject http, data, javascript, file)
    if (!trimmed.startsWith("https://")) {
      const id = setTimeout(() => {
        setIconStatus("error");
        setIconError("Icon URL must start with https://");
      }, 0);
      return () => clearTimeout(id);
    }

    // If it's a local icon from /icons/, it's valid
    if (trimmed.startsWith("/icons/")) {
      const id = setTimeout(() => {
        setIconStatus("valid");
        setIconError("");
      }, 0);
      return () => clearTimeout(id);
    }

    const id = setTimeout(() => setIconStatus("loading"), 0);
    const img = new Image();
    const timeout = setTimeout(() => {
      img.src = "";
      setIconStatus("error");
      setIconError("Couldn't load this image (timeout).");
    }, 8000);

    img.onload = () => {
      clearTimeout(timeout);
      setIconStatus("valid");
      setIconError("");
    };

    img.onerror = () => {
      clearTimeout(timeout);
      setIconStatus("error");
      setIconError("Couldn't load this image");
    };

    img.src = trimmed;

    return () => {
      clearTimeout(id);
      clearTimeout(timeout);
    };
  }, [iconUrl]);

  if (!isOpen) return null;

  const validateUrl = (val: string): boolean => {
    try {
      const parsed = new URL(val);
      if (parsed.protocol === "https:") return true;
      if (parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) return true;
      return false;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!url.trim()) {
      newErrors.url = "URL is required";
    } else if (!validateUrl(url)) {
      newErrors.url = "URL must use https:// (or http:// for localhost)";
    }

    const effectiveCategory = showNewCategory ? newCategory.trim() : category;
    if (!effectiveCategory) {
      newErrors.category = "Category is required";
    }

    if (iconStatus === "error") {
      newErrors.icon = "Invalid icon URL";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (showNewCategory && newCategory.trim()) {
      onAddCategory(newCategory.trim());
    }

    const isBuiltIn = initialData?.isBuiltIn ?? false;
    const isCustomized = isBuiltIn && iconUrl !== (initialData?.iconSrc || "");

    onSubmit({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      icon: "",
      iconType: iconUrl ? "url" : "image",
      iconSrc: iconUrl.trim() || undefined,
      iconCustomized: isCustomized ? true : initialData?.iconCustomized,
      accentColor,
      category: effectiveCategory.toLowerCase().replace(/\s+/g, "-"),
      tags,
    });
  };

  const handleResetDefaultIcon = () => {
    if (initialData?.isBuiltIn) {
      setIconUrl(`/icons/${initialData.id}.png`);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const isSaveDisabled = iconStatus === "loading" || iconStatus === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-form-title"
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl backdrop-blur-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 light:border-slate-200">
          <h2 id="app-form-title" className="text-lg font-bold text-slate-100 light:text-slate-900">
            {initialData ? "Edit App" : "Add App"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="app-name" className="block text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider mb-1.5">
              Name *
            </label>
            <input
              ref={firstInputRef}
              id="app-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="App name"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-sm text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="app-desc" className="block text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider mb-1.5">
              Description (optional)
            </label>
            <input
              id="app-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-sm text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* URL Field */}
          <div>
            <label htmlFor="app-url" className="block text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider mb-1.5">
              URL *
            </label>
            <input
              id="app-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-sm text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-xs"
            />
            {errors.url && <p className="text-xs text-rose-400 mt-1">{errors.url}</p>}
          </div>

          {/* Icon URL Field with Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="app-icon" className="block text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider">
                Icon URL (optional)
              </label>
              {initialData?.isBuiltIn && (
                <button
                  type="button"
                  onClick={handleResetDefaultIcon}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to default icon</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  id="app-icon"
                  type="text"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-xs text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>
              {/* 56px Live Preview */}
              <div className="w-14 h-14 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <AppIcon
                  icon=""
                  iconType={iconUrl ? "url" : "brand"}
                  iconSrc={iconUrl || undefined}
                  name={name || "App"}
                  className="w-10 h-10"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Paste a link to a PNG, JPG, WEBP or SVG image. Tip: dashboardicons.com has logos for most self-hosted apps.
            </p>
            {iconStatus === "loading" && <p className="text-xs text-amber-400 mt-1 font-medium">Checking image…</p>}
            {iconStatus === "error" && <p className="text-xs text-rose-400 mt-1 font-medium">{iconError}</p>}
          </div>

          {/* Accent Color Selection (6 swatches) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-2.5">
              {ACCENT_COLORS.map((ac) => (
                <button
                  key={ac.value}
                  type="button"
                  onClick={() => setAccentColor(ac.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    accentColor === ac.value ? "border-white light:border-slate-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: `var(${ac.cssVar})` }}
                  aria-label={ac.label}
                />
              ))}
            </div>
          </div>

          {/* Category Combobox */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 light:text-slate-600 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            {!showNewCategory ? (
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewCategory(true);
                      setNewCategory("");
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-sm text-slate-200 light:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__new__">+ Create new category…</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-sm text-slate-200 light:text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
            {errors.category && <p className="text-xs text-rose-400 mt-1">{errors.category}</p>}
          </div>

          {/* Collapsible More Options (Tags) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showMoreOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showMoreOptions ? "Less options" : "More options (Tags)"}</span>
            </button>

            {showMoreOptions && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-950/40 light:bg-slate-100 border border-slate-800 light:border-slate-300 space-y-2">
                <label className="block text-xs font-semibold text-slate-400 light:text-slate-600">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 text-xs text-slate-200 light:text-slate-800 placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-slate-800 light:border-slate-200 flex items-center justify-end gap-3 bg-slate-900/95 light:bg-white/95">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-300 light:text-slate-700 bg-slate-800/50 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaveDisabled}
            type="button"
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            {initialData ? "Save Changes" : "Add App"}
          </button>
        </div>
      </div>
    </div>
  );
}