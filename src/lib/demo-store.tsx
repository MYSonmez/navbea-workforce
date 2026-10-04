"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { initialState } from "./demo-data";
import type { Activity, DemoState, Issue, Task } from "./types";
import { taskTeam, teams } from "./teams";
import { useSession } from "./session";
import { canStartTask, conflictingWorkers } from "./task-rules";
import { useSite } from "./sites";

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
        cachedState = {
          ...parsed,
          teams: Array.isArray(parsed.teams) ? parsed.teams : structuredClone(teams),
        };
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
  assignWorkers: (taskId: string, workerIds: string[], foremanId: string) => boolean;
  startTask: (taskId: string, checks: boolean[], foremanId: string) => boolean;
  saveTeam: (teamId: string, name: string, workerIds: string[]) => boolean;
  addIssue: (issue: Omit<Issue, "id" | "time" | "resolved">) => void;
  resolveIssue: (id: string) => void;
  redirectIssue: (issueId: string, targetId: string) => boolean;
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
  const { site } = useSite();
  const { user } = useSession();
  const state = useSyncExternalStore(subscribe, getSnapshot, () => initialState);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const value: DemoContextValue = {
    state: {
      ...state,
      tasks: state.tasks.filter((t) => (t.siteId || "merkez") === site.id),
      issues: state.issues.filter((issue) =>
        state.tasks.some((t) => t.id === issue.taskId && (t.siteId || "merkez") === site.id),
      ),
    },
    hydrated,
    updateTask(id, patch, event) {
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                ...(event
                  ? {
                      history: [
                        {
                          id: crypto.randomUUID(),
                          title: event.title,
                          time: time(),
                          actual: patch.actual ?? t.actual,
                          laborHours: patch.laborHours ?? t.laborHours,
                          waitingHours: patch.waitingHours ?? t.waitingHours,
                          note: patch.reviewNote ?? patch.productionNote,
                        },
                        ...(t.history || []),
                      ],
                    }
                  : {}),
              }
            : t,
        ),
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
            description: `${task.title} · ${taskTeam(task, s.teams)?.name || task.trade} · Çalışan seçimi bekleniyor`,
            kind: "info",
          }),
          ...s.activities,
        ],
      }));
    },
    assignWorkers(taskId, workerIds, foremanId) {
      const s = getSnapshot();
      const task = s.tasks.find((t) => t.id === taskId);
      const selected = [...new Set(workerIds)];
      if (!task || task.status !== "planned" || task.foremanId !== foremanId || !selected.length)
        return false;
      const team = taskTeam(task, s.teams);
      if (
        !team ||
        selected.some((id) => !team.workerIds.includes(id)) ||
        s.issues.some((i) => i.taskId === taskId && !i.resolved)
      )
        return false;
      value.updateTask(
        taskId,
        { workerIds: selected, ready: false },
        {
          title: "Görev çalışanları belirlendi",
          description: `${task.title} · ${selected.length} kişi`,
          kind: "info",
        },
      );
      return true;
    },
    saveTeam(teamId, name, workerIds) {
      const snapshot = getSnapshot();
      const team = snapshot.teams.find((t) => t.id === teamId);
      const title = name.trim();
      const members = [...new Set(workerIds)];
      const allowed = teams.find((t) => t.id === teamId)?.workerIds || [];
      if (
        !team ||
        user?.role !== "formen" ||
        team.foremanId !== user.id ||
        !site.teamIds.includes(teamId) ||
        !title ||
        title.length > 48 ||
        !members.length ||
        members.some((id) => !allowed.includes(id)) ||
        snapshot.teams.some(
          (t) =>
            t.id !== teamId &&
            t.name.toLocaleLowerCase("tr-TR") === title.toLocaleLowerCase("tr-TR"),
        )
      )
        return false;
      setState((s) => ({
        ...s,
        teams: s.teams.map((t) =>
          t.id === teamId ? { ...t, name: title, workerIds: members } : t,
        ),
      }));
      return true;
    },
    startTask(taskId, checks, foremanId) {
      const s = getSnapshot();
      const task = s.tasks.find((t) => t.id === taskId);
      if (
        !task ||
        task.foremanId !== foremanId ||
        checks.length !== 3 ||
        !checks.every(Boolean) ||
        !canStartTask(s, task)
      )
        return false;
      value.updateTask(
        taskId,
        { status: "active", ready: true, startedAt: time() },
        { title: "İş başlangıcı kaydedildi", description: task.title, kind: "success" },
      );
      return true;
    },
    addIssue(issue) {
      setState((s) => ({
        ...s,
        issues: [{ ...issue, id: crypto.randomUUID(), resolved: false, time: time() }, ...s.issues],
        tasks: s.tasks.map((t) =>
          t.id === issue.taskId && t.status !== "planned" ? { ...t, status: "blocked" } : t,
        ),
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
        const issues = s.issues.map((i) =>
          i.id === id ? { ...i, resolved: true, closedAt: time() } : i,
        );
        return {
          ...s,
          issues,
          tasks: s.tasks.map((t) =>
            t.id === issue?.taskId && !issues.some((i) => i.taskId === t.id && !i.resolved)
              ? { ...t, status: t.status === "planned" ? "planned" : "active" }
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
    redirectIssue(issueId, targetId) {
      const s = getSnapshot();
      const issue = s.issues.find((i) => i.id === issueId && !i.resolved);
      const source = s.tasks.find((t) => t.id === issue?.taskId);
      const target = s.tasks.find((t) => t.id === targetId);
      if (
        !issue ||
        !source ||
        !target ||
        source.id === target.id ||
        target.status !== "planned" ||
        target.trade !== source.trade
      )
        return false;
      const moved = issue.workerIds;
      // Transfer only people who are waiting for this issue. Other active jobs stay protected.
      if (conflictingWorkers(s.tasks, source.id, moved).length > 0) return false;
      const issues = s.issues.map((i) =>
        i.id === issueId ? { ...i, resolved: true, closedAt: time(), redirectedTo: targetId } : i,
      );
      const timestamp = time();
      setState({
        ...s,
        issues,
        tasks: s.tasks.map((t) =>
          t.id === source.id
            ? {
                ...t,
                workerIds: t.workerIds.filter((id) => !moved.includes(id)),
                status:
                  t.status === "planned"
                    ? "planned"
                    : issues.some((i) => i.taskId === t.id && !i.resolved)
                      ? "blocked"
                      : "active",
                history: [
                  {
                    id: crypto.randomUUID(),
                    title: `${moved.length} çalışan ${target.zone} görevine yönlendirildi`,
                    time: timestamp,
                    actual: t.actual,
                    laborHours: t.laborHours,
                    waitingHours: t.waitingHours,
                  },
                  ...(t.history || []),
                ],
              }
            : t.id === targetId
              ? {
                  ...t,
                  workerIds: [
                    ...new Set([
                      ...t.workerIds.filter((id) => !source.workerIds.includes(id)),
                      ...moved,
                    ]),
                  ],
                  ready: false,
                  history: [
                    {
                      id: crypto.randomUUID(),
                      title: "Yönlendirme alındı; formen hazırlığı kontrol edecek",
                      time: timestamp,
                      actual: t.actual,
                      laborHours: t.laborHours,
                      waitingHours: t.waitingHours,
                    },
                    ...(t.history || []),
                  ],
                }
              : t,
        ),
        activities: [
          activity({
            title: "Ekip yönlendirmesi onaylandı",
            description: `${source.zone} → ${target.zone} · ${moved.length} çalışan · Formen teslimi bekleniyor`,
            kind: "info",
          }),
          ...s.activities,
        ],
      });
      return true;
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
