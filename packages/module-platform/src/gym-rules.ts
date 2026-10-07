import type { SlugProblem, UsernameProblem } from "@apexg/core";

/** The rules live in core (company-rules.ts); the words for them live here. */
export const SLUG_PROBLEM_TEXT: Record<SlugProblem, string> = {
  "too-short": "Mínimo 3 caracteres.",
  "too-long": "Máximo 40 caracteres.",
  format: "Solo minúsculas, números y guiones.",
  reserved: "Esa dirección es de la app.",
  taken: "Ya la usa otro gimnasio.",
};

export const USERNAME_PROBLEM_TEXT: Record<UsernameProblem, string> = {
  "too-short": "Mínimo 3 caracteres.",
  "too-long": "Máximo 50 caracteres.",
  format: "Solo minúsculas, números, punto, guion y guion bajo.",
  taken: "Ya existe en este gimnasio.",
};

/** Up to two initials, for an avatar with no picture. */
export function initials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
}

/** The fixed part before a gym's address: "https://x.y.ts.net/" → "…ts.net/"; a relative base stays "/". */
export function addressPrefix(base: string): string {
  if (!/^https?:\/\//.test(base)) return "/";
  const host = new URL(base).host;
  const labels = host.split(".");
  return labels.length > 2 ? `…${labels.slice(-2).join(".")}/` : `${host}/`;
}
