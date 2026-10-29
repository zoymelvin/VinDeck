"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Check, ChevronDown, Plus } from "lucide-react";
import type { App as AppType, Category, AccentColor, LucideIconName } from "@/lib/types";
import { LUCIDE_ICONS, ACCENT_COLORS } from "@/lib/types";
import { isValidUrl } from "@/lib/validation";

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
        description: initialData.description,
        url: initialData.url,
        icon: initialData.iconType === "emoji" ? { type: "emoji" as const, value: initialData.icon } : { type: "lucide" as const, value: initialData.icon as LucideIconName },
        accentColor: initialData.accentColor,
        category: initialData.category,
        tags: initialData.tags,
      };
    }
    return {
      name: "",
      description: "",
      url: "",
      icon: { type: "emoji" as const, value: "🔗" },
      accentColor: "blue" as AccentColor,
      category: categories[0]?.id || "",
      tags: [] as string[],
    };
  };

  const initial = getInitialState();

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [url, setUrl] = useState(initial.url);
  const [icon, setIcon] = useState(initial.icon);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [category, setCategory] = useState(initial.category);
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState(initial.tags);
  const [newTag, setNewTag] = useState("");
  const [showLucidePicker, setShowLucidePicker] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nama wajib diisi";
    if (!url.trim()) newErrors.url = "URL wajib diisi";
    else if (!isValidUrl(url)) newErrors.url = "URL tidak valid (harus http:// atau https://)";
    if (!category) newErrors.category = "Category is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const appData: Partial<AppType> & { id?: string } = {
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      icon: icon.value,
      iconType: icon.type,
      accentColor,
      category,
      tags,
    };
    if (initialData?.id) appData.id = initialData.id;
    onSubmit(appData);
    setSubmitting(false);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newCategory.trim();
    if (cat) {
      onAddCategory(cat);
      setCategory(cat.toLowerCase().replace(/\s+/g, "-"));
      setNewCategory("");
      setShowCategoryInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={formRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {initialData ? "Edit App" : "Add App"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="App name"
                disabled={submitting}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deskripsi
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Deskripsi singkat (opsional)"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.url ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="https://contoh.com"
                disabled={submitting}
                aria-invalid={!!errors.url}
                aria-describedby={errors.url ? "url-error" : undefined}
              />
              {errors.url && <p id="url-error" className="mt-1 text-sm text-red-500" role="alert">{errors.url}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ikon
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <select
                    value={icon.type}
                    onChange={(e) => {
                      const newType = e.target.value as "emoji" | "lucide";
                      if (newType === "emoji") {
                        setIcon({ type: "emoji", value: "🔗" });
                      } else {
                        setIcon({ type: "lucide", value: LUCIDE_ICONS[0] });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-no-repeat bg-right pr-10"
                    disabled={submitting}
                  >
                    <option value="emoji">Emoji</option>
                    <option value="lucide">Ikon Lucide</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
                {icon.type === "emoji" ? (
                  <input
                    type="text"
                    value={icon.value}
                    onChange={(e) => setIcon({ type: "emoji", value: e.target.value.slice(0, 2) })}
                    maxLength={2}
                    className="w-12 px-3 py-3 text-center text-2xl border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="🔗"
                    disabled={submitting}
                    aria-label="Emoji ikon"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLucidePicker(true)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center gap-3"
                    disabled={submitting}
                  >
                    <span className="w-8 h-8 flex items-center justify-center">
                      {getLucideIcon(icon.value)}
                    </span>
                    <span className="flex-1 truncate capitalize">{icon.value}</span>
                    <ChevronDown className="text-gray-400" size={16} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Warna Akses
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setAccentColor(color.value)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      accentColor === color.value
                        ? "border-current scale-110 shadow-lg"
                        : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    style={{ backgroundColor: `var(--color-${color.value}-500)` }}
                    aria-label={color.label}
                    aria-pressed={accentColor === color.value}
                    disabled={submitting}
                  >
                    {accentColor === color.value && <Check className="w-5 h-5 text-white mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setShowCategoryInput(false); }}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-no-repeat bg-right pr-10 ${
                      errors.category ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={submitting}
                    aria-invalid={!!errors.category}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="__new__">+ Buat kategori baru...</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
              {showCategoryInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory(e)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New category name"
                    autoFocus
                    disabled={submitting}
                  />
                  <button type="button" onClick={handleAddCategory} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" disabled={submitting}>Tambah</button>
                  <button type="button" onClick={() => { setShowCategoryInput(false); setNewCategory(""); }} className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" disabled={submitting}>Batal</button>
                </div>
              )}
              {errors.category && <p className="mt-1 text-sm text-red-500" role="alert">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tag
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-blue-600 dark:hover:text-blue-400" aria-label={`Hapus tag ${tag}`}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag(e)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tag (press Enter)"
                  maxLength={20}
                  disabled={submitting}
                />
                <button type="button" onClick={handleAddTag} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" disabled={submitting || !newTag.trim() || tags.length >= 10}>Tambah</button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maksimal 10 tag, huruf kecil dan tanda hubung saja</p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check size={16} />
                  {initialData ? "Save Changes" : "Add App"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showLucidePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLucidePicker(false)}>
          <div className="w-full max-w-3xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pilih Ikon Lucide</h3>
              <button onClick={() => setShowLucidePicker(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {LUCIDE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => { setIcon({ type: "lucide", value: iconName }); setShowLucidePicker(false); }}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    icon.type === "lucide" && icon.value === iconName
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                  disabled={submitting}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    {getLucideIcon(iconName)}
                  </svg>
                  <span className="text-xs text-center truncate w-full capitalize">{iconName.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getLucideIcon(name: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    Monitor: (<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></>),
    Server: (<><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></>),
    Database: (<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19"/><path d="M3 5A9 3 0 0 1 21 5"/></>),
    Shield: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>),
    Lock: (<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
    Key: (<><circle cx="12" cy="16" r="3"/><path d="M12 12v-4"/><path d="M12 8h-2"/><path d="M12 8h2"/><path d="M12 8v-2"/></>),
    Folder: (<><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></>),
    FileText: (<><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 22H4a2 2 0 0 1-2-2V7l5-5H6"/></>),
    Globe: (<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>),
    Image: (<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></>),
    Film: (<><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="22" y2="17"/></>),
    Music: (<><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>),
    Video: (<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>),
    Terminal: (<><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>),
    Code: (<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>),
    Cloud: (<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>),
    Wifi: (<><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><line x1="12" y1="20" x2="12" y2="20"/></>),
    Cpu: (<><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v4"/><path d="M15 4v4"/><path d="M9 16v4"/><path d="M15 16v4"/><path d="M4 9h4"/><path d="M16 9h4"/><path d="M4 15h4"/><path d="M16 15h4"/></>),
    HardDrive: (<><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></>),
    MemoryStick: (<><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></>),
    Router: (<><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></>),
    User: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
    Users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
    Mail: (<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>),
    MessageSquare: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
    Phone: (<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>),
  };
  return icons[name] || <rect x="3" y="3" width="18" height="18" rx="2"/>;
}