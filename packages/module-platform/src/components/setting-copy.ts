import type { LucideIcon } from "lucide-react";
import { Bell, Hourglass, LayoutGrid } from "lucide-react";
import { MODULES } from "@apexg/core";
import type { PlatformSettingKey } from "@apexg/core";

interface SettingCopy {
  readonly title: string;
  readonly help: string;
  readonly icon: LucideIcon;
  readonly kind: "days" | "modules";
  /** Stepper bounds. The backend catalog (setting-definitions.ts) enforces the same. */
  readonly min?: number;
  readonly max?: number;
}

/** How each setting reads and is edited. A new setting adds a record here. */
export const SETTING_COPY: Record<PlatformSettingKey, SettingCopy> = {
  "clients.graceDays": {
    title: "Días de gracia",
    help: "Días que un cliente puede seguir sin pagar después del vencimiento antes de quedar en mora.",
    icon: Hourglass,
    kind: "days",
    min: 0,
    max: 30,
  },
  "clients.expiringSoonDays": {
    title: "Aviso de vencimiento",
    help: "Con cuántos días de anticipación un cliente aparece como «por vencer».",
    icon: Bell,
    kind: "days",
    min: 1,
    max: 60,
  },
  "modules.enabled": {
    title: "Módulos activos",
    help: "Un módulo apagado desaparece de la app del gimnasio y el servidor lo rechaza.",
    icon: LayoutGrid,
    kind: "modules",
  },
};

export const days = (count: number): string => (count === 1 ? "1 día" : `${count} días`);

/** A setting value in words: "3 días", "Todos", "6 de 8". */
export function describeValue(value: unknown): string {
  if (typeof value === "number") return days(value);
  if (Array.isArray(value)) {
    const on = MODULES.filter((m) => value.includes(m.id)).length;
    return on === MODULES.length ? "Todos" : `${on} de ${MODULES.length}`;
  }
  return String(value);
}
