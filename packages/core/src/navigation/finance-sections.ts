import { createSectionCatalog } from "./section-catalog";

export type FinanceSectionId = "dashboard";

/**
 * Sections of the Finances module (RF-31, RF-32, RF-35).
 *
 * Una sola: el resumen reúne lo que antes eran cuatro pestañas (panel,
 * balance, bolsillos y comisiones), porque las cuatro contestan la misma
 * pregunta —cómo va la plata— y partirla obligaba a armar el cuadro de
 * memoria. Con una sección la barra no muestra pestañas.
 *
 * The daily log is deliberately absent: §2.2 grants it to the receptionist
 * while denying her Finances, so it is its own module.
 */
export const financeSections = createSectionCatalog<FinanceSectionId, never>([
  {
    id: "dashboard",
    label: "Resumen",
    title: "Resumen financiero",
    icon: "chart",
    view: { kind: "panel" },
  },
]);
