import { ROLE_LABELS } from "./permissions";
import type { PlatformUser } from "./company";

/*
  Rules the platform panel checks before asking the server. The backend
  checks them again (company-slug.ts, platform-user.rules.ts): these exist so
  the person typing learns it now, not after pressing a button. They return a
  code; the component that renders it chooses the words.
*/

export type SlugProblem = "too-short" | "too-long" | "format" | "reserved" | "taken";
export type UsernameProblem = "too-short" | "too-long" | "format" | "taken";
export type LogoProblem = "type" | "too-large";

/** Mirrors CompanyLogoStore in the backend. */
const LOGO_TYPES: ReadonlySet<string> = new Set(["image/svg+xml", "image/png", "image/webp"]);
const LOGO_MAX_BYTES = 512 * 1024;

/** Why `file` cannot be a gym's logo, or `null` if it can. */
export function logoProblem(file: { readonly type: string; readonly size: number }): LogoProblem | null {
  if (!LOGO_TYPES.has(file.type)) return "type";
  if (file.size > LOGO_MAX_BYTES) return "too-large";
  return null;
}

/** Mirrors RESERVED_COMPANY_SLUGS in the backend: top-level routes of the web app. */
const RESERVED_SLUGS: ReadonlySet<string> = new Set(["admin", "api", "dashboard", "login", "logout", "modules"]);

/** Why `slug` cannot be a gym's address, or `null` if it can. */
export function slugProblem(slug: string, takenBy: readonly string[]): SlugProblem | null {
  if (slug.length < 3) return "too-short";
  if (slug.length > 40) return "too-long";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "format";
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  if (takenBy.includes(slug)) return "taken";
  return null;
}

/** Why `username` cannot sign in to a gym, or `null` if it can. Unique per gym, not globally. */
export function usernameProblem(username: string, takenBy: readonly string[]): UsernameProblem | null {
  if (username.length < 3) return "too-short";
  if (username.length > 50) return "too-long";
  if (!/^[a-z0-9._-]+$/.test(username)) return "format";
  if (takenBy.includes(username)) return "taken";
  return null;
}

function withoutAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** "Gimnasio Ñandú Fit" → "gimnasio-nandu-fit": a starting point, still editable. */
export function suggestSlug(name: string): string {
  return withoutAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** "Ana María Ruiz" → "ana.ruiz"; a single name stays as it is. */
export function suggestUsername(fullName: string): string {
  const words = withoutAccents(fullName)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return last ? `${first}.${last}` : first;
}

const isActiveAdmin = (user: PlatformUser) => user.active && user.roleName === ROLE_LABELS.admin;

/**
 * The gym's only active administrator. Demoting or deactivating them would
 * leave nobody able to manage the gym from inside it.
 */
export function isLastAdministrator(user: PlatformUser, users: readonly PlatformUser[]): boolean {
  return isActiveAdmin(user) && users.filter(isActiveAdmin).length === 1;
}
