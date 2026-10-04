"use client";
import { useState } from "react";
import { formatNumber, person } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import type { Role, Task } from "@/lib/types";
import { Avatar, Badge, Icon, Modal, Progress } from "./ui";
import { PagedList, Tabs } from "./pagination";
import { TaskWorkflow } from "./workflow";
import { useSession } from "@/lib/session";
import { canStartTask, conflictingWorkers } from "@/lib/task-rules";
import { taskTeam } from "@/lib/teams";
import { ReadinessChecks } from "./preparation";

export function TaskDetail({
  task,
  role,
  onClose,
  onIssue,
  onProduction,
  onToast,
  onRedirect,
  onCrew,
}: {
  task: Task;
  role: Role;
  onClose: () => void;
  onIssue: () => void;
  onProduction: () => void;
  onToast: (message: string) => void;
  onRedirect: (issueId: string) => void;
  onCrew: () => void;
}) {
  const { state, updateTask, resolveIssue, acknowledge, startTask } = useDemo();
  const { user } = useSession();
  const isOwnForeman = role === "formen" && task.foremanId === user?.id;
  const canStart = task.status === "planned" && isOwnForeman;
  const [tab, setTab] = useState<"task" | "crew" | "issues" | "review" | "ready" | "history">(
    role === "yonetici" && task.status === "review"
      ? "review"
      : role === "yonetici" && task.status === "blocked"
        ? "issues"
        : canStart
          ? "ready"
          : "task",
  );
  const [checks, setChecks] = useState([task.ready, task.ready, task.ready]);
  const [reviewNote, setReviewNote] = useState("");
  const issues = state.issues.filter((i) => i.taskId === task.id && !i.resolved);
  const overlapping = conflictingWorkers(state.tasks, task.id, task.workerIds).length > 0;
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
  tabs.push({ value: "history", label: "Geçmiş" });
  return (
    <Modal title={task.title} subtitle={`${task.id} · ${task.zone}`} onClose={onClose} wide>
      <div className="detail-body">
        <div className="detail-status">
          <Badge status={task.status} />
          <span className="outline-chip">{task.trade}</span>
        </div>
        <Tabs value={tab} onChange={setTab} items={tabs} label="Görev detayı bölümü" />
        <div className={`detail-tab-content ${tab === "ready" ? "preparation-content" : ""}`}>
          {tab === "task" && (
            <div className="task-detail-summary">
              <TaskWorkflow task={task} />
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
              {task.productionNote && (
                <p className="form-hint">Üretim notu: {task.productionNote}</p>
              )}
              {task.status === "completed" && (
                <p className="form-hint">
                  Günlük kayıt onaylandı. İşin toplam tamamlanması, hedef ve gerçekleşen üretimle
                  ayrıca değerlendirilir.
                </p>
              )}
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
              <div className="preparation-heading">
                <span className="stat-icon tone-teal">
                  <Icon name="shield" size={23} />
                </span>
                <div>
                  <h3>İşe başlamadan önce</h3>
                  <p>{checks.filter(Boolean).length} / 3 kontrol tamamlandı</p>
                </div>
              </div>
              <button
                className="preparation-crew"
                aria-label="Görev çalışanlarını belirle"
                onClick={onCrew}
                disabled={issues.length > 0}
              >
                <Icon name="team" size={20} />
                <span>
                  <strong>{taskTeam(task, state.teams)?.name || task.trade}</strong>
                  <small>
                    {task.workerIds.length
                      ? `${task.workerIds.length} çalışan seçildi`
                      : "Görevdeki çalışanları seçin"}
                  </small>
                </span>
                <Icon name="right" size={17} />
              </button>
              <ReadinessChecks
                checks={checks}
                onChange={(index, checked) =>
                  setChecks(checks.map((value, i) => (i === index ? checked : value)))
                }
              />
              {issues.length > 0 && (
                <p className="form-warning">Açık hazırlık eksiği var. Önce engeli kapatın.</p>
              )}
              {overlapping && (
                <p className="form-warning">
                  Bu ekipte başka bir işte çalışan kişiler var. Mevcut işi kapatmadan yeni iş
                  başlatılamaz.
                </p>
              )}
              {task.workerIds.some(
                (id) => !taskTeam(task, state.teams)?.workerIds.includes(id),
              ) && (
                <p className="form-warning">
                  Görevde ekip dışındaki çalışanlar var. Çalışan seçimini güncelleyin.
                </p>
              )}
            </div>
          )}
          {tab === "crew" && (
            <>
              {canStart && (
                <button className="btn btn-primary" onClick={onCrew} disabled={issues.length > 0}>
                  Çalışanları belirle
                </button>
              )}
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
                  {role === "yonetici" && (
                    <button className="btn btn-primary" onClick={() => onRedirect(issue.id)}>
                      Hazır işe yönlendir
                    </button>
                  )}
                </div>
              )}
            />
          )}
          {tab === "history" && (
            <PagedList
              items={task.history || []}
              rowHeight={96}
              label="Kayıt geçmişi"
              empty={<div className="inline-success">Bu görevde henüz yeni işlem yok.</div>}
              renderItem={(entry) => (
                <div className="history-entry" key={entry.id}>
                  <span>{entry.time}</span>
                  <div>
                    <strong>{entry.title}</strong>
                    <small>
                      {formatNumber(entry.actual)} {task.unit} · {formatNumber(entry.laborHours)}{" "}
                      işçi-saat · {formatNumber(entry.waitingHours)} bekleme
                      {entry.note ? ` · ${entry.note}` : ""}
                    </small>
                  </div>
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
            disabled={!checks.every(Boolean) || !canStartTask(state, task)}
            onClick={() => {
              if (user && startTask(task.id, checks, user.id)) {
                onToast("İş başlangıcı kaydedildi.");
                setTab("task");
              } else onToast("Çalışan ve hazırlık bilgilerini kontrol edin.");
            }}
          >
            İşe başla
          </button>
        )}
        {canStart && (
          <button className="btn btn-secondary" onClick={onIssue}>
            Eksik bildir
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
