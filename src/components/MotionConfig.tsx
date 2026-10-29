"use client";

import { MotionConfig } from "motion/react";
import { useSettingsSelector } from "@/hooks/useSettingsStore";

export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  const animations = useSettingsSelector((s) => s.animations);
  const reducedMotion = animations === "reduced" ? "user" : "never";
  
  return (
    <MotionConfig reducedMotion={reducedMotion}>
      {children}
    </MotionConfig>
  );
}