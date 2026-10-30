"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  FileText,
  User,
  Home,
  Keyboard,
  Pin,
  ArrowLeft,
  Wifi,
  Trash2,
  Check,
  ChevronRight,
  LayoutGrid,
  List,
  LayoutDashboard,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
} from "@/components/icons";
import type { ThemeMode, ViewMode } from "@/lib/types";
import { exportAllData, importAllData, resetToDefaults, getApps, setApps, getHiddenBuiltInApps, restoreBuiltInApp } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { useSettingsSelector, useSettingsActions } from "@/hooks/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { strings } from "@/lib/strings";

interface SettingsDialogProps { isOpen: boolean; onClose: () => void; }

type SectionId = "profile" | "appearance" | "apps" | "notes" | "data" | "about" | "account";

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "apps", label: "Apps", icon: Pin },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "data", label: "Data", icon: Download },
  { id: "about", label: "About", icon: RotateCcw },
  { id: "account", label: "Account", icon: LogOut },
];

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { showSuccess, showError } = useToast();
  const { theme: currentTheme, setTheme: setThemeMode } = useTheme();
  const settings = useSettingsSelector((s) => s);
  const actions = useSettingsActions();
  const apps = getApps();

  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(settings.profileName || "");
  const [photo, setPhoto] = useState(settings.profilePhoto || "");
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hiddenApps, setHiddenApps] = useState<string[]>([]);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      setName(settings.profileName || "");
      setPhoto(settings.profilePhoto || "");
      setSaved(false);
      setHiddenApps(getHiddenBuiltInApps());
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSaveProfile = async () => {
    await actions.setProfileName(name.trim());
    await actions.setProfilePhoto(photo);
    showSaved();
    showSuccess("Profile saved");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please select a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
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
        setPhoto(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    setError("");
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("https://")) {
      setError("Image URL must start with https://");
      return;
    }
    setLoading(true);
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = "";
      setLoading(false);
      setError("Couldn't load this image (timeout).");
    }, 8000);
    img.onload = () => {
      clearTimeout(timer);
      setLoading(false);
      setPhoto(trimmed);
      setUrlInput("");
    };
    img.onerror = () => {
      clearTimeout(timer);
      setLoading(false);
      setError("Couldn't load this image. Please check the URL.");
    };
    img.src = trimmed;
  };

  const handleRemovePhoto = () => {
    setPhoto("");
    setError("");
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
      showSuccess("Data exported");
    } catch {
      showError("Export failed");
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = importAllData(data);
        if (result.success) {
          showSuccess("Data imported");
          onClose();
        } else {
          setImportError(result.error || "Import failed");
        }
      } catch {
        setImportError("Invalid backup file");
      }
    };
    input.click();
  };

  const handleResetSettings = () => {
    if (confirm("Reset all settings to defaults?")) {
      actions.reset();
      showSuccess("Settings reset");
    }
  };

  const handleResetEverything = () => {
    const confirmText = prompt("Type RESET to confirm deleting everything:");
    if (confirmText === "RESET") {
      resetToDefaults();
      showSuccess("Everything reset");
      onClose();
    }
  };

  const handleUnhide = (appId: string) => {
    restoreBuiltInApp(appId);
    setHiddenApps(getHiddenBuiltInApps());
    showSuccess("App restored");
  };

  const handleSignOut = () => {
    window.location.href = "/api/logout";
  };

  const [activeMobileSection, setActiveMobileSection] = useState<string | null>(null);

  const renderSection = (id: string) => {
    switch (id) {
      case "profile":
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                {photo ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/20">
                    <img src={photo} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                    {(name || "User").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{name || "User"}</p>
                {photo && (
                  <button onClick={handleRemovePhoto} type="button" className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-500 mt-1 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /><span>Remove photo</span>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Profile Photo</label>
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-3">
                <button onClick={() => setMode("upload")} type="button" className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${mode === "upload" ? "bg-indigo-500 text-white" : "text-slate-600 dark:text-slate-400"}`}><Upload className="w-3.5 h-3.5" /><span>Upload file</span></button>
                <button onClick={() => setMode("url")} type="button" className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${mode === "url" ? "bg-indigo-500 text-white" : "text-slate-600 dark:text-slate-400"}`}><User className="w-3.5 h-3.5" /><span>Image URL</span></button>
              </div>
              {mode === "upload" ? (
                <div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="hidden" id="photo-upload-input" />
                  <button onClick={() => fileInputRef.current?.click()} type="button" className="w-full py-3 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-500 dark:border-slate-600 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium flex items-center justify-center gap-2 transition-all"><Upload className="w-4 h-4" /><span>Choose PNG, JPG, or WEBP (max 5 MB)</span></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/photo.png" className="flex-1 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  <button onClick={handleApplyUrl} disabled={loading || !urlInput.trim()} type="button" className="px-3.5 py-2 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold transition-all">{loading ? "Checking…" : "Apply"}</button>
                </div>
              )}
              {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">{error}</p>}
            </div>
            <button onClick={handleSaveProfile} type="button" className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all">Save Profile</button>
          </div>
        );
      case "appearance":
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Appearance</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Theme</label>
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button key={t} onClick={() => setThemeMode(t)} type="button" className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentTheme === t ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
                    {t === "light" && <Sun className="w-3.5 h-3.5" />}
                    {t === "dark" && <Moon className="w-3.5 h-3.5" />}
                    {t === "system" && <Monitor className="w-3.5 h-3.5" />}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Background effects</p><p className="text-xs text-slate-500 dark:text-slate-400">Animated mesh orbs</p></div>
              <button onClick={() => actions.setBackgroundEffects(!settings.backgroundEffects)} type="button" className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${settings.backgroundEffects ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>{settings.backgroundEffects ? "On" : "Off"}</button>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Animations</p><p className="text-xs text-slate-500 dark:text-slate-400">Motion and transitions</p></div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                {(["full", "reduced", "follow"] as const).map((a) => (
                  <button key={a} onClick={() => actions.setAnimations(a)} type="button" className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${settings.animations === a ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400"}`}>{a === "full" ? "Full" : a === "reduced" ? "Reduced" : "Follow"}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Reduce transparency</p><p className="text-xs text-slate-500 dark:text-slate-400">Solid panels instead of glass</p></div>
              <button onClick={() => {}} type="button" className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300`}>Off</button>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Density</p><p className="text-xs text-slate-500 dark:text-slate-400">Card spacing</p></div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                {(["comfortable", "compact"] as const).map((d) => (
                  <button key={d} type="button" className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${d === "comfortable" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400"}`}>{d}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case "apps":
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Apps</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Default view</label>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                {(["cards", "list", "compact"] as const).map((v) => (
                  <button key={v} onClick={() => actions.setViewMode(v)} type="button" className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${settings.viewMode === v ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400"}`}>
                    {v === "cards" && <LayoutGrid className="w-3.5 h-3.5" />}
                    {v === "list" && <List className="w-3.5 h-3.5" />}
                    {v === "compact" && <LayoutDashboard className="w-3.5 h-3.5" />}
                    <span className="capitalize">{v}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Open links in</p><p className="text-xs text-slate-500 dark:text-slate-400">Same tab or new tab</p></div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                {(["same-tab", "new-tab"] as const).map((v) => (
                  <button key={v} onClick={() => actions.setOpenLinksIn(v)} type="button" className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${settings.openLinksIn === v ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400"}`}>{v === "same-tab" ? "Same tab" : "New tab"}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Confirm before opening</p><p className="text-xs text-slate-500 dark:text-slate-400">Show confirmation dialog</p></div>
              <button onClick={() => actions.setConfirmBeforeOpen(!settings.confirmBeforeOpen)} type="button" className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${settings.confirmBeforeOpen ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>{settings.confirmBeforeOpen ? "On" : "Off"}</button>
            </div>
            {hiddenApps.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Hidden apps</p>
                <div className="space-y-2">
                  {hiddenApps.map((id) => {
                    const app = apps.find((a) => a.id === id);
                    if (!app) return null;
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-sm text-slate-900 dark:text-slate-100">{app.name}</span>
                        <button onClick={() => handleUnhide(id)} type="button" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Unhide</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <button onClick={() => { if (confirm("Reset app order to default?")) { setApps(getApps().sort((a, b) => a.sortOrder - b.sortOrder)); showSuccess("Order reset"); }}} type="button" className="w-full px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Reset app order</button>
          </div>
        );
      case "notes":
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notes</h3>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Default editor mode</p><p className="text-xs text-slate-500 dark:text-slate-400">Edit, Preview, or Split</p></div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                {(["edit", "preview", "split"] as const).map((m) => (
                  <button key={m} type="button" className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${m === "edit" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400"}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Autosave</p><p className="text-xs text-slate-500 dark:text-slate-400">Save automatically while typing</p></div>
              <button type="button" className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-indigo-500 text-white`}>On</button>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-900 dark:text-slate-100">Revisions to keep</p><p className="text-xs text-slate-500 dark:text-slate-400">History depth</p></div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                {([5, 10, 20] as const).map((n) => (
                  <button key={n} type="button" className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${n === 10 ? "bg-indigo-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400"}`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case "data":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Data</h3>
            <button onClick={handleExport} type="button" className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-3"><Download className="w-5 h-5 text-indigo-500" /><div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Export everything</p><p className="text-xs text-slate-500 dark:text-slate-400">JSON backup of all data</p></div></div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={handleImport} type="button" className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-3"><Upload className="w-5 h-5 text-indigo-500" /><div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Import data</p><p className="text-xs text-slate-500 dark:text-slate-400">Restore from backup</p></div></div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            {importError && <p className="text-xs text-rose-600 dark:text-rose-400">{importError}</p>}
            <button onClick={handleResetSettings} type="button" className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-3"><RotateCcw className="w-5 h-5 text-amber-500" /><div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reset settings to defaults</p><p className="text-xs text-slate-500 dark:text-slate-400">Restore default preferences</p></div></div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={handleResetEverything} type="button" className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
              <div className="flex items-center gap-3"><Trash2 className="w-5 h-5 text-rose-500" /><div><p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Reset everything</p><p className="text-xs text-rose-500 dark:text-rose-400">Delete all data and start fresh</p></div></div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        );
      case "about":
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">About</h3>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">VinDeck</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Self-hosted application dashboard</p>
              <p className="text-xs text-slate-400 mt-1">Version 0.1.0</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Keyboard shortcuts</p>
              <div className="space-y-2">
                {[
                  { key: "/", desc: "Focus search" },
                  { key: "Ctrl / ⌘ K", desc: "Open command palette" },
                  { key: "Esc", desc: "Close dialog" },
                  { key: "Enter / Space", desc: "Open selected app" },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{s.desc}</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 font-mono text-xs text-indigo-600 dark:text-indigo-400 border border-slate-300 dark:border-slate-700 shadow-2xs font-semibold">{s.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Credits</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Icons from homarr-labs/dashboard-icons (Apache-2.0) and selfh.st/icons (CC BY 4.0). Trademarks belong to their respective owners.</p>
            </div>
          </div>
        );
      case "account":
        return (
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account</h3>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Session</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">You are signed in</p>
            </div>
            <button onClick={handleSignOut} type="button" className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md shadow-rose-500/20 active:scale-95 transition-all">Sign out</button>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-dialog-title"
        >
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 id="settings-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h2>
              <div className="flex items-center gap-2">
                {saved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
                <button onClick={onClose} type="button" className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close settings"><X className="w-5 h-5" /></button>
              </div>
            </div>

             <div className="flex flex-1 overflow-hidden">
               <nav className="hidden lg:flex flex-col gap-1 p-3 border-r border-slate-200 dark:border-slate-800 w-48 flex-shrink-0 overflow-y-auto" aria-label="Settings sections">
                 {SECTIONS.map((section) => (
                   <button key={section.id} onClick={() => setActiveSection(section.id)} type="button" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === section.id ? "bg-indigo-500 text-white shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}>
                     <section.icon className="w-5 h-5 flex-shrink-0" /> <span>{section.label}</span>
                   </button>
                 ))}
               </nav>

               {activeMobileSection ? (
                 <div className="lg:hidden flex-1 overflow-y-auto">
                   <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                     <button onClick={() => setActiveMobileSection(null)} type="button" className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="w-4 h-4" /></button>
                     <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{SECTIONS.find(s => s.id === activeMobileSection)?.label}</span>
                   </div>
                   <div className="p-4">
                     <AnimatePresence mode="wait">
                       <motion.div
                         key={activeMobileSection}
                         initial={{ opacity: 0, y: 8 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -8 }}
                         transition={{ duration: 0.15 }}
                         className="space-y-5"
                       >
                         {renderSection(activeMobileSection)}
                       </motion.div>
                     </AnimatePresence>
                   </div>
                 </div>
               ) : (
                 <div className="lg:hidden flex-1 overflow-y-auto p-3">
                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Settings</p>
                   <div className="space-y-1">
                     {SECTIONS.map((section) => (
                       <button key={section.id} onClick={() => setActiveMobileSection(section.id)} type="button" className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all ${activeSection === section.id ? "bg-indigo-500 text-white shadow-sm" : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}>
                         <section.icon className="w-5 h-5 flex-shrink-0" />
                         <span className="flex-1 text-left">{section.label}</span>
                         <ChevronRight className="w-4 h-4 text-slate-400" />
                       </button>
                     ))}
                   </div>
                 </div>
                )}

                <div className="hidden lg:flex flex-1 overflow-y-auto p-6 lg:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {renderSection(activeSection)}
                    </motion.div>
                  </AnimatePresence>
                </div>

                </div>

            </motion.div>
         </motion.div>
      )}
    </AnimatePresence>
  );
}

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "apps", label: "Apps", icon: Pin },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "data", label: "Data", icon: Download },
  { id: "about", label: "About", icon: RotateCcw },
  { id: "account", label: "Account", icon: LogOut },
] as const;

export default SettingsDialog;
