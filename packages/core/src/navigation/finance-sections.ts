import { createSectionCatalog } from "./section-catalog";

export type FinanceSectionId = "dashboard" | "monthlyBalance" | "commissions";

/**
 * Sections of the Finances module (RF-31, RF-32, RF-35).
 *
 * The daily log is deliberately absent: §2.2 grants it to the receptionist
 * while denying her Finances, so it is its own module.
 */
export const financeSections = createSectionCatalog<FinanceSectionId, never>([
  {
    id: "dashboard",
    label: "Panel",
    title: "Panel de indicadores",
    icon: "chart",
    view: { kind: "panel" },
  },
  {
    id: "monthlyBalance",
    label: "Balance mensual",
    title: "Balance mensual",
    icon: "wallet",
    view: { kind: "panel" },
  },
  {
    id: "commissions",
    label: "Comisiones",
    title: "Comisiones de entrenadores",
    icon: "dumbbell",
    view: { kind: "panel" },
  },
]);
