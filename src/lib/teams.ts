import type { Task, Team } from "./types";

export const teams: Team[] = [
  {
    id: "duvar",
    name: "Duvar ekibi",
    trade: "Duvar işleri",
    foremanId: "f1",
    workerIds: ["w1", "w2", "w3", "w4"],
  },
  {
    id: "siva",
    name: "Sıva ekibi",
    trade: "Sıva işleri",
    foremanId: "f1",
    workerIds: ["w5", "w6"],
  },
  {
    id: "kalip",
    name: "Kalıp ekibi",
    trade: "Kalıp işleri",
    foremanId: "f2",
    workerIds: ["w7", "w8"],
  },
  {
    id: "demir",
    name: "Demir ekibi",
    trade: "Demir işleri",
    foremanId: "f2",
    workerIds: ["w9", "w10"],
  },
  {
    id: "elektrik",
    name: "Elektrik ekibi",
    trade: "Elektrik işleri",
    foremanId: "f2",
    workerIds: ["w11", "w12"],
  },
];
export const zones = [
  "B Blok · 2. kat",
  "B Blok · 1. kat",
  "A Blok · 1. kat",
  "A Blok · Zemin",
  "C Blok · 1. kat",
  "C Blok · 3. kat",
];
export function taskTeam(task: Task, catalog: Team[] = teams) {
  return (
    catalog.find((t) => t.id === task.teamId) ||
    catalog.find((t) => t.trade === task.trade && t.foremanId === task.foremanId)
  );
}
