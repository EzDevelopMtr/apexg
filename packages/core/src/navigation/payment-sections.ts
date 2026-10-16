import type { LedgerEntry } from "../domain/payment-ledger";
import { createSectionCatalog } from "./section-catalog";

export type PaymentSectionId = "all" | "record" | "outstanding";

/**
 * Sections of the Payments module (RF-17, RF-18).
 *
 * Sections work over {@link LedgerEntry}: a day pass is money collected like
 * a membership payment, so "all" shows both, while a section about balances
 * leaves the passes out — they have none.
 */
export const paymentSections = createSectionCatalog<PaymentSectionId, LedgerEntry>([
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
    // The page narrows to cyclesWithBalance first: what is owed now depends on
    // the other payments of the cycle, which a per-item predicate cannot see.
    view: { kind: "list", includes: (entry) => entry.kind !== "dayPass" },
  },
]);
