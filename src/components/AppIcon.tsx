"use client";

import React, { useState } from "react";
import { LucideIcons, isValidLucideIcon } from "@/components/icons";

interface AppIconProps {
  icon: string;
  iconType?: "emoji" | "lucide" | "image" | "url" | "brand";
  iconSrc?: string;
  name: string;
  className?: string;
  size?: number;
}

export function AppIcon({
  icon,
  iconType = "brand",
  iconSrc,
  name,
  className = "w-12 h-12",
  size = 56,
}: AppIconProps) {
  const [imgError, setImgError] = useState(false);

  // Generate monogram fallback
  const getMonogram = (str: string) => {
    if (!str) return "V";
    const words = str.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      "from-blue-500 to-indigo-600",
      "from-violet-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-cyan-500 to-blue-600",
    ];
    return gradients[Math.abs(hash) % gradients.length];
  };

  // If iconSrc is provided (PNG/JPG URL), use it
  if (iconSrc && !imgError) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-2 border border-slate-200/50 dark:border-slate-700/50 shadow-sm ${className}`}>
        <img
          src={iconSrc}
          alt={name}
          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // If icon starts with /icons/ or is a known brand icon name
  const isBrandOrImage =
    iconType === "brand" ||
    iconType === "image" ||
    icon.startsWith("/") ||
    ["immich", "vaultwarden", "cockpit", "filebrowser"].includes(icon.toLowerCase());

  if (isBrandOrImage && !imgError) {
    const src = icon.startsWith("/")
      ? icon
      : `/icons/${icon.toLowerCase().replace(/[^a-z0-9]/g, "")}.png`;

    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-2 border border-slate-200/50 dark:border-slate-700/50 shadow-sm ${className}`}>
        <img
          src={src}
          alt={name}
          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Lucide Icon
  if (iconType === "lucide" || isValidLucideIcon(icon)) {
    const LucideComp = isValidLucideIcon(icon) ? LucideIcons[icon as keyof typeof LucideIcons] : null;
    if (LucideComp) {
      return (
        <div className={`flex items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2 border border-indigo-500/20 ${className}`}>
          <LucideComp className="w-full h-full stroke-[1.75]" />
        </div>
      );
    }
  }

  // Emoji
  if (iconType === "emoji" && icon && !imgError) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-2xl p-2 border border-slate-200/50 dark:border-slate-700/50 ${className}`}>
        <span role="img" aria-label={name}>
          {icon}
        </span>
      </div>
    );
  }

  // Monogram Fallback
  const monogram = getMonogram(name);
  const gradient = getGradient(name);

  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white font-bold tracking-wider shadow-sm p-2 ${className}`}
    >
      <span className="text-lg select-none">{monogram}</span>
    </div>
  );
}