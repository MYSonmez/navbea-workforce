"use client";
import { useState } from "react";
import { formatNumber, person } from "@/lib/demo-data";
import type { Task, TaskStatus } from "@/lib/types";
import { Avatar, Badge, Empty, Icon, Progress } from "./ui";
import { PagedList, Tabs } from "./pagination";

export function TaskList({
  tasks,
  onSelect,
  compact = false,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const visible = tasks.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      `${t.title} ${t.zone} ${t.id}`
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <div className={`task-list ${compact ? "task-list-compact" : ""}`}>
      {!compact && (
        <div className="list-toolbar">
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: "all", label: "Tümü", count: tasks.length },
              { value: "active", label: "Aktif" },
              { value: "blocked", label: "Bekleyen" },
            ]}
            label="Görev durumuna göre filtrele"
          />
          <label className="search-box">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Görev veya bölge ara"
              aria-label="Görev ara"
            />
          </label>
        </div>
      )}
      <PagedList
        key={`${query}:${filter}`}
        items={visible}
        rowHeight={compact ? 66 : 80}
        label="Görevler"
        empty={<Empty title="Görev bulunamadı" text="Aramayı veya durum filtresini değiştirin." />}
        renderItem={(task) => (
          <button
            className={`task-row ${compact ? "task-row-compact" : ""}`}
            key={task.id}
            onClick={() => onSelect(task)}
            aria-label={`${task.title}, detayları aç`}
          >
            <span className="trade-icon trade-blue">
              <Icon name="tasks" size={19} />
            </span>
            <span className="task-title-cell">
              <strong>{task.title}</strong>
              <small>
                {task.zone}
                {!compact && ` · ${task.start}–${task.end}`}
              </small>
            </span>
            <span className="task-team-cell">
              <Avatar user={person(task.foremanId)} small />
              <small>{task.workerIds.length} kişi</small>
            </span>
            <span className="task-progress-cell">
              <strong>
                {formatNumber(task.actual)} / {formatNumber(task.target)} {task.unit}
              </strong>
              <Progress value={(task.actual / task.target) * 100} />
            </span>
            <span className="task-status-cell">
              <Badge status={task.status} />
            </span>
            <Icon name="right" size={16} />
          </button>
        )}
      />
    </div>
  );
}
