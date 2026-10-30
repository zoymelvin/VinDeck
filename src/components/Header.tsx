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
  onlineCount?: number;
  totalApps?: number;
  isStatusChecking?: boolean;
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
  onlineCount = 0,
  totalApps = 0,
  isStatusChecking = false,
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
      {/* Desktop & Tablet Floating Glass Header */}
      <header className="sticky top-3 z-40 px-4 sm:px-6 lg:px-8 max-w-[1760px] mx-auto w-full transition-all duration-300 hidden sm:block">
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
          {/* Left: Profile Photo + Brand */}
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

          {/* Center: Search Pill (Desktop) */}
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
            {/* Notes button */}
            <Link
              href="/notes"
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 transition-all duration-200"
              aria-label="Add app"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add app</span>
            </button>

            {/* Avatar Button */}
            <div className="relative">
              <button
                ref={avatarRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                type="button"
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 transition-all overflow-hidden"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt={profileName || "Profile"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>

              {/* Avatar Menu Popover */}
              {isUserMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-slate-200 dark:border-slate-800">
                    {profilePhoto ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500/40">
                        <img src={profilePhoto} alt={profileName || "Profile"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(profileName || "")}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {profileName || "User"}
                      </p>
                    </div>
                  </div>

                  {/* Theme Segment */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Theme</p>
                    <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                      {(["light", "dark", "system"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => onSetTheme(t)}
                          type="button"
                          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            theme === t
                              ? "bg-indigo-500 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          {t === "light" && <Sun className="w-3.5 h-3.5" />}
                          {t === "dark" && <Moon className="w-3.5 h-3.5" />}
                          {t === "system" && <Settings className="w-3.5 h-3.5" />}
                          <span className="capitalize">{t}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="my-2 border-t border-slate-200 dark:border-slate-800" />

                  {/* Menu Items */}
                  <button
                    onClick={() => { setIsUserMenuOpen(false); onOpenProfile(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onOpenSettings(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onOpenKeyboardShortcuts(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>Keyboard shortcuts</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onExportData(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export data</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onImportData(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import data</span>
                  </button>

                  <div className="my-2 border-t border-slate-200 dark:border-slate-800" />

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onSignOut(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </header>

      {/* Mobile Header & Hero */}
      <div className="sm:hidden">
        {/* Mobile Header Capsule */}
        <header className="sticky top-3 z-40 px-4 max-w-[1760px] mx-auto w-full">
          <div className="relative flex items-center justify-between px-4 rounded-3xl transition-all duration-300 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 shadow-lg">
            {/* Left: Avatar + Brand */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProfile}
                type="button"
                className="flex-shrink-0"
                aria-label="Profile"
              >
                {profilePhoto ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-md shadow-indigo-500/20">
                    <img src={profilePhoto} alt={profileName || "Profile"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                    {getInitials(profileName || "")}
                  </div>
                )}
              </button>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                VinDeck
              </span>
            </div>

            {/* Right: Sync Status */}
            <div className="flex items-center gap-2">
              {isStatusChecking ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 text-xs font-medium text-amber-700 dark:text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Checking…</span>
                </span>
              ) : totalApps > 0 ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${onlineCount === totalApps ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`} />
                  <span>{onlineCount}/{totalApps} online</span>
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {/* Hero Row */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour >= 5 && hour < 12) return "Good morning";
                  if (hour >= 12 && hour < 17) return "Good afternoon";
                  return "Good evening";
                })()}
                {profileName && <span className="text-slate-700 dark:text-slate-300 ml-1">, {profileName}</span>}
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-500 font-medium tabular-nums">
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                {" · "}
                {new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <button
            onClick={onOpenSearch}
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-sm rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 text-slate-600 dark:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            aria-label="Search apps"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="truncate">Search apps…</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 shadow-2xs">
              <span>/</span>
            </div>
          </button>
        </div>

        {/* Category Chips */}
        <div className="px-4 pb-2">
          <Toolbar
            viewMode="cards"
            onViewModeChange={() => {}}
            selectedCategory={null}
            onSelectCategory={() => {}}
            categories={[]}
          />
        </div>
      </div>

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