"use client";

import React, { useRef, useEffect, useState } from "react";
import { ExternalLink, Copy, Edit, Pin, PinOff, Eye, EyeOff, MoreVertical, Trash2 } from "@/components/icons";
import { AppIcon } from "@/components/AppIcon";
import type { App as AppType, AccentColor } from "@/lib/types";
import { strings } from "@/lib/strings";

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
  onStatusChange?: (appId: string, reachable: boolean | null) => void;
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
  checking: strings.status.checking,
  reachable: strings.status.online,
  unreachable: strings.status.offline,
};

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
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
  status,
  checking,
  openInNewTabDefault,
  accentColor,
}: AppCardProps) {
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number } | null>(null);
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
    e.stopPropagation();
    setShowContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(app, openInNewTabDefault);
    }
  };

  const statusColor = status ? STATUS_COLORS[status] : "text-gray-400";
  const statusLabel = status ? STATUS_LABELS[status] : "";

  const hostname = extractHostname(app.url);

  const cardClasses = {
    cards: "group relative flex flex-col h-full min-h-[140px]",
    list: "group relative flex items-center gap-4 min-h-[72px]",
    compact: "group relative flex items-center gap-3 min-h-[60px] px-3",
  };

  return (
    <div
      ref={cardRef}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${app.name}${app.description ? `, ${app.description}` : ""}${status ? `, status: ${statusLabel}` : ""}`}
      className={`${cardClasses[viewMode]} bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
      style={{ borderLeft: `4px solid var(--color-${accentColor}-500)` }}
    >
      {/* Stretched Link - covers entire card */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen(app, openInNewTabDefault);
        }}
        className="absolute inset-0 z-0 cursor-pointer"
        aria-label={`Open ${app.name}`}
        tabIndex={-1}
      />

      {/* Card Content */}
      {viewMode === "cards" && (
        <div className="relative z-10 p-4 pointer-events-none">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <AppIcon icon={app.icon} iconType={app.iconType === "emoji" ? "emoji" : app.iconType === "lucide" ? "lucide" : "brand"} name={app.name} className="w-10 h-10" size={40} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{app.name}</h3>
                {app.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{app.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1 pointer-events-auto">
              {isPinned && <Pin className="w-4 h-4 text-yellow-500" aria-hidden="true" />}
              {status && (
                <span className={`flex items-center gap-1 text-xs ${statusColor} px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${status === "checking" ? "animate-pulse" : ""}`} aria-hidden="true" />
                  {statusLabel}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{hostname}</span>
            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onCopyLink(app.url); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={strings.common.copy}
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(app, true); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={strings.appCard.openInNewTab}
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowContextMenu({ x: e.clientX, y: e.clientY }); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={strings.common.edit}
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="relative z-10 p-3 w-full pointer-events-none">
          <div className="flex items-center gap-4 w-full min-w-0">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <AppIcon icon={app.icon} iconType={app.iconType === "emoji" ? "emoji" : app.iconType === "lucide" ? "lucide" : "brand"} name={app.name} className="w-8 h-8" size={32} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{app.name}</h3>
                {isPinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" aria-hidden="true" />}
                {status && <span className={`flex items-center gap-1 text-xs ${statusColor} flex-shrink-0`}><span className={`w-1.5 h-1.5 rounded-full bg-current ${status === "checking" ? "animate-pulse" : ""}`} />{statusLabel}</span>}
              </div>
              {app.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{app.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); onCopyLink(app.url); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={strings.common.copy}><Copy size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onOpen(app, true); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={strings.appCard.openInNewTab}><ExternalLink size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); setShowContextMenu({ x: e.clientX, y: e.clientY }); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={strings.common.edit}><MoreVertical size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {viewMode === "compact" && (
        <div className="relative z-10 p-2 w-full pointer-events-none">
          <div className="flex items-center gap-3 w-full min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <AppIcon icon={app.icon} iconType={app.iconType === "emoji" ? "emoji" : app.iconType === "lucide" ? "lucide" : "brand"} name={app.name} className="w-6 h-6" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{app.name}</h3>
                {isPinned && <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" aria-hidden="true" />}
                {status && <span className={`flex items-center gap-1 text-xs ${statusColor} flex-shrink-0`}><span className={`w-1.5 h-1.5 rounded-full bg-current ${status === "checking" ? "animate-pulse" : ""}`} />{statusLabel}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); onOpen(app, openInNewTabDefault); }} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={strings.common.open}><ExternalLink size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); setShowContextMenu({ x: e.clientX, y: e.clientY }); }} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={strings.common.edit}><MoreVertical size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
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
            {strings.common.open}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(app, !openInNewTabDefault); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <ExternalLink size={14} />
            {strings.appCard.openInNewTab}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCopyLink(app.url); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <Copy size={14} />
            {strings.common.copy}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(app); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            <Edit size={14} />
            {strings.common.edit}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(app); setShowContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            role="menuitem"
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            {isPinned ? strings.common.unpin : strings.common.pin}
          </button>
          {app.isBuiltIn ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHidden(app); setShowContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              role="menuitem"
            >
              {app.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              {app.isHidden ? strings.common.show : strings.common.hide}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(app); setShowContextMenu(null); }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              role="menuitem"
            >
              <Trash2 size={14} />
              {strings.common.delete}
            </button>
          )}
        </div>
      )}
    </div>
  );
}