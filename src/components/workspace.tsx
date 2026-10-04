"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/lib/demo-store";
import type { Role, Section, Task } from "@/lib/types";
import { AppShell } from "./app-shell";
import { Dashboard, PageHeading } from "./dashboard";
import { IssueForm, ProductionForm } from "./forms";
import { CreateTask } from "./create-task";
import { CrewForm } from "./crew-form";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { tasksForUser } from "@/lib/task-rules";
import { rolePath } from "@/lib/demo-data";
import { useSite } from "@/lib/sites";
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
import { RedirectForm } from "./redirect-form";

type OpenModal =
  | { type: "create" }
  | { type: "detail" | "issue" | "production" | "crew"; taskId: string }
  | { type: "redirect"; taskId: string; issueId: string }
  | null;

export function Workspace({ role, section }: { role: Role; section: Section }) {
  const { state, hydrated } = useDemo();
  const { site } = useSite();
  const { user, hydrated: sessionReady } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!sessionReady) return;
    if (!user) router.replace("/giris");
    else if (user.role !== role) router.replace(rolePath(user.role));
  }, [user, sessionReady, role, router]);
  const [modal, setModal] = useState<OpenModal>(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const tasks = user ? tasksForUser(state.tasks, user) : [];
  const selected =
    modal && "taskId" in modal ? tasks.find((t) => t.id === modal.taskId) : undefined;
  const select = (task: Task) => setModal({ type: "detail", taskId: task.id });
  const create = () => setModal({ type: "create" });
  const close = () => setModal(null);
  if (!sessionReady || !user || user.role !== role)
    return (
      <div className="session-loading" role="status">
        Hesap kontrol ediliyor…
      </div>
    );
  return (
    <AppShell role={role} section={section}>
      {!hydrated ? (
        <div className="loading-state" role="status">
          <span className="loading-spinner" />
          <p>Görevler yükleniyor…</p>
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
                action={
                  role === "yonetici" && (
                    <button
                      className="btn btn-primary"
                      onClick={create}
                      disabled={!site.teamIds.length}
                      title={!site.teamIds.length ? "Bu şantiyede ekip tanımlanmadı." : undefined}
                    >
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
          onCrew={() => setModal({ type: "crew", taskId: selected.id })}
          onRedirect={(issueId) => setModal({ type: "redirect", taskId: selected.id, issueId })}
        />
      )}
      {modal?.type === "issue" && selected && role === "formen" && (
        <IssueForm task={selected} onClose={close} onToast={setToast} />
      )}
      {modal?.type === "production" && selected && role === "formen" && (
        <ProductionForm task={selected} onClose={close} onToast={setToast} />
      )}
      {modal?.type === "redirect" &&
        selected &&
        role === "yonetici" &&
        state.issues.find((i) => i.id === modal.issueId && !i.resolved) && (
          <RedirectForm
            task={selected}
            issue={state.issues.find((i) => i.id === modal.issueId)!}
            onClose={close}
            onToast={setToast}
          />
        )}
      {modal?.type === "crew" && selected && role === "formen" && (
        <CrewForm
          task={selected}
          onClose={() => setModal({ type: "detail", taskId: selected.id })}
          onToast={setToast}
        />
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
