"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/lib/demo-store";
import type { Role, Section, Task } from "@/lib/types";
import { AppShell } from "./app-shell";
import { Dashboard, PageHeading } from "./dashboard";
import { CreateTask, IssueForm, ProductionForm } from "./forms";
import {
  ApprovalsSection,
  NotificationsSection,
  ProfileSection,
  ReportsSection,
  TeamSection,
} from "./sections";
import { TaskDetail } from "./task-detail";
import { TaskList } from "./task-list";
import { Icon } from "./ui";

type OpenModal =
  { type: "create" } | { type: "detail" | "issue" | "production"; taskId: string } | null;

export function Workspace({ role, section }: { role: Role; section: Section }) {
  const { state, hydrated } = useDemo();
  const [modal, setModal] = useState<OpenModal>(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const tasks = state.tasks.filter(
    (t) =>
      role === "yonetici" ||
      (role === "formen" ? t.foremanId === "f1" : t.workerIds.includes("w1")),
  );
  const selected =
    modal && "taskId" in modal ? tasks.find((t) => t.id === modal.taskId) : undefined;
  const select = (task: Task) => setModal({ type: "detail", taskId: task.id });
  const create = () => setModal({ type: "create" });
  const close = () => setModal(null);
  return (
    <AppShell role={role} section={section}>
      {!hydrated ? (
        <div className="loading-state" role="status">
          <span className="loading-spinner" />
          <p>Çalışma alanın hazırlanıyor…</p>
        </div>
      ) : (
        <>
          {section === "" && (
            <Dashboard
              role={role}
              tasks={tasks}
              onSelect={select}
              onCreate={create}
              onProduction={(task) => setModal({ type: "production", taskId: task.id })}
              onIssue={(task) => setModal({ type: "issue", taskId: task.id })}
            />
          )}
          {section === "gorevler" && (
            <>
              <PageHeading
                title={
                  role === "yonetici" ? "İş planı" : role === "formen" ? "İşlerim" : "Görevlerim"
                }
                description={
                  role === "yonetici"
                    ? "Görevleri planla, ekipleri ata ve gerçekleşen üretimi takip et."
                    : role === "formen"
                      ? "İş hazırlığını kontrol et, engelleri bildir ve üretimi kaydet."
                      : "Sana atanan işleri ve sorumlu formenini görüntüle."
                }
                action={
                  role === "yonetici" && (
                    <button className="btn btn-primary" onClick={create}>
                      <Icon name="plus" size={18} />
                      Yeni görev
                    </button>
                  )
                }
              />
              <section className="panel fill-panel">
                <TaskList tasks={tasks} onSelect={select} />
              </section>
            </>
          )}
          {section === "ekip" && <TeamSection role={role} tasks={tasks} />}
          {section === "raporlar" && <ReportsSection role={role} tasks={tasks} onSelect={select} />}
          {section === "onaylar" && <ApprovalsSection tasks={tasks} onSelect={select} />}
          {section === "bildirimler" && <NotificationsSection />}
          {section === "profil" && <ProfileSection role={role} onToast={setToast} />}
        </>
      )}
      {modal?.type === "create" && role === "yonetici" && (
        <CreateTask onClose={close} onToast={setToast} />
      )}
      {modal?.type === "detail" && selected && (
        <TaskDetail
          key={selected.id}
          task={selected}
          role={role}
          onClose={close}
          onIssue={() => setModal({ type: "issue", taskId: selected.id })}
          onProduction={() => setModal({ type: "production", taskId: selected.id })}
          onToast={setToast}
        />
      )}
      {modal?.type === "issue" && selected && role === "formen" && (
        <IssueForm task={selected} onClose={close} onToast={setToast} />
      )}
      {modal?.type === "production" && selected && role === "formen" && (
        <ProductionForm task={selected} onClose={close} onToast={setToast} />
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={18} />
          </span>
          {toast}
          <button className="icon-button" aria-label="Bildirimi kapat" onClick={() => setToast("")}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </AppShell>
  );
}
