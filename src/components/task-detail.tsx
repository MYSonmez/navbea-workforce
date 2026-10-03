"use client";
import { useState } from "react";
import { formatNumber, person } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import type { Role, Task } from "@/lib/types";
import { Avatar, Badge, Icon, Modal, Progress } from "./ui";
import { PagedList, Tabs } from "./pagination";

export function TaskDetail({
  task,
  role,
  onClose,
  onIssue,
  onProduction,
  onToast,
}: {
  task: Task;
  role: Role;
  onClose: () => void;
  onIssue: () => void;
  onProduction: () => void;
  onToast: (message: string) => void;
}) {
  const { state, updateTask, resolveIssue, acknowledge } = useDemo();
  const isOwnForeman = role === "formen" && task.foremanId === "f1";
  const canStart = task.status === "planned" && isOwnForeman;
  const [tab, setTab] = useState<"task" | "crew" | "issues" | "review" | "ready">(
    role === "yonetici" && task.status === "review" ? "review" : canStart ? "ready" : "task",
  );
  const [checks, setChecks] = useState([task.ready, task.ready, task.ready]);
  const [reviewNote, setReviewNote] = useState("");
  const issues = state.issues.filter((i) => i.taskId === task.id && !i.resolved);
  const overlapping = state.tasks.some(
    (t) =>
      t.id !== task.id &&
      (t.status === "active" || t.status === "blocked") &&
      t.workerIds.some((id) => task.workerIds.includes(id)),
  );
  function change(patch: Partial<Task>, title: string) {
    updateTask(task.id, patch, { title, description: task.title, kind: "success" });
    onToast(title);
  }
  const tabs: { value: typeof tab; label: string; count?: number }[] = [
    { value: "task", label: "Görev" },
    { value: "crew", label: "Ekip", count: task.workerIds.length },
    { value: "issues", label: "Engeller", count: issues.length },
  ];
  if (canStart) tabs.push({ value: "ready", label: "Hazırlık" });
  if (role === "yonetici" && task.status === "review")
    tabs.push({ value: "review", label: "Onay" });
  return (
    <Modal title={task.title} subtitle={`${task.id} · ${task.zone}`} onClose={onClose} wide>
      <div className="detail-body">
        <div className="detail-status">
          <Badge status={task.status} />
          <span className="outline-chip">{task.trade}</span>
        </div>
        <Tabs value={tab} onChange={setTab} items={tabs} label="Görev detayı bölümü" />
        <div className="detail-tab-content">
          {tab === "task" && (
            <div className="task-detail-summary">
              <div className="detail-metrics">
                <div>
                  <small>Çalışma</small>
                  <strong>
                    {task.start}–{task.end}
                  </strong>
                </div>
                <div>
                  <small>Hedef</small>
                  <strong>
                    {formatNumber(task.target)} {task.unit}
                  </strong>
                </div>
                <div>
                  <small>Üretim</small>
                  <strong>
                    {formatNumber(task.actual)} {task.unit}
                  </strong>
                </div>
              </div>
              <Progress value={(task.actual / task.target) * 100} />
              <p className="task-note">{task.note}</p>
              {task.reviewNote && (
                <div className="review-note">
                  <strong>Düzeltme notu</strong>
                  <p>{task.reviewNote}</p>
                </div>
              )}
              {role === "isci" && (
                <p className="form-hint">İş başlangıcını ve üretim kaydını formen yönetir.</p>
              )}
            </div>
          )}
          {tab === "ready" && canStart && (
            <div className="readiness-box">
              <h3>Başlangıç kontrolü</h3>
              {["Malzeme hazır", "Ekipman uygun", "Çalışma alanı güvenli ve hazır"].map(
                (label, i) => (
                  <label key={label} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={checks[i]}
                      onChange={(e) =>
                        setChecks(checks.map((v, index) => (index === i ? e.target.checked : v)))
                      }
                    />
                    {label}
                  </label>
                ),
              )}
              {overlapping && (
                <p className="form-warning">
                  Bu ekipte başka bir işte çalışan kişiler var. Mevcut işi kapatmadan yeni iş
                  başlatılamaz.
                </p>
              )}
            </div>
          )}
          {tab === "crew" && (
            <>
              <div className="person-line detail-foreman">
                <Avatar user={person(task.foremanId)} />
                <span>
                  <strong>{person(task.foremanId).name}</strong>
                  <small>Sorumlu formen</small>
                </span>
              </div>
              <PagedList
                items={task.workerIds}
                rowHeight={54}
                label="Atanan çalışanlar"
                renderItem={(id) => (
                  <div key={id} className="person-line crew-row">
                    <Avatar user={person(id)} small />
                    <span>
                      <strong>{person(id).name}</strong>
                      <small>{person(id).trade}</small>
                    </span>
                  </div>
                )}
              />
            </>
          )}
          {tab === "issues" && (
            <PagedList
              items={issues}
              rowHeight={160}
              label="Engeller"
              empty={
                <div className="inline-success">
                  <Icon name="checks" />
                  Açık engel yok.
                </div>
              }
              renderItem={(issue) => (
                <div key={issue.id} className="issue-detail">
                  <strong>
                    {issue.reason} · {issue.workerIds.length} çalışan
                  </strong>
                  <p>{issue.note}</p>
                  <small>
                    {issue.time} · {issue.workerIds.map((id) => person(id).name).join(", ")}
                  </small>
                  {isOwnForeman && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        resolveIssue(issue.id);
                        onToast("Engel kapatıldı.");
                      }}
                    >
                      Kontrol ettim, giderildi
                    </button>
                  )}
                </div>
              )}
            />
          )}
          {tab === "review" && (
            <div className="review-controls">
              <div className="detail-metrics">
                <div>
                  <small>Üretim</small>
                  <strong>
                    {formatNumber(task.actual)} {task.unit}
                  </strong>
                </div>
                <div>
                  <small>İşçi-saat</small>
                  <strong>{formatNumber(task.laborHours)}</strong>
                </div>
                <div>
                  <small>Bekleme dahil</small>
                  <strong>{formatNumber(task.waitingHours)} sa</strong>
                </div>
              </div>
              <label className="field" htmlFor="review-note">
                Düzeltme gerekçesi
                <textarea
                  id="review-note"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Düzeltmeye gönderirken gerekçe yazın."
                  rows={3}
                  maxLength={300}
                />
              </label>
              <p className="form-hint">Bekleme saati toplam işçi-saatin içindedir.</p>
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer">
        {role === "isci" && (
          <button
            className="btn btn-primary"
            disabled={state.acknowledged.includes(task.id)}
            onClick={() => {
              acknowledge(task.id);
              onToast("Görev okundu olarak işaretlendi.");
            }}
          >
            {state.acknowledged.includes(task.id) ? "Görevi gördüm" : "Görevi gördüm, anladım"}
          </button>
        )}
        {canStart && (
          <button
            className="btn btn-primary"
            disabled={!checks.every(Boolean) || overlapping}
            onClick={() => {
              change({ status: "active", ready: true }, "İş başlangıcı kaydedildi");
              setTab("task");
            }}
          >
            İşe başla
          </button>
        )}
        {isOwnForeman && (task.status === "active" || task.status === "blocked") && (
          <>
            <button className="btn btn-secondary" onClick={onIssue}>
              <Icon name="warning" size={16} />
              Engel bildir
            </button>
            <button className="btn btn-primary" onClick={onProduction}>
              Üretim / gün sonu gir
            </button>
          </>
        )}
        {role === "yonetici" && task.status === "review" && (
          <>
            <button
              className="btn btn-secondary"
              disabled={!reviewNote.trim()}
              onClick={() =>
                change(
                  { status: "active", reviewNote: reviewNote.trim() },
                  "Kayıt düzeltmeye gönderildi",
                )
              }
            >
              Düzeltmeye gönder
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                change({ status: "completed", reviewNote: undefined }, "Gün sonu kaydı onaylandı")
              }
            >
              Kaydı onayla
            </button>
          </>
        )}
        <button className="btn btn-ghost" onClick={onClose}>
          Kapat
        </button>
      </div>
    </Modal>
  );
}
