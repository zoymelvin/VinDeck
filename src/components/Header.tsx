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
  Palette,
  Keyboard,
  Download,
  Upload,
  X,
} from "@/components/icons";
import { useTheme } from "@/hooks/useTheme";
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
  accentColor: string;
  onSetAccentColor: (color: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
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
  accentColor,
  onSetAccentColor,
  searchQuery = "",
  setSearchQuery,
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

  const accentColors = [
    { value: "blue", color: "#3b82f6" },
    { value: "indigo", color: "#6366f1" },
    { value: "violet", color: "#8b5cf6" },
    { value: "pink", color: "#ec4899" },
    { value: "rose", color: "#f43f5e" },
    { value: "amber", color: "#f59e0b" },
    { value: "emerald", color: "#10b981" },
  ];

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
              ? "h-14 bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/80 backdrop-blur-2xl border border-slate-700/50 light:border-slate-200/80 shadow-lg"
              : "h-16 bg-slate-900/60 dark:bg-slate-900/60 light:bg-white/70 backdrop-blur-xl border border-slate-800/40 light:border-slate-200/60 shadow-md"
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
              aria-label="Search apps"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span className="truncate">Search apps…</span>
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
                className="w-9 h-9 rounded-full bg-slate-800 light:bg-slate-200 border border-slate-700/50 light:border-slate-300 flex items-center justify-center text-slate-300 light:text-slate-700 hover:border-indigo-500/50 transition-all overflow-hidden"
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
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-slate-800 light:border-slate-200">
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
                      <p className="text-sm font-semibold text-slate-200 light:text-slate-800 truncate">
                        {profileName || "VinDeck User"}
                      </p>
                    </div>
                  </div>

                  {/* Theme Segment */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500 light:text-slate-500 uppercase tracking-wider mb-2">Theme</p>
                    <div className="flex items-center p-1 rounded-xl bg-slate-800/60 light:bg-slate-100 border border-slate-700/40 light:border-slate-200">
                      {(["light", "dark", "system"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => onSetTheme(t)}
                          type="button"
                          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            theme === t
                              ? "bg-indigo-500 text-white shadow-sm"
                              : "text-slate-400 light:text-slate-600 hover:text-slate-200"
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

                  {/* Accent Color */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-slate-500 light:text-slate-500 uppercase tracking-wider mb-2">Accent Color</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {accentColors.map((ac) => (
                        <button
                          key={ac.value}
                          onClick={() => onSetAccentColor(ac.value)}
                          type="button"
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            accentColor === ac.value
                              ? "border-white light:border-slate-900 scale-110 shadow-md"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: ac.color }}
                          aria-label={ac.value}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="my-2 border-t border-slate-800 light:border-slate-200" />

                  {/* Menu Items */}
                  <button
                    onClick={() => { setIsUserMenuOpen(false); onOpenProfile(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 light:text-slate-700 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onOpenSettings(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 light:text-slate-700 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onOpenKeyboardShortcuts(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 light:text-slate-700 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span>Keyboard shortcuts</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onExportData(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 light:text-slate-700 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export data</span>
                  </button>

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onImportData(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 light:text-slate-700 hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import data</span>
                  </button>

                  <div className="my-2 border-t border-slate-800 light:border-slate-200" />

                  <button
                    onClick={() => { setIsUserMenuOpen(false); onSignOut(); }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 light:text-rose-600 hover:bg-rose-500/10 transition-colors"
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

          {/* Profile (opens same avatar menu as bottom sheet) */}
          <button
            onClick={() => setIsUserMenuOpen(true)}
            type="button"
            className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400 light:text-slate-600"
          >
            {profilePhoto ? (
              <div className="w-5 h-5 rounded-full overflow-hidden">
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </div>
    </>
  );
}