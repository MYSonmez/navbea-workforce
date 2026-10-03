"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { initialState } from "./demo-data";
import type { Activity, DemoState, Issue, Task } from "./types";

const STORAGE_KEY = "navbea-workforce-demo-v1";
let cachedState: DemoState | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): DemoState {
  if (cachedState) return cachedState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        Array.isArray(parsed.tasks) &&
        Array.isArray(parsed.issues) &&
        Array.isArray(parsed.activities) &&
        Array.isArray(parsed.acknowledged) &&
        Array.isArray(parsed.readNotifications)
      ) {
        cachedState = parsed;
        return cachedState!;
      }
    }
  } catch {
    /* A corrupted demo cache falls back to the seed. */
  }
  cachedState = structuredClone(initialState);
  return cachedState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cachedState = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setState(update: DemoState | ((state: DemoState) => DemoState)) {
  cachedState = typeof update === "function" ? update(getSnapshot()) : update;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  } catch {
    /* Demo remains usable without browser storage. */
  }
  listeners.forEach((listener) => listener());
}
interface DemoContextValue {
  state: DemoState;
  hydrated: boolean;
  updateTask: (id: string, patch: Partial<Task>, activity?: Omit<Activity, "id" | "time">) => void;
  addTask: (task: Task) => void;
  addIssue: (issue: Omit<Issue, "id" | "time" | "resolved">) => void;
  resolveIssue: (id: string) => void;
  acknowledge: (id: string) => void;
  markRead: () => void;
  reset: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);
function time() {
  return new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
function activity(value: Omit<Activity, "id" | "time">): Activity {
  return { ...value, id: crypto.randomUUID(), time: time() };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => initialState);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const value: DemoContextValue = {
    state,
    hydrated,
    updateTask(id, patch, event) {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        activities: event ? [activity(event), ...s.activities] : s.activities,
      }));
    },
    addTask(task) {
      setState((s) => ({
        ...s,
        tasks: [task, ...s.tasks],
        activities: [
          activity({
            title: "Yeni görev atandı",
            description: `${task.title} · ${task.workerIds.length} çalışan`,
            kind: "info",
          }),
          ...s.activities,
        ],
      }));
    },
    addIssue(issue) {
      setState((s) => ({
        ...s,
        issues: [{ ...issue, id: crypto.randomUUID(), resolved: false, time: time() }, ...s.issues],
        tasks: s.tasks.map((t) => (t.id === issue.taskId ? { ...t, status: "blocked" } : t)),
        activities: [
          activity({
            title: `${issue.reason} engeli bildirildi`,
            description: `${s.tasks.find((t) => t.id === issue.taskId)?.title} · ${issue.workerIds.length} çalışan`,
            kind: "warning",
          }),
          ...s.activities,
        ],
      }));
    },
    resolveIssue(id) {
      setState((s) => {
        const issue = s.issues.find((i) => i.id === id);
        const issues = s.issues.map((i) => (i.id === id ? { ...i, resolved: true } : i));
        return {
          ...s,
          issues,
          tasks: s.tasks.map((t) =>
            t.id === issue?.taskId && !issues.some((i) => i.taskId === t.id && !i.resolved)
              ? { ...t, status: "active" }
              : t,
          ),
          activities: [
            activity({
              title: "Engel giderildi, işe devam",
              description: s.tasks.find((t) => t.id === issue?.taskId)?.title || "Saha güncellendi",
              kind: "success",
            }),
            ...s.activities,
          ],
        };
      });
    },
    acknowledge(id) {
      setState((s) => ({ ...s, acknowledged: [...new Set([...s.acknowledged, id])] }));
    },
    markRead() {
      setState((s) => ({ ...s, readNotifications: s.activities.map((a) => a.id) }));
    },
    reset() {
      setState(structuredClone(initialState));
    },
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
