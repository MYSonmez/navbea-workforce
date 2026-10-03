"use client";
import Link from "next/link";
import { useState } from "react";
import { formatNumber, person, roleInfo, rolePath } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import type { Role, Task } from "@/lib/types";
import { Avatar, Badge, Empty, Icon, PanelHeading, Progress } from "./ui";
import { SiteMap } from "./site-map";
import { TaskList } from "./task-list";
import { Tabs } from "./pagination";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Dashboard({
  role,
  tasks,
  onSelect,
  onCreate,
  onProduction,
  onIssue,
}: {
  role: Role;
  tasks: Task[];
  onSelect: (task: Task) => void;
  onCreate: () => void;
  onProduction: (task: Task) => void;
  onIssue: (task: Task) => void;
}) {
  const [tab, setTab] = useState<"overview" | "tasks" | "site">("overview");
  const { state } = useDemo();
  const issues = state.issues.filter((i) => !i.resolved && tasks.some((t) => t.id === i.taskId));
  const workers = new Set(tasks.flatMap((t) => t.workerIds)).size;
  const progress = tasks.length
    ? Math.round(
        (tasks.reduce((sum, t) => sum + Math.min(1, t.actual / t.target), 0) / tasks.length) * 100,
      )
    : 0;
  if (role === "isci") return <WorkerDashboard tasks={tasks} onSelect={onSelect} />;
  return (
    <>
      <PageHeading
        title={roleInfo[role].label}
        description="30 Eylül 2026 · Çarşamba"
        action={
          role === "yonetici" ? (
            <button className="btn btn-primary" onClick={onCreate}>
              <Icon name="plus" size={17} />
              Yeni görev
            </button>
          ) : (
            <span className="user-greeting">Ahmet Yılmaz</span>
          )
        }
      />
      <div className="project-strip">
        <span className="project-icon">
          <Icon name="building" size={17} />
        </span>
        <strong>Merkez Şantiye</strong>
        <span className="project-address">Ataşehir, İstanbul</span>
        <span className="outline-chip">{role === "yonetici" ? "3 blok" : "İnce işler"}</span>
      </div>
      {role === "yonetici" && (
        <div className="stats-grid">
          {[
            { icon: "helmet", label: "Çalışan", value: String(workers), color: "blue" },
            {
              icon: "tasks",
              label: "Aktif görev",
              value: String(tasks.filter((t) => t.status === "active").length),
              color: "blue",
            },
            { icon: "warning", label: "Açık engel", value: String(issues.length), color: "orange" },
          ].map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span className={`stat-icon tone-${stat.color}`}>
                <Icon name={stat.icon} size={21} />
              </span>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </article>
          ))}
        </div>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: role === "formen" ? "Görev özeti" : "Genel bakış" },
          { value: "tasks", label: "Görevler", count: tasks.length },
          { value: "site", label: "Saha" },
        ]}
        label="Ana ekran görünümü"
      />
      <div className="dashboard-body">
        {tab === "tasks" && (
          <section className="panel fill-panel">
            <TaskList tasks={tasks} onSelect={onSelect} />
          </section>
        )}
        {tab === "site" && (
          <section className="panel fill-panel map-full">
            <PanelHeading title="Şantiye haritası" caption="Görev atamalarına göre bölgeler" />
            <SiteMap tasks={tasks} onSelect={onSelect} />
            <div className="panel-note">Şematik saha planı · Canlı konum verisi içermez</div>
          </section>
        )}
        {tab === "overview" &&
          (role === "formen" ? (
            <ForemanOverview
              tasks={tasks}
              onSelect={onSelect}
              onProduction={onProduction}
              onIssue={onIssue}
            />
          ) : (
            <div className="manager-overview">
              <section className="panel overview-progress">
                <PanelHeading
                  title="Ortalama görev ilerlemesi"
                  action={<strong className="progress-number">%{progress}</strong>}
                />
                <Progress value={progress} />
                <div className="progress-legend">
                  <span>
                    <i />
                    {tasks.filter((t) => t.status === "completed").length} tamamlanan
                  </span>
                  <span>
                    <i />
                    {tasks.filter((t) => t.status === "active").length} aktif
                  </span>
                  <span>
                    <i />
                    {tasks.filter((t) => t.status === "planned").length} planlanan
                  </span>
                </div>
              </section>
              <section className="panel overview-map">
                <PanelHeading
                  title="Şantiye haritası"
                  action={
                    <button className="text-button" onClick={() => setTab("site")}>
                      Aç
                      <Icon name="right" size={14} />
                    </button>
                  }
                />
                <SiteMap tasks={tasks} onSelect={onSelect} />
              </section>
              <section className="panel overview-tasks fill-panel">
                <PanelHeading
                  title="Görevler"
                  action={
                    <Link className="text-button" href={rolePath(role, "gorevler")}>
                      Tümü
                      <Icon name="right" size={14} />
                    </Link>
                  }
                />
                <TaskList tasks={tasks} onSelect={onSelect} compact />
              </section>
              <section className="panel overview-issue">
                <PanelHeading
                  title="Saha bildirimleri"
                  action={<span className="count-chip">{issues.length} açık</span>}
                />
                {issues[0] ? (
                  <button
                    className="issue-summary"
                    onClick={() => onSelect(tasks.find((t) => t.id === issues[0].taskId)!)}
                  >
                    <span className="stat-icon tone-orange">
                      <Icon name="warning" size={19} />
                    </span>
                    <div>
                      <strong>{issues[0].reason} bekleniyor</strong>
                      <small>
                        {tasks.find((t) => t.id === issues[0].taskId)?.zone} ·{" "}
                        {issues[0].workerIds.length} çalışan
                      </small>
                      <p>{issues[0].note}</p>
                    </div>
                    <Icon name="right" size={16} />
                  </button>
                ) : (
                  <div className="inline-success">
                    <Icon name="checks" />
                    Açık engel yok.
                  </div>
                )}
              </section>
            </div>
          ))}
      </div>
    </>
  );
}

