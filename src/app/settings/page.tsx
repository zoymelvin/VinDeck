"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  User,
  Eye,
  EyeOff,
  Check,
  Trash2,
} from "@/components/icons";
import type { UserSettings, ThemeMode, ViewMode, App as AppType } from "@/lib/types";
import { ACCENT_COLORS } from "@/lib/types";
import {
  getSettings,
  setSettings,
  getApps,
  setApps,
  exportAllData,
  importAllData,
  resetToDefaults,
} from "@/lib/storage";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";

export default function SettingsPage() {
  const { showSuccess, showError, showInfo } = useToast();
  const { setTheme: applyTheme } = useTheme();

  const [settings, setSettingsState] = useState<UserSettings>(() => getSettings());
  const [apps, setAppsState] = useState<AppType[]>(() => getApps());
  const [importError, setImportError] = useState("");
  const [activeTab, setActiveTab] = useState<"appearance" | "apps" | "profile" | "data" | "about">("appearance");

  // Profile photo upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const hiddenApps = apps.filter((a) => a.isHidden);

  const updateSettings = (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettingsState(updated);
    setSettings(updated);
    if (partial.theme) {
      applyTheme(partial.theme);
    }
    showSuccess("Settings saved");
  };

  const handleExport = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `vindeck-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess("Data exported successfully");
    } catch {
      showError("Failed to export data");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = importAllData(data);
      if (result.success) {
        showSuccess("Data imported successfully");
        setSettingsState(getSettings());
        setAppsState(getApps());
      } else {
        setImportError(result.error || "Failed to import data");
        showError(result.error || "Failed to import data");
      }
    } catch {
      setImportError("Invalid JSON backup file");
      showError("Invalid JSON backup file");
    } finally {
      e.target.value = "";
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset to defaults? All custom apps, notes, and settings will be permanently lost.")) {
      resetToDefaults();
      setSettingsState(getSettings());
      setAppsState(getApps());
      showSuccess("Reset to defaults complete");
    }
  };

  const handleUnhideApp = (appId: string) => {
    const updated = apps.map((a) => (a.id === appId ? { ...a, isHidden: false } : a));
    setApps(updated);
    setAppsState(updated);
    showSuccess("App unhidden");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      showError("Please select a PNG, JPG, or WEBP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError("Image must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, 256, 256);
        const dataUrl = canvas.toDataURL("image/webp", 0.9);
        updateSettings({ profilePhoto: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
        {/* Navigation Tabs (Sidebar on desktop) */}
        <nav className="sm:w-48 flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 flex-shrink-0">
          {[
            { id: "appearance", label: "Appearance" },
            { id: "apps", label: "Apps & Behavior" },
            { id: "profile", label: "Profile" },
            { id: "data", label: "Backup & Restore" },
            { id: "about", label: "About" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              type="button"
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-left whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Panels */}
        <main className="flex-1 bg-slate-900/60 rounded-3xl border border-slate-800/80 p-5 sm:p-6 space-y-6">
          {/* Appearance Section */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Theme</h2>
                <p className="text-xs text-slate-400 mb-3">Select your preferred color theme</p>
                <div className="flex items-center gap-2 max-w-sm p-1 rounded-2xl bg-slate-950 border border-slate-800">
                  {(["light", "dark", "system"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => updateSettings({ theme: m })}
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        settings.theme === m
                          ? "bg-indigo-500 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {m === "light" && <Sun className="w-3.5 h-3.5" />}
                      {m === "dark" && <Moon className="w-3.5 h-3.5" />}
                      {m === "system" && <Monitor className="w-3.5 h-3.5" />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Animations</h2>
                <p className="text-xs text-slate-400 mb-3">Configure motion and animations</p>
                <div className="flex items-center gap-2 max-w-xs p-1 rounded-2xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => updateSettings({ animations: "full" })}
                    type="button"
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      settings.animations === "full" ? "bg-indigo-500 text-white" : "text-slate-400"
                    }`}
                  >
                    Full
                  </button>
                  <button
                    onClick={() => updateSettings({ animations: "reduced" })}
                    type="button"
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      settings.animations === "reduced" ? "bg-indigo-500 text-white" : "text-slate-400"
                    }`}
                  >
                    Reduced
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between cursor-pointer max-w-sm">
                  <div>
                    <span className="text-sm font-semibold text-slate-200">Background effects</span>
                    <p className="text-xs text-slate-400">Animated mesh background and floating orbs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.backgroundEffects}
                    onChange={(e) => updateSettings({ backgroundEffects: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-700"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Apps & Behavior Section */}
          {activeTab === "apps" && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between cursor-pointer max-w-md">
                  <div>
                    <span className="text-sm font-semibold text-slate-200">Confirm before opening</span>
                    <p className="text-xs text-slate-400">Show a confirmation dialog before opening an app</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.confirmBeforeOpen}
                    onChange={(e) => updateSettings({ confirmBeforeOpen: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-700"
                  />
                </label>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Open links in</h2>
                <p className="text-xs text-slate-400 mb-3">Choose how application links open by default</p>
                <div className="flex items-center gap-2 max-w-xs p-1 rounded-2xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => updateSettings({ openLinksIn: "same-tab", openInNewTab: false })}
                    type="button"
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      settings.openLinksIn !== "new-tab" ? "bg-indigo-500 text-white" : "text-slate-400"
                    }`}
                  >
                    Same tab
                  </button>
                  <button
                    onClick={() => updateSettings({ openLinksIn: "new-tab", openInNewTab: true })}
                    type="button"
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      settings.openLinksIn === "new-tab" ? "bg-indigo-500 text-white" : "text-slate-400"
                    }`}
                  >
                    New tab
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between cursor-pointer max-w-md mb-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-200">Check app status</span>
                    <p className="text-xs text-slate-400">Regularly ping applications to check if they are reachable</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.statusEnabled}
                    onChange={(e) => updateSettings({ statusEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-700"
                  />
                </label>

                {settings.statusEnabled && (
                  <div className="pl-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Check interval</span>
                    <div className="flex items-center gap-2 max-w-xs p-1 rounded-2xl bg-slate-950 border border-slate-800">
                      {[
                        { label: "30s", val: 30 },
                        { label: "60s", val: 60 },
                        { label: "5 min", val: 300 },
                      ].map((int) => (
                        <button
                          key={int.val}
                          onClick={() => updateSettings({ statusCheckInterval: int.val })}
                          type="button"
                          className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            (settings.statusCheckInterval || 60) === int.val ? "bg-indigo-500 text-white" : "text-slate-400"
                          }`}
                        >
                          {int.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Default view</h2>
                <p className="text-xs text-slate-400 mb-3">Preferred card layout mode</p>
                <div className="flex items-center gap-2 max-w-xs p-1 rounded-2xl bg-slate-950 border border-slate-800">
                  {(["cards", "list", "compact"] as const).map((vm) => (
                    <button
                      key={vm}
                      onClick={() => updateSettings({ viewMode: vm })}
                      type="button"
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        settings.viewMode === vm ? "bg-indigo-500 text-white" : "text-slate-400"
                      }`}
                    >
                      {vm === "cards" ? "Grid" : vm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hidden Apps List */}
              <div className="pt-2">
                <h2 className="text-base font-bold text-slate-100 mb-1">Hidden Applications</h2>
                <p className="text-xs text-slate-400 mb-3">Apps currently marked as hidden</p>
                {hiddenApps.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No applications are currently hidden</p>
                ) : (
                  <div className="space-y-2">
                    {hiddenApps.map((ha) => (
                      <div
                        key={ha.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800"
                      >
                        <span className="text-sm font-semibold text-slate-200">{ha.name}</span>
                        <button
                          onClick={() => handleUnhideApp(ha.id)}
                          type="button"
                          className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold transition-colors"
                        >
                          Unhide
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Display Name</h2>
                <p className="text-xs text-slate-400 mb-2">Used in the header and greetings</p>
                <input
                  type="text"
                  value={settings.profileName || ""}
                  onChange={(e) => updateSettings({ profileName: e.target.value, greetingName: e.target.value })}
                  placeholder="Your name"
                  className="w-full max-w-sm px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Profile Photo</h2>
                <p className="text-xs text-slate-400 mb-3">Upload a PNG/JPG or paste an image link</p>
                <div className="flex items-center gap-4 mb-4">
                  {settings.profilePhoto ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/40">
                      <img src={settings.profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {settings.profileName ? settings.profileName.slice(0, 2).toUpperCase() : "V"}
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        Upload photo
                      </button>
                      {settings.profilePhoto && (
                        <button
                          onClick={() => updateSettings({ profilePhoto: "" })}
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup & Restore Section */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Export Data</h2>
                <p className="text-xs text-slate-400 mb-3">Download a JSON backup containing apps, categories, notes, and profile settings</p>
                <button
                  onClick={handleExport}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export all data</span>
                </button>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">Import Data</h2>
                <p className="text-xs text-slate-400 mb-3">Restore your dashboard from a previously exported JSON backup file</p>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => importInputRef.current?.click()}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import backup file</span>
                </button>
                {importError && <p className="text-xs text-rose-400 mt-2 font-medium">{importError}</p>}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h2 className="text-base font-bold text-rose-400 mb-1">Reset to Defaults</h2>
                <p className="text-xs text-slate-400 mb-3">Permanently reset all data, removing custom apps, notes, and settings</p>
                <button
                  onClick={handleReset}
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to defaults</span>
                </button>
              </div>
            </div>
          )}

          {/* About Section */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">VinDeck</h2>
                <p className="text-xs text-slate-400 mt-0.5">Version 0.2.0 • Self-hosted application dashboard</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
                <h3 className="font-semibold text-slate-200">Credits & Licenses</h3>
                <p>
                  Application icons provided by{" "}
                  <a href="https://github.com/homarr-labs/dashboard-icons" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    homarr-labs/dashboard-icons
                  </a>{" "}
                  under the Apache-2.0 License, and{" "}
                  <a href="https://selfh.st/icons" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    selfh.st/icons
                  </a>{" "}
                  under CC BY 4.0.
                </p>
                <p className="text-slate-500">
                  All trademarks, logos, and brand names are the property of their respective owners.
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Released under the MIT License.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}