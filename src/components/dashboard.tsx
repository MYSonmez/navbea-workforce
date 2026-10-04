"use client";
import { Select } from "./select";
import Link from "next/link";
import { useState } from "react";
import { formatNumber, person, rolePath } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import type { Role, Task } from "@/lib/types";
import { Avatar, Badge, Empty, Icon, PanelHeading, Progress } from "./ui";
import { SiteMap } from "./site-map";
import { TaskList } from "./task-list";
import { Tabs } from "./pagination";
import { TaskWorkflow } from "./workflow";
import { useSite } from "@/lib/sites";

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
  const { site } = useSite();
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
        title={role === "formen" ? "Görev özeti" : "Genel bakış"}
        action={
          role === "yonetici" ? (
            <button
              className="btn btn-primary"
              onClick={onCreate}
              disabled={!site.teamIds.length}
              title={!site.teamIds.length ? "Bu şantiyede ekip tanımlanmadı." : undefined}
            >
              <Icon name="plus" size={17} />
              Yeni görev
            </button>
          ) : null
        }
      />
      {role === "yonetici" && (
        <div className="stats-grid manager-stats">
          {[
            {
              icon: "helmet",
              label: "Çalışan",
              value: String(workers),
              color: "blue",
              note: "Görevlere atanan",
            },
            {
              icon: "tasks",
              label: "Aktif görev",
              value: String(tasks.filter((t) => t.status === "active").length),
              color: "teal",
              note: "Sahada devam eden",
            },
            {
              icon: "warning",
              label: "Açık engel",
              value: String(issues.length),
              color: "orange",
              note: "Takip bekleyen",
            },
          ].map((stat) => (
            <article className={`stat-card stat-${stat.color}`} key={stat.label}>
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
            <PanelHeading title="Şantiye haritası" />
            <SiteMap tasks={tasks} onSelect={onSelect} />
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
                <div
                  className="progress-orbit"
                  style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
                >
                  <span>
                    <strong>%{progress}</strong>
                    <small>İlerleme</small>
                  </span>
                </div>
                <div className="progress-heading">
                  <div>
                    <span className="eyebrow">SAHA DURUMU</span>
                    <h2>Ortalama görev ilerlemesi</h2>
                  </div>
                  <strong className="progress-number">%{progress}</strong>
                </div>
                <Progress value={progress} />
                <div className="progress-legend">
                  <span>
                    <i />
                    {tasks.filter((t) => t.status === "completed").length} gün onaylandı
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
                <div className="map-footer">
                  <span>
                    <Icon name="building" size={14} />
                    {site.id === "merkez" ? "3 blok" : "Örnek proje"}
                  </span>
                  <span>
                    <Icon name="helmet" size={14} />
                    {workers} çalışan
                  </span>
                  <span>{site.name}</span>
                </div>
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
                  title="Müdahale bekleyen"
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
  const pendingPreparation = tasks.find((t) => t.status === "planned");
  const canRecord = task?.status === "active" || task?.status === "blocked";
  if (!task)
    return (
      <section className="panel">
        <Empty title="Atanan görev yok" />
      </section>
    );
  return (
    <div className="foreman-overview">
      <section className="panel current-task-panel">
        <div className="assignment-kicker">
          <span className="live-dot" /> GÜNCEL GÖREV
        </div>
        <div className="task-picker">
          <label htmlFor="current-task">Görev</label>
          <Select
            aria-label="Görev"
            id="current-task"
            value={task.id}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {tasks.map((t) => (
              <option value={t.id} key={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        </div>
        <TaskSummary task={task} />
        <TaskWorkflow task={task} />
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
      {pendingPreparation ? (
        <section className="panel foreman-crew preparation-queue">
          <div className="preparation-queue-image" />
          <div className="preparation-queue-body">
            <span className="eyebrow">HAZIRLIK BEKLİYOR</span>
            <h2>{pendingPreparation.title}</h2>
            <p>
              {pendingPreparation.zone} ·{" "}
              {pendingPreparation.workerIds.length
                ? `${pendingPreparation.workerIds.length} çalışan seçildi`
                : "Çalışan seçimi yapılmadı"}
            </p>
            <button className="btn btn-primary" onClick={() => onSelect(pendingPreparation)}>
              <Icon name="shield" size={17} />
              Hazırlığı kontrol et
            </button>
          </div>
        </section>
      ) : (
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
      )}
      <section className="panel foreman-map">
        <PanelHeading title="Şantiye haritası" />
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
      <PageHeading title="Bugünkü görevim" />
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
            <div className="panel-note">Şantiye konumu · Google Maps</div>
          </section>
        ) : current ? (
          <div className="worker-overview">
            <section className="panel worker-assignment">
              <div className="assignment-kicker">
                <span className="live-dot" /> BUGÜNKÜ ATAMA
              </div>
              <TaskSummary task={current} />
              <button className="location-link" onClick={() => setTab("site")}>
                <Icon name="pin" size={18} />
                <span>
                  <small>Çalışma alanı</small>
                  <strong>{current.zone}</strong>
                </span>
                <Icon name="right" size={17} />
              </button>
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
            <Empty title="Atanan görev yok" />
          </section>
        )}
      </div>
    </>
  );
}
