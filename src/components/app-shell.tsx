"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { navigation, person, roleInfo, rolePath } from "@/lib/demo-data";
import { useDemo } from "@/lib/demo-store";
import type { Role, Section } from "@/lib/types";
import { Avatar, Icon } from "./ui";

export function AppShell({
  role,
  section,
  children,
}: {
  role: Role;
  section: Section;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { state } = useDemo();
  const user = person(roleInfo[role].userId);
  const nav = navigation[role];
  const reviews = state.tasks.filter((t) => t.status === "review").length;
  const unread = state.activities.filter((a) => !state.readNotifications.includes(a.id)).length;
  const title =
    nav.find((n) => n.section === section)?.label ||
    (section === "bildirimler" ? "Bildirimler" : "Profilim");
  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("navbea-theme", theme);
    } catch {
      /* Theme still works in memory. */
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        İçeriğe geç
      </a>
      <aside className="sidebar">
        <Link href={rolePath(role)} className="brand" aria-label="Navbea Workforce ana sayfa">
          <span className="brand-mark">
            n<span />
          </span>
          <div>
            <strong>
              navbea<span className="brand-dot">.</span>
            </strong>
            <small>WORKFORCE</small>
          </div>
        </Link>
        <div className="project-switch">
          <span className="project-icon">
            <Icon name="helmet" />
          </span>
          <div>
            <strong>Merkez Şantiye</strong>
            <small>İstanbul · Aktif proje</small>
          </div>
          <span className="live-dot" />
        </div>
        <div className="nav-label">ÇALIŞMA ALANI</div>
        <nav aria-label="Ana menü">
          {nav.map((item) => (
            <Link
              key={item.section}
              href={rolePath(role, item.section)}
              className={`nav-item ${section === item.section ? "is-active" : ""}`}
              aria-current={section === item.section ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.section === "onaylar" && reviews > 0 && (
                <span className="nav-count">{reviews}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-demo">
            <span className="live-dot" />
            Örnek şantiye · 30 Eylül 2026
          </div>
          <Link
            href={rolePath(role, "profil")}
            className={`nav-item ${section === "profil" ? "is-active" : ""}`}
          >
            <Icon name="settings" />
            <span>Hesap & tercihler</span>
          </Link>
          <div className="sidebar-user">
            <Avatar user={user} />
            <div>
              <strong>{user.name}</strong>
              <small>{roleInfo[role].label}</small>
            </div>
            <Icon name="chevron" size={16} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Çalışma alanı</span>
            <Icon name="right" size={14} />
            <strong>{title}</strong>
          </div>
          <Link className="mobile-brand" href={rolePath(role)}>
            navbea<span>.</span>
          </Link>
          <div className="topbar-actions">
            <span className="demo-label">
              <span />
              Demo alanı
            </span>
            <label className="role-switch">
              <Icon name="users" size={16} />
              <span className="sr-only">Görüntülenen rol</span>
              <select
                aria-label="Rol değiştir"
                value={role}
                onChange={(event) => router.push(rolePath(event.target.value as Role))}
              >
                <option value="yonetici">Yönetici</option>
                <option value="formen">Formen</option>
                <option value="isci">İşçi</option>
              </select>
            </label>
            <button
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label="Açık veya koyu temayı değiştir"
            >
              <span className="theme-light-icon">
                <Icon name="moon" />
              </span>
              <span className="theme-dark-icon">
                <Icon name="sun" />
              </span>
            </button>
            <Link
              className="icon-button notification-button"
              href={rolePath(role, "bildirimler")}
              aria-label={`Bildirimler, ${unread} okunmamış`}
            >
              <Icon name="bell" />
              {unread > 0 && <span className="notification-dot" />}
            </Link>
            <Link className="header-avatar" href={rolePath(role, "profil")} aria-label="Profilim">
              <Avatar user={user} small />
            </Link>
          </div>
        </header>
        <main id="main-content" className="content-area">
          {children}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobil ana menü">
        {nav.map((item) => (
          <Link
            key={item.section}
            href={rolePath(role, item.section)}
            className={section === item.section ? "is-active" : ""}
            aria-current={section === item.section ? "page" : undefined}
          >
            <span className="mobile-nav-icon">
              <Icon name={item.icon} size={21} />
              {item.section === "onaylar" && reviews > 0 && <i />}
            </span>
            <span>
              {item.section === "ekip"
                ? "Ekip"
                : item.section === "onaylar"
                  ? "Onaylar"
                  : item.section === "gorevler"
                    ? "Görevler"
                    : item.section === ""
                      ? "Bugün"
                      : item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
