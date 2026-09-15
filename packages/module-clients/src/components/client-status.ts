import type { ClientStatus } from "@apexg/core";
import type { BadgeTone } from "@apexg/ui";

/** User-facing status names, in Spanish (SRS §4.2). */
export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  overdue: "En mora",
};

/** How each status reads visually. Presentation only — no rule lives here. */
export const STATUS_TONES: Record<ClientStatus, BadgeTone> = {
  active: "success",
  inactive: "neutral",
  overdue: "danger",
};
