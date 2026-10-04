"use client";
import { useState } from "react";
import { formatNumber, people, person, roleInfo, statusInfo } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import { useSession } from "@/lib/session";
import { useSite } from "@/lib/sites";
import { TeamEditor } from "./team-editor";
import type { Role, Task } from "@/lib/types";
import { PageHeading } from "./dashboard";
import { Avatar, Badge, Empty, Icon, PanelHeading, Progress } from "./ui";
import { PagedList, Tabs } from "./pagination";

export function TeamSection({ role, tasks }: { role: Role; tasks: Task[] }) {
  const { site } = useSite();
  const { state } = useDemo();
  const { user } = useSession();
  const [editingTeams, setEditingTeams] = useState(false);
  const [query, setQuery] = useState("");
  const ids = new Set(
    state.teams.filter((t) => t.foremanId === user?.id).flatMap((t) => t.workerIds),
  );
  const siteWorkers = new Set(
    state.teams.filter((t) => site.teamIds.includes(t.id)).flatMap((t) => t.workerIds),
  );
  const team = people.filter(
    (p) =>
      p.role === "isci" &&
      (role === "yonetici" ? siteWorkers.has(p.id) : ids.has(p.id)) &&
      `${p.name} ${p.trade}`.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <>
      <PageHeading
        title={role === "yonetici" ? "Ekip & çalışanlar" : "Ekibim"}
        description={`${team.length} çalışan`}
        action={
          <div className="heading-actions">
            {role === "formen" && (
              <button className="btn btn-secondary" onClick={() => setEditingTeams(true)}>
                <Icon name="users" size={17} />
                Ekipleri düzenle
              </button>
            )}
            <div className="team-heading-photo" aria-hidden="true" />
          </div>
        }
      />
      <label className="search-box section-search">
        <Icon name="search" size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Çalışan veya uzmanlık ara"
          aria-label="Çalışan ara"
        />
      </label>
      <section className="panel fill-panel team-panel">
        <PagedList
          key={query}
          items={team}
          rowHeight={142}
          minColumnWidth={260}
          gap={12}
          className="team-grid"
          label="Çalışanlar"
          empty={<Empty title="Çalışan bulunamadı" text="Aramanızı değiştirin." />}
          renderItem={(p) => {
            const assigned = tasks.filter((t) => t.workerIds.includes(p.id));
            const current =
              assigned.find((t) => t.status === "active" || t.status === "blocked") ||
              assigned.find((t) => t.status === "planned");
            const waiting = state.issues.some((i) => !i.resolved && i.workerIds.includes(p.id));
            return (
              <article className="person-card" key={p.id}>
                <div className="person-card-top">
                  <Avatar user={p} />
                  <div>
                    <h2>{p.name}</h2>
                    <p>{p.trade}</p>
                  </div>
                  <span className={`badge ${waiting ? "badge-orange" : "badge-blue"}`}>
                    {waiting ? "Beklemede" : current ? "Atandı" : "Atama yok"}
                  </span>
                </div>
                <strong className="person-task">{current?.title || "Aktif atama yok"}</strong>
                <div className="person-card-bottom">
                  <span>
                    <Icon name="pin" size={13} />
                    {current?.zone || "—"}
                  </span>
                  <small>{assigned.length} görev</small>
                </div>
              </article>
            );
          }}
        />
      </section>
      {editingTeams && <TeamEditor onClose={() => setEditingTeams(false)} />}
    </>
  );
}

