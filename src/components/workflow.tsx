import type { Task } from "@/lib/types";
import { Icon } from "./ui";

export function TaskWorkflow({ task }: { task: Task }) {
  const stage =
    task.status === "planned"
      ? 0
      : task.status === "review"
        ? 2
        : task.status === "completed"
          ? 3
          : 1;
  return (
    <ol className="task-workflow" aria-label="Görevin günlük akışı">
      {["Atandı", "Sahada", "Gün sonu", "Onaylandı"].map((label, index) => (
        <li
          key={label}
          className={index < stage ? "is-done" : index === stage ? "is-current" : ""}
          aria-current={index === stage ? "step" : undefined}
        >
          <span>{index < stage ? <Icon name="check" size={12} /> : index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
