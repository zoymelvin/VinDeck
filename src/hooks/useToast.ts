"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  action?: { label: string; onClick: () => void };
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, action?: Toast["action"]) => {
    addToast({ message, type: "success", action, duration: 5000 });
  }, [addToast]);

  const showError = useCallback((message: string) => {
    addToast({ message, type: "error", duration: 5000 });
  }, [addToast]);

  const showInfo = useCallback((message: string) => {
    addToast({ message, type: "info", duration: 5000 });
  }, [addToast]);

  const showWarning = useCallback((message: string) => {
    addToast({ message, type: "warning", duration: 5000 });
  }, [addToast]);

  const showUndo = useCallback(
    (message: string, onUndo: () => void) => {
      addToast({
        message,
        type: "info",
        action: { label: "Urungkan", onClick: onUndo },
        duration: 5000,
      });
    },
    [addToast]
  );

  return { toasts, addToast, removeToast, showSuccess, showError, showInfo, showWarning, showUndo };
}