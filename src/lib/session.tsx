"use client";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { people } from "./demo-data";
import type { Person } from "./types";

export const demoAccounts = [
  { email: "selin@navbea.test", userId: "m1" },
  { email: "ahmet@navbea.test", userId: "f1" },
  { email: "mehmet@navbea.test", userId: "f2" },
  { email: "emre@navbea.test", userId: "w1" },
];
const key = "navbea-session-v1";
let current: Person | null | undefined;
const listeners = new Set<() => void>();
function read() {
  if (current !== undefined) return current;
  try {
    const id = localStorage.getItem(key);
    current = people.find((p) => p.id === id) || null;
  } catch {
    current = null;
  }
  return current;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  function storage(event: StorageEvent) {
    if (event.key === key || event.key === null) {
      current = undefined;
      listener();
    }
  }
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storage);
  };
}
function write(user: Person | null) {
  current = user;
  try {
    if (user) localStorage.setItem(key, user.id);
    else localStorage.removeItem(key);
  } catch {}
  listeners.forEach((l) => l());
}
const Context = createContext<{
  user: Person | null;
  hydrated: boolean;
  login: (email: string, password: string) => Person | null;
  logout: () => void;
} | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, read, () => null);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (
    <Context.Provider
      value={{
        user,
        hydrated,
        login(email, password) {
          const account = demoAccounts.find((a) => a.email === email.trim().toLowerCase());
          const person =
            account && password === "navbea2026"
              ? people.find((p) => p.id === account.userId)
              : undefined;
          if (!person) return null;
          write(person);
          return person;
        },
        logout() {
          write(null);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider is required");
  return value;
}
