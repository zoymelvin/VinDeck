"use client";

import { motion, useMotionValue, useSpring, useAnimationFrame } from "motion/react";
import { useSettingsSelector } from "@/hooks/useSettingsStore";
import { useTheme } from "@/hooks/useTheme";
import { useSyncExternalStore } from "react";

export function MeshBackground({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  const { theme } = useTheme();
  const backgroundEffects = useSettingsSelector((s) => s.backgroundEffects);
  const animations = useSettingsSelector((s) => s.animations);
  const reducedMotion = animations === "reduced";

  const isDark = useSyncExternalStore(
    (callback) => {
      if (theme === "system") {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", callback);
        return () => mq.removeEventListener("change", callback);
      }
      return () => {};
    },
    () => {
      if (theme === "dark") return true;
      if (theme === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    () => false
  );

  // Check for ?fx=off
  const fxOff = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fx") === "off";

  const enabled = backgroundEffects && !reducedMotion && !fxOff;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 50, damping: 30 });
  const springY = useSpring(y, { stiffness: 50, damping: 30 });

  useAnimationFrame((time) => {
    if (!enabled) return;
    const t = time / 1000;
    x.set(Math.sin(t * 0.15) * 30 + Math.cos(t * 0.08) * 20);
    y.set(Math.cos(t * 0.12) * 25 + Math.sin(t * 0.06) * 15);
  });

  const meshStyle = {
    position: "fixed" as const,
    inset: 0,
    zIndex: -1,
    overflow: "hidden",
    pointerEvents: "none" as const,
  };

  const orbStyle = (size: number, color: string) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    transform: "translate(-50%, -50%)",
  });

  const grainSvg = `data:image/svg+xml;base64,${btoa(`
    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="0.03"/>
    </svg>
  `)}`;

  return (
    <div style={meshStyle} className={className} aria-hidden="true">
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("${grainSvg}")`,
          opacity: 0.5,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {enabled && (
        <>
          <motion.div
            style={{
              ...orbStyle(600, isDark ? "rgba(102, 126, 234, 0.28)" : "rgba(102, 126, 234, 0.22)"),
              left: "20%",
              top: "30%",
              x: springX,
              y: springY,
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            style={{
              ...orbStyle(520, isDark ? "rgba(118, 75, 162, 0.24)" : "rgba(236, 72, 153, 0.16)"),
              left: "70%",
              top: "60%",
            }}
            animate={{
              x: [-20, 20, -20],
              y: [-15, 15, -15],
              scale: [1, 1.03, 1],
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            style={{
              ...orbStyle(400, isDark ? "rgba(56, 189, 248, 0.14)" : "rgba(16, 185, 129, 0.14)"),
              left: "50%",
              top: "80%",
            }}
            animate={{
              x: [15, -15, 15],
              y: [10, -10, 10],
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
        </>
      )}

      {children}
    </div>
  );
}