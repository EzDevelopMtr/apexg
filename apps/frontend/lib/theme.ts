"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isThemeId, THEME_COOKIE } from "./theme-id";
import type { ThemeId } from "./theme-id";

export type { ThemeId };

const ONE_YEAR = 60 * 60 * 24 * 365;

function read(): ThemeId {
  const value = document.documentElement.dataset.theme;
  return isThemeId(value) ? value : "dark";
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The theme on screen, and a way to change it. Per browser, not per user. */
export function useTheme(): [ThemeId, (theme: ThemeId) => void] {
  const theme = useSyncExternalStore(subscribe, read, () => "dark" as const);
  const setTheme = useCallback((next: ThemeId) => {
    document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
    const apply = () => {
      document.documentElement.dataset.theme = next;
      listeners.forEach((listener) => listener());
    };
    // The whole page cross-fades instead of every colour snapping at once.
    // Browsers without view transitions, or a reduced-motion request, just swap.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !document.startViewTransition) apply();
    else document.startViewTransition(apply);
  }, []);
  return [theme, setTheme];
}
