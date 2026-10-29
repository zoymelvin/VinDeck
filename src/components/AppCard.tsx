"use client";

import React, { useRef, useEffect } from "react";
import { ExternalLink, Copy, Edit, Pin, PinOff, Eye, EyeOff, MoreVertical, Trash2, Check } from "lucide-react";
import type { App as AppType, AccentColor } from "@/lib/types";

interface AppCardProps {
  app: AppType;
  viewMode: "cards" | "list" | "compact";
  isPinned: boolean;
  onOpen: (app: AppType, newTab: boolean) => void;
  onEdit: (app: AppType) => void;
  onTogglePin: (app: AppType) => void;
  onToggleHidden: (app: AppType) => void;
  onDelete: (app: AppType) => void;
  onCopyLink: (url: string) => void;
  onStatusChange: (appId: string, reachable: boolean | null) => void;
  status: "checking" | "reachable" | "unreachable" | null;
  checking: boolean;
  openInNewTabDefault: boolean;
  accentColor: AccentColor;
}

const STATUS_COLORS = {
  checking: "text-yellow-500",
  reachable: "text-green-500",
  unreachable: "text-red-500",
};

const STATUS_LABELS = {
  checking: "Memeriksa...",
  reachable: "Terjangkau",
  unreachable: "Tidak terjangkau",
};

function LucideIcon({ name, className = "" }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    Monitor: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>,
    Server: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6" y2="6"/><line x1="6" y1="18" x2="6" y2="18"/></svg>,
    Database: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19"/><path d="M3 5A9 3 0 0 1 21 5"/></svg>,
    Shield: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Lock: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    Key: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="16" r="3"/><path d="M12 12v-4"/><path d="M12 8h-2"/><path d="M12 8h2"/><path d="M12 8v-2"/></svg>,
    Folder: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>,
    FileText: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 22H4a2 2 0 0 1-2-2V7l5-5H6"/></svg>,
    Globe: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    Image: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
    Film: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="22" y2="17"/></svg>,
    Music: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    Video: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    Terminal: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
    Code: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    Cloud: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
    Wifi: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>,
    Cpu: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v4"/><path d="M15 4v4"/><path d="M9 16v4"/><path d="M15 16v4"/><path d="M4 9h4"/><path d="M16 9h4"/><path d="M4 15h4"/><path d="M16 15h4"/></svg>,
    HardDrive: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>,
    MemoryStick: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>,
    Router: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>,
    User: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    Users: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Mail: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    MessageSquare: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Phone: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  };
  return icons[name] || <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
}

export default function AppCard({
  app,
  viewMode,
  isPinned,
  onOpen,
  onEdit,
  onTogglePin,
  onToggleHidden,
  onDelete,
  onCopyLink,
  onStatusChange,
  status,
  checking,
  openInNewTabDefault,
  accentColor,
}: AppCardProps) {
  const [showContextMenu, setShowContextMenu] = React.useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu && cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowContextMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showContextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(app, openInNewTabDefault);
    }
  };

  const IconComponent = app.iconType === "emoji" ? (
    <span className="text-2xl" role="img" aria-label={app.name}>{app.icon}</span>
  ) : (
    <LucideIcon name={app.icon} className="w-8 h-8" />
  );

  const statusColor = status ? STATUS_COLORS[status] : "text-gray-400";
  const statusLabel = status ? STATUS_LABELS[status] : "";

  const cardClasses = {
    cards: "group relative flex flex-col h-full min-h-[140px]",
    list: "group relative flex items-center gap-4 min-h-[80px]",
    compact: "group relative flex items-center gap-3 min-h-[60px] px-3",
  };

  const contentClasses = {
    cards: "flex-1 flex flex-col",
    list: "flex-1 flex items-center gap-4 min-w-0",
    compact: "flex-1 flex items-center gap-3 min-w-0",
  };

  return (
    <div
      ref={cardRef}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${app.name}${app.description ? `, ${app.description}` : ""}${status ? `, status: ${statusLabel}` : ""}`}
      className={`${cardClasses[viewMode]} bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
      style={{ borderLeft: `4px solid var(--color-${accentColor}-500)` }}
    >
      {viewMode === "cards" && (
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {IconComponent}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{app.name}</h3>
                {app.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{app.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {app.isPinned && <Pin className="w-4 h-4 text-yellow-500" aria-hidden="true" />}
              {status && (
                <span className={`flex items-center gap-1 text-xs ${statusColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                  {statusLabel}
                </span>
              )}
            </div>
          </div>

          {app.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {app.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {tag}
                </span>
              ))}
              {app.tags.length > 4 && (
                <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">+{app.tags.length - 4}</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{app.category}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onCopyLink(app.url); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Salin tautan"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(app, true); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Buka di tab baru"
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowContextMenu({ x: e.clientX, y: e.clientY }); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Menu lainnya"
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="p-3 w-full">
          <div className="flex items-center gap-4 w-full min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {IconComponent}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{app.name}</h3>
                {app.isPinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" aria-hidden="true" />}
                {status && <span className={`flex items-center gap-1 text-xs ${statusColor} flex-shrink-0`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{statusLabel}</span>}
              </div>
              {app.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{app.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); onCopyLink(app.url); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Salin tautan"><Copy size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onOpen(app, true); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Buka di tab baru"><ExternalLink size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); setShowContextMenu({ x: e.clientX, y: e.clientY }); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Menu lainnya"><MoreVertical size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {viewMode === "compact" && (
        <div className="p-2 w-full">
          <div className="flex items-center gap-3 w-full min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {IconComponent}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{app.name}</h3>
                {app.isPinned && <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" aria-hidden="true" />}
                {status && <span className={`flex items-center gap-1 text-xs ${statusColor} flex-shrink-0`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{statusLabel}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); onOpen(app, openInNewTabDefault); }} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Buka"><ExternalLink size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); setShowContextMenu({ x: e.clientX, y: e.clientY }); }} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Menu lainnya"><MoreVertical size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {showContextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px] animate-fade-in"
          style={{ left: showContextMenu.x, top: showContextMenu.y }}
          role="menu"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(app, openInNewTabDefault); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <ExternalLink size={14} />
            {openInNewTabDefault ? "Buka" : "Buka di tab baru"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(app, !openInNewTabDefault); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <ExternalLink size={14} />
            {openInNewTabDefault ? "Buka di tab yang sama" : "Buka di tab baru"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCopyLink(app.url); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <Copy size={14} />
            Salin tautan
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(app); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <Edit size={14} />
            Ubah
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(app); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            {app.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            {app.isPinned ? "Lepas favorit" : "Sematkan favorit"}
          </button>
          {app.isBuiltIn ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHidden(app); setShowContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              role="menuitem"
            >
              {app.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              {app.isHidden ? "Tampilkan" : "Sembunyikan"}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(app); setShowContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              role="menuitem"
            >
              <Trash2 size={14} />
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );
}