import { MODULES } from "@apexg/core";
import type { PlatformSettingKey } from "@apexg/core";

/** How each setting reads and is edited. A new setting adds a record here. */
export const SETTING_COPY: Record<
  PlatformSettingKey,
  { title: string; help: string; kind: "days" | "modules" }
> = {
  "clients.graceDays": {
    title: "Días de gracia",
    help: "Días que un cliente puede seguir sin pagar después del vencimiento antes de quedar en mora.",
    kind: "days",
  },
  "clients.expiringSoonDays": {
    title: "Aviso de vencimiento",
    help: "Cuántos días antes del vencimiento un cliente aparece como «por vencer».",
    kind: "days",
  },
  "modules.enabled": {
    title: "Módulos activos",
    help: "Los módulos apagados desaparecen de la app del gimnasio y la API los rechaza.",
    kind: "modules",
  },
};

/** A setting value in words: "3 días", "Todos", "Clientes, Pagos". */
export function describeValue(value: unknown): string {
  if (typeof value === "number") return `${value} días`;
  if (Array.isArray(value)) {
    const names = MODULES.filter((m) => value.includes(m.id)).map((m) => m.name);
    return names.length === MODULES.length ? "Todos" : names.join(", ") || "Ninguno";
  }
  return String(value);
}
