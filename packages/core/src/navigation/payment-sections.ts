import type { Payment } from "../domain/payment";
import { createSectionCatalog } from "./section-catalog";

export type PaymentSectionId = "all" | "record" | "outstanding";

/** Sections of the Payments module (RF-17, RF-18). */
export const paymentSections = createSectionCatalog<PaymentSectionId, Payment>([
  {
    id: "all",
    label: "Todos los pagos",
    title: "Todos los pagos",
    icon: "list",
    view: { kind: "list", includes: () => true },
  },
  {
    id: "record",
    label: "Registrar pago",
    title: "Registrar pago o abono",
    icon: "userPlus",
    view: { kind: "form" },
  },
  {
    id: "outstanding",
    label: "Con saldo pendiente",
    title: "Pagos con saldo pendiente",
    icon: "clock",
    // Filtered by cyclesWithBalance in the page: what is owed now depends on
    // the other payments of the cycle, which a per-item predicate cannot see.
    view: { kind: "list", includes: () => true },
  },
]);
