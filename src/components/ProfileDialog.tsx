"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, User, Upload, Link, Trash2 } from "@/components/icons";
import { useSettingsActions } from "@/hooks/useSettingsStore";

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentPhoto: string;
}

export function ProfileDialog({
  isOpen,
  onClose,
  currentName,
  currentPhoto,
}: ProfileDialogProps) {
  const { setProfileName, setProfilePhoto } = useSettingsActions();
  const [name, setName] = useState(currentName);
  const [photo, setPhoto] = useState(currentPhoto);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const handleSave = async () => {
    await setProfileName(name.trim());
    await setProfilePhoto(photo);
    onClose();
  };

  const getInitials = (str: string) => {
    if (!str) return "V";
    const words = str.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-dialog-title"
        className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="profile-dialog-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-5">
          Profile Settings
        </h2>

        {/* Avatar Preview */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {photo ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/20">
                <img src={photo} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                {getInitials(name)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {name || "VinDeck User"}
            </p>
            {photo && (
              <button
                onClick={handleRemovePhoto}
                type="button"
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-500 mt-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Display Name Input */}
        <div className="mb-5">
          <label htmlFor="display-name" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Display Name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Photo Mode Tabs */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Profile Photo
          </label>
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-3">
            <button
              onClick={() => setMode("upload")}
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === "upload" ? "bg-indigo-500 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload file</span>
            </button>
            <button
              onClick={() => setMode("url")}
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === "url" ? "bg-indigo-500 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>
          </div>

          {mode === "upload" ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="w-full py-3 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-500 dark:border-slate-600 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Choose PNG, JPG, or WEBP (max 5 MB)</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/photo.png"
                className="flex-1 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                onClick={handleApplyUrl}
                disabled={loading || !urlInput.trim()}
                type="button"
                className="px-3.5 py-2 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold transition-all"
              >
                {loading ? "Checking…" : "Apply"}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function getInitials(str: string) {
  if (!str) return "V";
  const words = str.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return str.slice(0, 2).toUpperCase();
}