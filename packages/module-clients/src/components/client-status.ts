import type { ClientStanding, ClientStatus } from "@apexg/core";
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

/**
 * Lo mismo, contando "por vencer".
 *
 * Ámbar y no verde ni rojo: todavía puede entrar, pero alguien tiene que
 * hablarle. Los tres colores de estado de §4.2 siguen significando lo mismo
 * que antes; este ocupa el hueco que quedaba entre el verde y el rojo.
 */
export const STANDING_LABELS: Record<ClientStanding, string> = {
  ...STATUS_LABELS,
  expiringSoon: "Por vencer",
};

export const STANDING_TONES: Record<ClientStanding, BadgeTone> = {
  ...STATUS_TONES,
  expiringSoon: "warning",
};
