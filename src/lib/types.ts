export type Role = "yonetici" | "formen" | "isci";
export type TaskStatus = "planned" | "active" | "blocked" | "review" | "completed";
export type Section = "" | "gorevler" | "ekip" | "raporlar" | "onaylar" | "bildirimler" | "profil";

export interface Task {
  id: string;
  title: string;
  zone: string;
  trade: string;
  foremanId: string;
  workerIds: string[];
  target: number;
  actual: number;
  unit: string;
  start: string;
  end: string;
  status: TaskStatus;
  priority: "normal" | "high";
  note: string;
  ready: boolean;
  laborHours: number;
  waitingHours: number;
  reviewNote?: string;
}

export interface Person {
  id: string;
  name: string;
  initials: string;
  trade: string;
  role: Role;
  color: string;
}

export interface Issue {
  id: string;
  taskId: string;
  reason: string;
  note: string;
  workerIds: string[];
  resolved: boolean;
  time: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  kind: "success" | "info" | "warning";
}

export interface DemoState {
  tasks: Task[];
  issues: Issue[];
  activities: Activity[];
  acknowledged: string[];
  readNotifications: string[];
}
