"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Copy, Check, X } from "@/components/icons";
import { AppIcon } from "@/components/AppIcon";
import type { App as AppType } from "@/lib/types";
import { strings } from "@/lib/strings";

interface ConfirmOpenDialogProps {
  app: AppType | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (app: AppType) => void;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function ConfirmOpenDialog({
  app,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmOpenDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && app) {
        e.preventDefault();
        onConfirm(app);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, app, onClose, onConfirm]);

  const hostname = app ? extractHostname(app.url) : "";

  const handleCopyUrl = () => {
    if (!app) return;
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && app && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            className="relative w-full max-w-md rounded-3xl bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/95 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl backdrop-blur-2xl p-6 overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.8 }}
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

            <div className="flex items-center gap-4 mb-5">
              <AppIcon
                icon={app.icon}
                iconType={app.iconType === "emoji" ? "emoji" : app.iconType === "lucide" ? "lucide" : "brand"}
                iconSrc={app.iconSrc}
                name={app.name}
                className="w-14 h-14"
                size={56}
              />
              <div>
                <h2 id="confirm-dialog-title" className="text-xl font-bold text-slate-100 light:text-slate-900">
                  Open {app.name}?
                </h2>
                <p className="text-xs text-indigo-400 font-mono mt-0.5">{hostname}</p>
              </div>
            </div>

            <p id="confirm-dialog-description" className="text-sm text-slate-300 light:text-slate-600 mb-4 leading-relaxed">
              You&apos;re about to leave VinDeck and go to <span className="font-semibold text-slate-200 light:text-slate-800">{hostname}</span>.
            </p>

            <div className="flex items-center justify-between p-3 mb-6 rounded-2xl bg-slate-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-200 font-mono text-xs text-slate-300 light:text-slate-700 overflow-hidden">
              <span className="truncate mr-2 select-all">{app.url}</span>
              <button
                onClick={handleCopyUrl}
                type="button"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex-shrink-0"
                aria-label="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                type="button"
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-300 light:text-slate-700 bg-slate-800/50 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              >
                {strings.common.cancel}
              </button>
              <button
                ref={confirmButtonRef}
                onClick={() => onConfirm(app)}
                type="button"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open app</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