function ForemanOverview({
  tasks,
  onSelect,
  onProduction,
  onIssue,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onProduction: (task: Task) => void;
  onIssue: (task: Task) => void;
}) {
  const [selectedId, setSelectedId] = useState(tasks[0]?.id || "");
  const task = tasks.find((t) => t.id === selectedId) || tasks[0];
  const canRecord = task?.status === "active" || task?.status === "blocked";
  if (!task)
    return (
      <section className="panel">
        <Empty title="Atanan görev yok" text="Yeni görevler bu alanda görünecek." />
      </section>
    );
  return (
    <div className="foreman-overview">
      <section className="panel current-task-panel">
        <div className="task-picker">
          <label htmlFor="current-task">Görev</label>
          <select id="current-task" value={task.id} onChange={(e) => setSelectedId(e.target.value)}>
            {tasks.map((t) => (
              <option value={t.id} key={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <TaskSummary task={task} />
        <div className="task-summary-progress">
          <Progress value={(task.actual / task.target) * 100} />
          <strong>%{Math.round((task.actual / task.target) * 100)}</strong>
        </div>
        <div className="foreman-actions">
          <button
            className="btn btn-primary"
            onClick={() => (canRecord ? onProduction(task) : onSelect(task))}
          >
            <Icon name="tasks" size={17} />
            {task.status === "planned"
              ? "Hazırlığı kontrol et"
              : canRecord
                ? "Üretim gir"
                : "Kaydı incele"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => (canRecord ? onIssue(task) : onSelect(task))}
          >
            <Icon name="warning" size={17} />
            {canRecord ? "Engel bildir" : "Detay"}
          </button>
        </div>
      </section>
      <section className="panel foreman-crew">
        <PanelHeading
          title="Atanan ekip"
          action={<span className="count-chip">{task.workerIds.length} çalışan</span>}
        />
        <div className="crew-inline">
          {task.workerIds.slice(0, 4).map((id) => (
            <div key={id}>
              <Avatar user={person(id)} />
              <strong>{person(id).name.split(" ")[0]}</strong>
              <small>{person(id).trade}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="panel foreman-map">
        <PanelHeading title="Çalışma bölgesi" caption={task.zone} />
        <SiteMap tasks={tasks} onSelect={onSelect} focusTask={task} />
      </section>
    </div>
  );
}

function TaskSummary({ task }: { task: Task }) {
  return (
    <div className="task-summary">
      <div className="task-summary-title">
        <span className="trade-icon trade-blue">
          <Icon name="brick" size={23} />
        </span>
        <div>
          <h2>{task.title}</h2>
          <p>{task.zone}</p>
        </div>
        <Badge status={task.status} />
      </div>
      <div className="task-summary-meta">
        <span>
          <Icon name="clock" size={16} />
          {task.start} – {task.end}
        </span>
        <span>
          <Icon name="tasks" size={16} />
          Hedef: {formatNumber(task.target)} {task.unit}
        </span>
      </div>
    </div>
  );
}

function WorkerDashboard({ tasks, onSelect }: { tasks: Task[]; onSelect: (task: Task) => void }) {
  const { state, acknowledge } = useDemo();
  const [tab, setTab] = useState<"current" | "next" | "site">("current");
  const current =
    tasks.find((t) => t.status === "active" || t.status === "blocked") ||
    tasks.find((t) => t.status === "planned");
  return (
    <>
      <PageHeading title="İşçi" description="Emre Aydın · Merkez Şantiye" />
      <div className="worker-date">
        <Icon name="calendar" size={18} />
        <strong>Bugün</strong>
        <span>30 Eylül 2026</span>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "current", label: "Bugünkü görevim" },
          {
            value: "next",
            label: "Diğer görevler",
            count: tasks.filter((t) => t.id !== current?.id).length,
          },
          { value: "site", label: "Alan" },
        ]}
        label="İşçi görev görünümü"
      />
      <div className="worker-body">
        {tab === "next" ? (
          <section className="panel fill-panel">
            <TaskList
              tasks={tasks.filter((t) => t.id !== current?.id)}
              onSelect={onSelect}
              compact
            />
          </section>
        ) : tab === "site" && current ? (
          <section className="panel fill-panel map-full">
            <PanelHeading title="Çalışma alanı" caption={current.zone} />
            <SiteMap tasks={tasks} onSelect={onSelect} focusTask={current} />
            <div className="panel-note">Merkez Şantiye · Şematik saha planı</div>
          </section>
        ) : current ? (
          <div className="worker-overview">
            <section className="panel worker-assignment">
              <TaskSummary task={current} />
              <button className="location-link" onClick={() => setTab("site")}>
                <Icon name="pin" size={18} />
                <span>
                  <small>Çalışma alanı</small>
                  <strong>{current.zone}</strong>
                </span>
                <Icon name="right" size={17} />
              </button>
              <div className="worker-map">
                <SiteMap tasks={tasks} onSelect={onSelect} focusTask={current} />
              </div>
              <div className="worker-time">
                <span>
                  <Icon name="clock" size={18} />
                  Çalışma saatleri
                </span>
                <div>
                  <small>
                    Başlangıç<strong>{current.start}</strong>
                  </small>
                  <small>
                    Bitiş<strong>{current.end}</strong>
                  </small>
                </div>
              </div>
            </section>
            <section className="panel worker-foreman">
              <PanelHeading title="Sorumlu formen" />
              <div className="person-line">
                <Avatar user={person(current.foremanId)} />
                <span>
                  <strong>{person(current.foremanId).name}</strong>
                  <small>{person(current.foremanId).trade}</small>
                </span>
                <button
                  className="icon-button"
                  aria-label="Formen ve görev detayları"
                  onClick={() => onSelect(current)}
                >
                  <Icon name="right" />
                </button>
              </div>
            </section>
            <div className="worker-actions">
              <button
                className="btn btn-primary"
                disabled={state.acknowledged.includes(current.id)}
                onClick={() => acknowledge(current.id)}
              >
                <Icon name="check" size={17} />
                {state.acknowledged.includes(current.id)
                  ? "Görevi gördüm"
                  : "Görevi gördüm, anladım"}
              </button>
              <button className="btn btn-secondary" onClick={() => onSelect(current)}>
                Detay
                <Icon name="right" size={16} />
              </button>
            </div>
          </div>
        ) : (
          <section className="panel fill-panel">
            <Empty title="Atanan görev yok" text="Görev atandığında burada görünecek." />
          </section>
        )}
      </div>
    </>
  );
}
