"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { useSettingsSelector } from "@/hooks/useSettingsStore";

export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  const animations = useSettingsSelector((s) => s.animations);
  const reducedMotion = animations === "reduced" ? "always" : animations === "follow" ? "user" : "never";

  useEffect(() => {
    document.documentElement.setAttribute("data-motion", animations === "follow" ? "follow" : animations === "reduced" ? "reduced" : "full");
  }, [animations]);

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      {children}
    </MotionConfig>
  );
}