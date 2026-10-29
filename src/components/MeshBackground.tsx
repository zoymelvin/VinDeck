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
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 50, damping: 30 });
  const springY = useSpring(y, { stiffness: 50, damping: 30 });
  
  useAnimationFrame((time) => {
    if (reducedMotion || !backgroundEffects) return;
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
  
  const orbStyle = (index: number, color: string, size: number, blur: number, delay: number) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: "50%",
    background: color,
    filter: `blur(${blur}px)`,
    opacity: isDark ? 0.15 : 0.08,
    mixBlendMode: "screen" as const,
    animation: reducedMotion ? "none" : `float-${index} ${20 + index * 5}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
  });
  
  const noiseSvg = `data:image/svg+xml;base64,${btoa(`
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
          inset: -50,
          backgroundImage: `url("${noiseSvg}")`,
          opacity: 0.5,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      
      {!reducedMotion && backgroundEffects && (
        <>
          <motion.div
            style={{
              ...orbStyle(1, isDark ? "var(--mesh-orb1)" : "var(--mesh-orb1)", 400, 80, 0),
              x: springX,
              y: springY,
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            style={orbStyle(2, isDark ? "var(--mesh-orb2)" : "var(--mesh-orb2)", 350, 80, 5)}
            animate={{
              x: [-30, 30, -30],
              y: [-20, 20, -20],
              scale: [1, 1.03, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            style={orbStyle(3, isDark ? "var(--mesh-orb3)" : "var(--mesh-orb3)", 300, 60, 10)}
            animate={{
              x: [20, -20, 20],
              y: [30, -30, 30],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <motion.div
            style={orbStyle(4, isDark ? "var(--mesh-orb4)" : "var(--mesh-orb4)", 250, 60, 15)}
            animate={{
              x: [-15, 15, -15],
              y: [-25, 25, -25],
            }}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          />
        </>
      )}
      
      {children}
    </div>
  );
}