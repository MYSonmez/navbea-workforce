"use client";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { useSession } from "./session";
export const sites = [
  {
    id: "merkez",
    teamIds: ["duvar", "siva", "kalip", "demir", "elektrik"],
    name: "Merkez Şantiye",
    address: "Ataşehir, İstanbul",
    query: "Ataşehir İstanbul",
    description: "Örnek konum · Ataşehir merkezi",
  },
  {
    id: "sahil",
    teamIds: [],
    name: "Sahil Yolu Projesi",
    address: "Kadıköy, İstanbul",
    query: "Kadıköy İstanbul",
    description: "Örnek konum · Kadıköy merkezi",
  },
];
const key = "navbea-site-v1";
let selected = "merkez";
const listeners = new Set<() => void>();
function read() {
  try {
    selected = localStorage.getItem(key) || "merkez";
  } catch {}
  return selected;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const sync = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", sync);
  };
}
const Context = createContext<{
  site: (typeof sites)[number];
  changeSite: (id: string) => void;
} | null>(null);
export function SiteProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const id = useSyncExternalStore(subscribe, read, () => "merkez");
  const site = sites.find((s) => s.id === (user?.role === "yonetici" ? id : "merkez")) || sites[0];
  return (
    <Context.Provider
      value={{
        site,
        changeSite(next) {
          if (user?.role !== "yonetici" || !sites.some((s) => s.id === next)) return;
          selected = next;
          try {
            localStorage.setItem(key, next);
          } catch {}
          listeners.forEach((listener) => listener());
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSite() {
  const context = useContext(Context);
  if (!context) throw new Error("SiteProvider is required");
  return context;
}
