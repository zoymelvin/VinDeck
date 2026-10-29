"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Trash2, Download, Upload, RotateCcw, Eye, EyeOff, Pin, PinOff, Plus, Minus } from "lucide-react";
import type { UserSettings, Category, AccentColor, ThemeMode, ViewMode } from "@/lib/types";
import { ACCENT_COLORS } from "@/lib/types";
import { exportAllData, importAllData, resetToDefaults, getHiddenBuiltInApps, restoreBuiltInApp } from "@/lib/storage";
import { useToast } from "@/hooks/useToast";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSettingsChange: (settings: Partial<UserSettings>) => void;
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  hiddenBuiltInApps: string[];
}

export default function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  categories,
  onCategoriesChange,
  hiddenBuiltInApps,
}: SettingsDialogProps) {
  const { showSuccess, showError, showInfo } = useToast();
  const [greetingName, setGreetingName] = useState(settings.greetingName);
  const [dashboardTitle, setDashboardTitle] = useState(settings.dashboardTitle);
  const [theme, setTheme] = useState<ThemeMode>(settings.theme);
  const [accentColor, setAccentColor] = useState<AccentColor>(settings.accentColor);
  const [viewMode, setViewMode] = useState<ViewMode>(settings.viewMode);
  const [openInNewTab, setOpenInNewTab] = useState(settings.openInNewTab);
  const [statusEnabled, setStatusEnabled] = useState(settings.statusEnabled);
  const [showHiddenApps, setShowHiddenApps] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Use props directly in render, only update local state when user interacts
  // This avoids the setState in effect warning

  const handleExport = async () => {
    setExporting(true);
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
      showSuccess("Data diekspor berhasil");
    } catch {
      showError("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = importAllData(data);
      if (result.success) {
        showSuccess("Data diimpor berhasil");
        onClose();
        window.location.reload();
      } else {
        setImportError(result.error || "Gagal mengimpor data");
        showError(result.error || "Gagal mengimpor data");
      }
    } catch {
      setImportError("File tidak valid");
      showError("File tidak valid");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleReset = async () => {
    if (!confirm("Yakin ingin mereset ke pengaturan bawaan? Semua aplikasi kustom dan pengaturan akan hilang. Tindakan ini tidak bisa diurungkan.")) return;
    setResetting(true);
    try {
      resetToDefaults();
      showSuccess("Direset ke pengaturan bawaan");
      onClose();
      window.location.reload();
    } catch {
      showError("Gagal mereset");
    } finally {
      setResetting(false);
    }
  };

  const handleRestoreApp = (appId: string) => {
    restoreBuiltInApp(appId);
    showSuccess("Aplikasi dipulihkan");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pengaturan</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Eye size={20} /> Umum</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="greetingName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Sapaan</label>
                <input id="greetingName" type="text" value={settings.greetingName} onChange={(e) => setGreetingName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Pengguna" />
              </div>
              <div>
                <label htmlFor="dashboardTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Dashboard</label>
                <input id="dashboardTitle" type="text" value={settings.dashboardTitle} onChange={(e) => setDashboardTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="VinDeck" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Eye size={20} /> Tampilan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tema</label>
                <div className="flex gap-3">
                  {(["light", "dark", "system"] as ThemeMode[]).map((t) => (
                    <button key={t} onClick={() => setTheme(t)} className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${theme === t ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200" : "border-gray-300 dark:border-gray-600 hover:border-gray-400"}`}>{t === "light" ? "Terang" : t === "dark" ? "Gelap" : "Ikuti Sistem"}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Warna Akses</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((c) => (
                    <button key={c.value} onClick={() => setAccentColor(c.value)} className={`w-10 h-10 rounded-lg border-2 ${accentColor === c.value ? "border-current scale-110 shadow-lg" : "border-transparent hover:border-gray-300"}`} style={{ backgroundColor: `var(--color-${c.value}-500)` }} aria-label={c.label} aria-pressed={accentColor === c.value}><Check className={accentColor === c.value ? "w-5 h-5 text-white mx-auto" : "hidden"} /></button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode Tampilan</label>
                <div className="flex gap-3">
                  {(["cards", "list", "compact"] as ViewMode[]).map((v) => (
                    <button key={v} onClick={() => setViewMode(v)} className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${viewMode === v ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200" : "border-gray-300 dark:border-gray-600 hover:border-gray-400"}`}>{v === "cards" ? "Kartu" : v === "list" ? "Daftar" : "Ringkas"}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Buka tautan di tab baru</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nonaktifkan untuk membuka di tab yang sama</p>
                </div>
                <button onClick={() => setOpenInNewTab(!openInNewTab)} className={`relative w-12 h-7 rounded-full transition-colors ${openInNewTab ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`} aria-label={openInNewTab ? "Aktif" : "Nonaktif"}><span className={`absolute top-0.5 transition-transform w-6 h-6 rounded-full bg-white shadow ${openInNewTab ? "translate-x-5" : "translate-x-0.5"}`} /></button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Periksa status aplikasi</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cek keterjangkauan dari browser (petunjuk, bukan jaminan)</p>
                </div>
                <button onClick={() => setStatusEnabled(!statusEnabled)} className={`relative w-12 h-7 rounded-full transition-colors ${statusEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`} aria-label={statusEnabled ? "Aktif" : "Nonaktif"}><span className={`absolute top-0.5 transition-transform w-6 h-6 rounded-full bg-white shadow ${statusEnabled ? "translate-x-5" : "translate-x-0.5"}`} /></button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Pin size={20} /> Aplikasi Tersembunyi</h3>
            <div className="space-y-2">
              {hiddenBuiltInApps.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada aplikasi bawaan yang disembunyikan</p>
              ) : (
                hiddenBuiltInApps.map((appId) => (
                  <div key={appId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{appId}</span>
                    <button onClick={() => handleRestoreApp(appId)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Pulihkan</button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Download size={20} /> Data</h3>
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleExport} disabled={exporting} className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"><Download size={16} />{exporting ? "Mengekspor..." : "Ekspor Data (JSON)"}</button>
                <div className="relative">
                  <button className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"><Upload size={16} />Impor Data</button>
                  <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={importing} />
                </div>
                {importError && <p className="text-sm text-red-500">{importError}</p>}
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={handleReset} disabled={resetting} className="px-4 py-3 border border-red-500 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><RotateCcw size={16} />{resetting ? "Mereset..." : "Reset ke Bawaan"}</button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Menghapus semua aplikasi kustom dan mengembalikan pengaturan ke default.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Tutup</button>
          <button onClick={() => { onSettingsChange({ greetingName: settings.greetingName, dashboardTitle: settings.dashboardTitle, theme: settings.theme, accentColor: settings.accentColor, viewMode: settings.viewMode, openInNewTab: settings.openInNewTab, statusEnabled: settings.statusEnabled, schemaVersion: settings.schemaVersion }); onClose(); }} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"><Check size={16} />Simpan</button>
        </div>
      </div>
    </div>
  );
}