"use client";

import React, { createContext, useContext, useSyncExternalStore, useCallback, useEffect, useRef } from "react";

const SYNC_KEY = "vindeck_sync";
const OUTBOX_KEY = "vindeck_outbox";

type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  pendingOps: number;
}

type Listener = () => void;

function createSyncStore() {
  const subscribers = new Set<Listener>();
  let state: SyncState = { status: "idle", lastSyncedAt: null, pendingOps: 0 };

  const notify = () => subscribers.forEach((cb) => cb());

  const getSnapshot = () => state;
  const subscribe = (cb: Listener) => {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  };

  const setStatus = (status: SyncState["status"]) => {
    state = { ...state, status };
    notify();
  };

  const setPendingOps = (count: number) => {
    state = { ...state, pendingOps: count };
    notify();
  };

  const setLastSyncedAt = (ts: number | null) => {
    state = { ...state, lastSyncedAt: ts };
    notify();
  };

  return { getSnapshot, subscribe, setStatus, setPendingOps, setLastSyncedAt };
}

const syncStore = createSyncStore();

export function useSync() {
  return useSyncExternalStore(syncStore.subscribe, syncStore.getSnapshot, syncStore.getSnapshot);
}

export function useSyncActions() {
  const online = typeof window !== "undefined" ? window.navigator.onLine : true;

  const enqueueOp = useCallback((op: { opId: string; op: "put" | "delete"; kind: string; id: string; baseVersion: number; data?: Record<string, unknown> }) => {
    if (typeof window === "undefined") return;
    try {
      const outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
      outbox.push(op);
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
      syncStore.setPendingOps(outbox.length);
    } catch {
      // quota exceeded
    }
  }, []);

  const flushOutbox = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) return;
    try {
      const raw = localStorage.getItem(OUTBOX_KEY);
      if (!raw) return;
      const outbox = JSON.parse(raw);
      if (outbox.length === 0) return;

      syncStore.setStatus("syncing");
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ops: outbox }),
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem(OUTBOX_KEY);
        syncStore.setPendingOps(0);
        syncStore.setLastSyncedAt(Date.now());
        syncStore.setStatus("synced");
      } else {
        syncStore.setStatus("error");
      }
    } catch {
      syncStore.setStatus("offline");
    }
  }, []);

  const syncNow = useCallback(async () => {
    await flushOutbox();
  }, [flushOutbox]);

  useEffect(() => {
    const handleOnline = () => flushOutbox();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") flushOutbox();
    };
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [flushOutbox]);

  useEffect(() => {
    if (online) {
      flushOutbox();
    } else {
      syncStore.setStatus("offline");
    }
  }, [online, flushOutbox]);

  return { enqueueOp, flushOutbox, syncNow, useSync };
}
