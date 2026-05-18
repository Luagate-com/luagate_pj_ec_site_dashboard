import { useEffect, useState } from "react";
import type { User } from "../types";

const TOKEN_KEY = "token";
const USER_KEY = "currentUser";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  notify(null);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// シンプルな pub/sub
const listeners = new Set<(user: User | null) => void>();

function notify(user: User | null): void {
  listeners.forEach((fn) => fn(user));
}

export function updateCurrentUser(user: User | null): void {
  if (user) {
    setStoredUser(user);
  } else {
    clearToken();
  }
  notify(user);
}

export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    const fn = (u: User | null) => setUser(u);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return user;
}
