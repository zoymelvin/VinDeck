"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import {
  Search,
  Plus,
  Sun,
  Moon,
  Settings,
  LogOut,
  FileText,
  Home,
  User,
  X,
  Menu,
} from "@/components/icons";
import { useTheme } from "@/hooks/useTheme";
import { strings } from "@/lib/strings";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAddApp: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

export function Header({
  onOpenSearch,
  onOpenAddApp,
  onOpenSettings,
  onSignOut,
  searchQuery = "",
  setSearchQuery,
}: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <>
      {/* Desktop & Tablet Floating Glass Header */}
      <header className="sticky top-3 z-40 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`relative flex items-center justify-between px-4 sm:px-6 rounded-3xl transition-all duration-300 ${
            isScrolled
              ? "h-14 bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/80 backdrop-blur-2xl border border-slate-700/50 light:border-slate-200/80 shadow-lg shadow-indigo-500/5"
              : "h-16 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white/70 backdrop-blur-xl border border-slate-800/40 light:border-slate-200/60 shadow-md"
          }`}
        >
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl p-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                </div>
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 dark:from-white dark:to-slate-300 light:from-slate-900 light:to-slate-700 bg-clip-text text-transparent">
                VinDeck
              </span>
            </Link>
          </div>

          {/* Center: Search Pill (Desktop) */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-6">
            <button
              onClick={onOpenSearch}
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 text-sm rounded-2xl bg-slate-800/40 light:bg-slate-100/80 hover:bg-slate-800/70 light:hover:bg-slate-200/80 border border-slate-700/40 light:border-slate-300/60 text-slate-400 light:text-slate-600 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              aria-label={strings.common.searchPlaceholder}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span className="truncate">{strings.common.searchPlaceholder}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-900/60 light:bg-white text-slate-400 light:text-slate-500 border border-slate-700/50 light:border-slate-200 shadow-2xs">
                <span>/</span>
                <span>or</span>
                <span>⌘K</span>
              </div>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notes button */}
            <Link
              href="/notes"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname.startsWith("/notes")
                  ? "bg-indigo-500/15 text-indigo-400 dark:text-indigo-300 light:bg-indigo-50 light:text-indigo-600 border border-indigo-500/30"
                  : "text-slate-300 light:text-slate-700 hover:bg-slate-800/60 light:hover:bg-slate-100"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all duration-200"
              aria-label={strings.common.add}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{strings.common.add}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 light:hover:text-slate-800 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
              aria-label={strings.common.settings}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Avatar & Sign Out Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                type="button"
                className="w-9 h-9 rounded-xl bg-slate-800 light:bg-slate-200 border border-slate-700/50 light:border-slate-300 flex items-center justify-center text-slate-300 light:text-slate-700 hover:border-indigo-500/50 transition-all"
                aria-label="User menu"
              >
                <User className="w-4 h-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 light:text-rose-600 hover:bg-rose-500/10 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{strings.common.logout}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile Floating Bottom Dock (< 640px) */}
      <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/90 backdrop-blur-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-3xl shadow-2xl p-2 flex items-center justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
              pathname === "/" ? "text-indigo-400 light:text-indigo-600" : "text-slate-400 light:text-slate-600"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          <button
            onClick={onOpenSearch}
            type="button"
            className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400 light:text-slate-600"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* Prominent Center Add Button */}
          <button
            onClick={onOpenAddApp}
            type="button"
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-90 transition-transform -mt-5 border-2 border-slate-950 light:border-white"
            aria-label="Add app"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          <Link
            href="/notes"
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${
              pathname.startsWith("/notes") ? "text-indigo-400 light:text-indigo-600" : "text-slate-400 light:text-slate-600"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Notes</span>
          </Link>

          <button
            onClick={onOpenSettings}
            type="button"
            className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400 light:text-slate-600"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
}