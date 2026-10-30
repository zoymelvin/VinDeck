import React, { useState } from "react";
import { X, Sun, Moon, Monitor, Download, Upload, RotateCcw, LogOut, Settings, FileText, Download as DownloadIcon, User, Home, Keyboard, Pin, FileText as FileTextIcon, ArrowLeft } from "@/components/icons";
import type { AccentColor, ThemeMode, ViewMode } from "@/lib/types";
import { exportAllData, importAllData, resetToDefaults } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";
import { useSettingsSelector, useSettingsActions } from "@/hooks/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";

interface SettingsDialogProps { isOpen: boolean; onClose: () => void; }

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { showSuccess, showError } = useToast();
  const { theme: currentTheme, setTheme: setThemeMode } = useTheme();
  const settings = useSettingsSelector((s) => s);
  const actions = useSettingsActions();

  const [activeSection, setActiveSection] = useState<
    "profile" | "appearance" | "apps" | "notes" | "data" | "about" | "account"
  >("profile");

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "apps", label: "Apps", icon: Pin },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "data", label: "Data", icon: Download },
    { id: "about", label: "About", icon: RotateCcw },
    { id: "account", label: "Account", icon: LogOut },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="settings-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">Settings</h2>
          <button onClick={onClose} type="button" className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close settings"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <nav className="hidden lg:flex flex-col gap-1 p-3 border-r border-slate-200 dark:border-slate-800 w-48 flex-shrink-0 overflow-y-auto" aria-label="Settings sections">
            {sections.map((section) => (
              <button key={section.id} onClick={() => setActiveSection(section.id)} type="button" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === section.id ? "bg-indigo-500 text-white shadow-sm" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"}`}>
                <section.icon className="w-5 h-5 flex-shrink-0" /> <span>{section.label}</span>
              </button>
            ))}
          </nav>

          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 px-3 py-2 overflow-x-auto flex gap-2">
            {sections.map((section) => (
              <button key={section.id} onClick={() => setActiveSection(section.id)} type="button" className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeSection === section.id ? "bg-indigo-500 text-white" : "text-slate-600 dark:text-slate-400"}`}>
                <section.icon className="w-4 h-4" /> <span className="ml-1">{section.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
            {activeSection === "profile" && <div className="space-y-6"><h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Profile</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Profile settings - coming soon</p></div>}
            {activeSection === "appearance" && <div className="space-y-6"><h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Appearance</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Appearance settings - coming soon</p></div>}
            {activeSection === "apps" && <div className="space-y-6"><h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Apps</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Apps settings - coming soon</p></div>}
            {activeSection === "notes" && <div className="space-y-6"><h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Notes</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Notes settings - coming soon</p></div>}
            {activeSection === "data" && <div className="space-y-6"><h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Data</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Data settings - coming soon</p></div>}
            {activeSection === "about" && <div className="space-y-6"><h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">About</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">About - coming soon</p></div>}
            {activeSection === "account" && <div className="space-y-6"><h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Account</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Account - coming soon</p></div>}
          </div>

          <div className="lg:hidden p-4 border-t border-slate-200 dark:border-slate-800">
            <button onClick={onClose} type="button" className="w-full py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>
          </div>
        </div>
      </div>
    </div>
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
