import type { DemoState, Person, Task } from "./types";
import { taskTeam } from "./teams";

export function tasksForUser(tasks: Task[], user: Person) {
  return tasks.filter(
    (t) =>
      user.role === "yonetici" ||
      (user.role === "formen" ? t.foremanId === user.id : t.workerIds.includes(user.id)),
  );
}
export function conflictingWorkers(tasks: Task[], taskId: string, workerIds: string[]) {
  return [
    ...new Set(
      tasks
        .filter((t) => t.id !== taskId && (t.status === "active" || t.status === "blocked"))
        .flatMap((t) => t.workerIds)
        .filter((id) => workerIds.includes(id)),
    ),
  ];
}
export function canStartTask(state: DemoState, task: Task) {
  return (
    task.status === "planned" &&
    task.workerIds.length > 0 &&
    task.workerIds.every((id) => taskTeam(task, state.teams)?.workerIds.includes(id)) &&
    !state.issues.some((i) => i.taskId === task.id && !i.resolved) &&
    conflictingWorkers(state.tasks, task.id, task.workerIds).length === 0
  );
}
