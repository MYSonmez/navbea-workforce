"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  BrickWall,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  HardHat,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sun,
  TrendingUp,
  TriangleAlert,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { statusInfo } from "@/lib/demo-data";
import type { Person, TaskStatus } from "@/lib/types";

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  tasks: ClipboardList,
  users: UsersRound,
  team: UsersRound,
  approval: ClipboardCheck,
  chart: ChartNoAxesCombined,
  profile: UserRound,
  bell: Bell,
  calendar: CalendarDays,
  pin: MapPin,
  clock: Clock3,
  arrow: ArrowUpRight,
  down: ArrowDownLeft,
  right: ChevronRight,
  left: ChevronLeft,
  building: Building2,
  brick: BrickWall,
  chevron: ChevronDown,
  plus: Plus,
  search: Search,
  settings: Settings2,
  sun: Sun,
  moon: Moon,
  helmet: HardHat,
  check: Check,
  checks: CheckCheck,
  shield: ShieldCheck,
  warning: TriangleAlert,
  help: CircleHelp,
  more: MoreHorizontal,
  trend: TrendingUp,
  download: Download,
  close: X,
  logout: LogOut,
};
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Component = icons[name] || ClipboardList;
  return <Component size={size} strokeWidth={1.7} className={className} aria-hidden="true" />;
}
export function Avatar({ user, small = false }: { user: Person; small?: boolean }) {
  return (
    <span className={`avatar avatar-${user.color} ${small ? "avatar-sm" : ""}`} title={user.name}>
      {user.initials}
    </span>
  );
}
export function Badge({ status }: { status: TaskStatus }) {
  const info = statusInfo[status];
  return (
    <span className={`badge ${info.className}`}>
      <span className="status-dot" />
      {info.label}
    </span>
  );
}
export function Progress({ value, label = "İlerleme" }: { value: number; label?: string }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.min(100, Math.round(value))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function Empty({
  title,
  text,
  icon = "tasks",
}: {
  title: string;
  text?: string;
  icon?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}
export function PanelHeading({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        {caption && <p>{caption}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="modal-content">
        <header className="modal-header">
          <div>
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Pencereyi kapat"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
