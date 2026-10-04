"use client";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/lib/demo-store";
import { useSession } from "@/lib/session";
import { person } from "@/lib/demo-data";
import { taskTeam } from "@/lib/teams";
import { conflictingWorkers } from "@/lib/task-rules";
import type { Task } from "@/lib/types";
import { Avatar, Modal } from "./ui";
import { PagedList } from "./pagination";

export function CrewForm({
  task,
  onClose,
  onToast,
}: {
  task: Task;
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const { state, assignWorkers } = useDemo();
  const { user } = useSession();
  const team = taskTeam(task, state.teams);
  const candidates = team?.workerIds || task.workerIds;
  const [selected, setSelected] = useState(task.workerIds.filter((id) => candidates.includes(id)));
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !assignWorkers(task.id, selected, user.id)) {
      setError(
        "En az bir çalışan seçin. Yalnızca kendi planlanmış görevinizi düzenleyebilirsiniz.",
      );
      return;
    }
    onToast("Görevdeki çalışanlar kaydedildi.");
    onClose();
  }
  return (
    <Modal
      title="Görevdeki çalışanlar"
      subtitle={`${task.title} · ${team?.name || task.trade}`}
      onClose={onClose}
      wide
    >
      <form className="modal-form" onSubmit={submit}>
        <div className="form-body">
          <div className="crew-heading">
            {selected.length} / {candidates.length} kişi seçildi
          </div>
          <PagedList
            items={candidates}
            rowHeight={64}
            minColumnWidth={245}
            gap={6}
            className="crew-grid"
            label="Görev çalışanları"
            renderItem={(id) => {
              const p = person(id);
              const busy = conflictingWorkers(state.tasks, task.id, [id]).length > 0;
              return (
                <label
                  className={`crew-option ${selected.includes(id) ? "is-selected" : ""}`}
                  key={id}
                >
                  <input
                    type="checkbox"
                    aria-label={`${p.name} göreve seç`}
                    checked={selected.includes(id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? [...selected, id] : selected.filter((v) => v !== id),
                      )
                    }
                  />
                  <Avatar user={p} small />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{busy ? "Başka işte çalışıyor" : p.trade}</small>
                  </span>
                </label>
              );
            }}
          />
          <p className="form-hint">
            Başka işte çalışan kişi seçilebilir; mevcut işi açıkken yeni iş başlatılamaz.
          </p>
          {error && <p role="alert">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn btn-primary" disabled={!selected.length}>
            Çalışanları kaydet
          </button>
        </div>
      </form>
    </Modal>
  );
}
