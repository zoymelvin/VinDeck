"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Search,
  Plus,
  FileText,
  Home,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Keyboard,
  Download,
  Upload,
  ArrowLeft,
  RotateCcw,
  Wifi,
} from "@/components/icons";
import { Toolbar } from "@/components/Toolbar";
import { strings } from "@/lib/strings";
import type { ViewMode, Category } from "@/lib/types";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAddApp: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onOpenProfile: () => void;
  onOpenKeyboardShortcuts: () => void;
  onExportData: () => void;
  onImportData: () => void;
  profilePhoto?: string;
  profileName?: string;
  theme: "light" | "dark" | "system";
  onSetTheme: (theme: "light" | "dark" | "system") => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  viewMode?: ViewMode;
  categories?: Category[];
  onViewModeChange?: (mode: ViewMode) => void;
  onSelectCategory?: (category: string | null) => void;
}

export function Header({
  onOpenSearch,
  onOpenAddApp,
  onOpenSettings,
  onSignOut,
  onOpenProfile,
  onOpenKeyboardShortcuts,
  onExportData,
  onImportData,
  profilePhoto,
  profileName,
  theme,
  onSetTheme,
  searchQuery,
  setSearchQuery,
  viewMode = "cards",
  categories = [],
  onViewModeChange = () => {},
  onSelectCategory = () => {},
}: HeaderProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isUserMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node) && avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isUserMenuOpen) {
        setIsUserMenuOpen(false);
        avatarRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUserMenuOpen]);

  const getInitials = (name: string) => {
    if (!name) return "V";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header data-testid="app-header" className="w-full">
      {/* Sticky Capsule */}
      <div className="sticky top-3 z-40 px-4 sm:px-6 lg:px-8 max-w-[1760px] mx-auto w-full transition-all duration-300">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`relative flex items-center justify-between px-4 sm:px-6 rounded-3xl transition-all duration-300 ${
            isScrolled
              ? "h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 shadow-lg"
              : "h-16 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/40 shadow-md"
          }`}
        >
          {/* Left: Profile Photo/Monogram + Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
              {profilePhoto ? (
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <img src={profilePhoto} alt={profileName || "Profile"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  {getInitials(profileName || "")}
                </div>
              )}
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                VinDeck
              </span>
            </Link>
          </div>

          {/* Center: Search Pill (Desktop md+) */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-6">
            <button
              onClick={onOpenSearch}
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 text-sm rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-700/40 text-slate-600 dark:text-slate-400 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              aria-label="Search apps"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="truncate">Search apps…</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 shadow-2xs">
                <span>/</span>
                <span>or</span>
                <span>⌘K</span>
              </div>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Icon */}
            <button
              onClick={onOpenSearch}
              type="button"
              className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notes button */}
            <Link
              href="/notes"
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname.startsWith("/notes")
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
              }`}
              aria-label="Notes"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </Link>

            {/* Add App Button */}
            <button
              onClick={onOpenAddApp}
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all duration-200"
              aria-label="Add app"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add app</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              type="button"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 transition-all"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Hero Row */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1760px] mx-auto w-full pt-4 pb-3 sm:pt-5 sm:pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return "Good morning";
                if (hour >= 12 && hour < 17) return "Good afternoon";
                return "Good evening";
              })()}
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-500 font-medium tabular-nums">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              {" · "}
              {new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          </div>
        </div>
      </div>

      {/* Category Chips + View Switcher */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1760px] mx-auto w-full pb-1" data-testid="category-chips">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          selectedCategory={null}
          onSelectCategory={onSelectCategory}
          categories={categories}
        />
      </div>
    </header>

    {/* Mobile Floating Bottom Dock */}
    <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-2 flex items-center justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
              pathname === "/" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <button
            onClick={onOpenSearch}
            type="button"
            className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-600 dark:text-slate-400"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* Prominent Center Add Button */}
          <button
            onClick={onOpenAddApp}
            type="button"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-90 transition-transform -mt-5 border-2 border-white dark:border-slate-950"
            aria-label="Add app"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          <Link
            href="/notes"
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
              pathname.startsWith("/notes") ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Notes</span>
          </Link>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            type="button"
            className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-600 dark:text-slate-400"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
}

function getInitials(name: string) {
  if (!name) return "V";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default Header;