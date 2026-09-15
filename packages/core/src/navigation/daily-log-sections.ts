import { createSectionCatalog } from "./section-catalog";

export type DailyLogSectionId = "today" | "history";

/**
 * Sections of the Daily log module (RF-34).
 *
 * Its own module rather than a section of Finances: §2.2 gives the
 * receptionist the daily log but not Finances.
 */
export const dailyLogSections = createSectionCatalog<DailyLogSectionId, never>([
  {
    id: "today",
    label: "Hoy",
    title: "Apartado diario",
    icon: "notebook",
    view: { kind: "panel" },
  },
  {
    id: "history",
    label: "Historial",
    title: "Historial del apartado diario",
    icon: "list",
    view: { kind: "panel" },
  },
]);