function downloadCsv(tasks: Task[]) {
  const rows = [
    [
      "Görev",
      "Bölge",
      "Durum",
      "Hedef",
      "Üretim",
      "Birim",
      "İşçi-saat",
      "Bekleme saati",
      "Örnek işçilik maliyeti (TL)",
    ],
    ...tasks.map((t) => [
      t.title,
      t.zone,
      statusInfo[t.status].label,
      t.target,
      t.actual,
      t.unit,
      t.laborHours,
      t.waitingHours,
      t.laborHours * 250,
    ]),
  ];
  const csv =
    "\uFEFF" +
    rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "navbea-30-eylul-2026.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReportsSection({
  role,
  tasks,
  onSelect,
}: {
  role: Role;
  tasks: Task[];
  onSelect: (task: Task) => void;
}) {
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [tab, setTab] = useState<"records" | "chart">("records");
  const records = tasks.filter(
    (t) => t.laborHours > 0 && (!approvedOnly || t.status === "completed"),
  );
  const hours = records.reduce((n, t) => n + t.laborHours, 0);
  const waiting = records.reduce((n, t) => n + t.waitingHours, 0);
  return (
    <>
      <PageHeading
        title={role === "formen" ? "Gün sonu" : "Raporlar"}
        action={
          <button className="btn btn-secondary" onClick={() => downloadCsv(records)}>
            <Icon name="download" size={17} />
            CSV indir
          </button>
        }
      />
      <div className="stats-grid">
        {[
          { label: "İşçi-saat", value: formatNumber(hours), icon: "clock" },
          { label: "Bekleme saati", value: formatNumber(waiting), icon: "warning" },
          { label: "İşçilik (₺)", value: formatNumber(hours * 250), icon: "chart" },
        ].map((s) => (
          <article className="stat-card" key={s.label}>
            <span className="stat-icon tone-blue">
              <Icon name={s.icon} size={20} />
            </span>
            <div>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          </article>
        ))}
      </div>
      <div className="report-controls">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "records", label: "İş kayıtları" },
            { value: "chart", label: "Haftalık dağılım" },
          ]}
          label="Rapor görünümü"
        />
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={approvedOnly}
            onChange={(e) => setApprovedOnly(e.target.checked)}
          />
          Yalnızca onaylı kayıtlar
        </label>
      </div>
      <section className="panel fill-panel">
        {tab === "chart" ? (
          <>
            <PanelHeading title="Tamamlanan görevler" caption="Temsili geçmiş verisi · Son 7 gün" />
            <div className="bar-chart">
              {[5, 8, 6, 10, 7, 9, 4].map((v, index) => (
                <div className={`bar-column ${index === 6 ? "is-today" : ""}`} key={index}>
                  <span>{v}</span>
                  <div style={{ height: `${v * 8}%` }} />
                  <small>{["Per", "Cum", "Cmt", "Paz", "Pzt", "Sal", "Çar"][index]}</small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <PagedList
            key={String(approvedOnly)}
            items={records}
            rowHeight={88}
            label="Rapor kayıtları"
            empty={
              <Empty
                title="Kayıt bulunamadı"
                text="Onay filtresini kaldırarak diğer kayıtları görebilirsiniz."
              />
            }
            renderItem={(task) => (
              <button className="report-record" key={task.id} onClick={() => onSelect(task)}>
                <div className="report-name">
                  <strong>{task.title}</strong>
                  <small>{task.zone}</small>
                  <Badge status={task.status} />
                </div>
                <div>
                  <small>Üretim</small>
                  <strong>
                    {formatNumber(task.actual)} {task.unit}
                  </strong>
                  <Progress value={(task.actual / task.target) * 100} />
                </div>
                <div className="report-extra">
                  <small>Verim</small>
                  <strong>
                    {formatNumber(task.actual / task.laborHours)} {task.unit}/sa
                  </strong>
                </div>
                <div className="report-extra">
                  <small>Birim işçilik</small>
                  <strong>
                    {task.actual
                      ? `${formatNumber((task.laborHours * 250) / task.actual)} ₺/${task.unit}`
                      : "—"}
                  </strong>
                </div>
                <Icon name="right" size={15} />
              </button>
            )}
          />
        )}
        <div className="panel-note">
          Bekleme toplam süreye dahildir. Örnek saatlik işçilik: 250 TL.
        </div>
      </section>
    </>
  );
}

export function ApprovalsSection({
  tasks,
  onSelect,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
}) {
  const pending = tasks.filter((t) => t.status === "review");
  return (
    <>
      <PageHeading title="Onay merkezi" description={`${pending.length} kayıt onay bekliyor`} />
      <section className="panel fill-panel approval-panel">
        <PagedList
          items={pending}
          rowHeight={215}
          minColumnWidth={290}
          gap={16}
          className="approval-grid"
          label="Onaylar"
          empty={
            <Empty
              title="Onay bekleyen kayıt yok"
              text="Gönderilen gün sonu kayıtları burada görünür."
              icon="checks"
            />
          }
          renderItem={(task) => (
            <article className="approval-card" key={task.id}>
              <div className="approval-card-top">
                <h2>{task.title}</h2>
                <Badge status={task.status} />
              </div>
              <p>
                {task.zone} · {person(task.foremanId).name}
              </p>
              <div className="approval-numbers">
                <span>
                  <small>Üretim / hedef</small>
                  <strong>
                    {formatNumber(task.actual)} / {formatNumber(task.target)} {task.unit}
                  </strong>
                </span>
                <span>
                  <small>İşçi-saat</small>
                  <strong>{formatNumber(task.laborHours)}</strong>
                </span>
              </div>
              <Progress value={(task.actual / task.target) * 100} />
              <button className="btn btn-primary w-full" onClick={() => onSelect(task)}>
                Kaydı incele
                <Icon name="right" size={16} />
              </button>
            </article>
          )}
        />
      </section>
    </>
  );
}

export function NotificationsSection() {
  const { state, markRead } = useDemo();
  return (
    <>
      <PageHeading
        title="Bildirimler"
        action={
          <button className="btn btn-secondary" onClick={markRead}>
            <Icon name="checks" size={17} />
            Okundu işaretle
          </button>
        }
      />
      <section className="panel fill-panel">
        <PagedList
          items={state.activities}
          rowHeight={80}
          label="Bildirimler"
          renderItem={(a) => (
            <article
              className={`notification-row ${state.readNotifications.includes(a.id) ? "is-read" : ""}`}
              key={a.id}
            >
              <span
                className={`stat-icon tone-${a.kind === "warning" ? "orange" : a.kind === "success" ? "teal" : "blue"}`}
              >
                <Icon
                  name={a.kind === "warning" ? "warning" : a.kind === "success" ? "check" : "tasks"}
                  size={19}
                />
              </span>
              <div>
                <h2>{a.title}</h2>
                <p>{a.description}</p>
              </div>
              <small>{a.time}</small>
              {!state.readNotifications.includes(a.id) && <span className="unread-dot" />}
            </article>
          )}
        />
      </section>
    </>
  );
}

export function ProfileSection({
  role,
  onToast,
}: {
  role: Role;
  onToast: (message: string) => void;
}) {
  const { reset } = useDemo();
  const { site } = useSite();
  const { user: signedInUser } = useSession();
  const user = signedInUser || person(roleInfo[role].userId);
  const [tab, setTab] = useState<"profile" | "preferences">("profile");
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <>
      <PageHeading title="Hesap & tercihler" description={user.name} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "profile", label: "Profil" },
          { value: "preferences", label: "Tercihler" },
        ]}
        label="Hesap bölümü"
      />
      <section className="panel fill-panel profile-panel">
        {tab === "profile" ? (
          <div className="profile-content">
            <div className="profile-identity">
              <Avatar user={user} />
              <div>
                <h2>{user.name}</h2>
                <p>{user.trade}</p>
                <Badge status="active" />
              </div>
            </div>
            <dl className="profile-facts">
              <div>
                <dt>Rol</dt>
                <dd>{roleInfo[role].label}</dd>
              </div>
              <div>
                <dt>Proje</dt>
                <dd>{site.name}</dd>
              </div>
              <div>
                <dt>Firma</dt>
                <dd>Navbea İnşaat</dd>
              </div>
              <div>
                <dt>Hesap</dt>
                <dd>Örnek kullanıcı</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="preferences-content">
            <h2>Görünüm</h2>
            <div className="theme-options">
              {(["light", "dark"] as const).map((theme) => (
                <button
                  key={theme}
                  className={`theme-option theme-choice-${theme}`}
                  onClick={() => {
                    document.documentElement.dataset.theme = theme;
                    try {
                      localStorage.setItem("navbea-theme", theme);
                    } catch {}
                    onToast(`${theme === "light" ? "Açık" : "Koyu"} tema etkinleştirildi.`);
                  }}
                >
                  <span className={`theme-preview preview-${theme}`}>
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>
                    <Icon name={theme === "light" ? "sun" : "moon"} size={17} />
                    {theme === "light" ? "Açık tema" : "Koyu tema"}
                  </span>
                </button>
              ))}
            </div>
            <div className="demo-preferences">
              <h2>Örnek veriler</h2>
              <p>Kayıtlar bu tarayıcıda saklanır. Sunucu bağlantısı henüz yok.</p>
              {confirmReset ? (
                <div className="reset-confirm">
                  <p>Yaptığınız değişiklikler silinecek.</p>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      reset();
                      setConfirmReset(false);
                      onToast("Örnek veriler sıfırlandı.");
                    }}
                  >
                    Evet, sıfırla
                  </button>
                  <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={() => setConfirmReset(true)}>
                  Örnek verileri sıfırla
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
