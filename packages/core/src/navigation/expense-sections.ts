import type { OutgoingEntry } from "../domain/outgoing-ledger";
import { createSectionCatalog } from "./section-catalog";

export type ExpenseSectionId = "all" | "add" | "categories";

/**
 * Sections of the Expenses module (RF-26, RF-27). Lists work over
 * {@link OutgoingEntry}: payouts to trainers are outgoings too.
 */
export const expenseSections = createSectionCatalog<ExpenseSectionId, OutgoingEntry>([
  {
    id: "all",
    label: "Todos los egresos",
    title: "Todos los egresos",
    icon: "list",
    view: { kind: "list", includes: () => true },
  },
  {
    id: "add",
    label: "Registrar egreso",
    title: "Registrar egreso",
    icon: "userPlus",
    view: { kind: "form" },
  },
  {
    id: "categories",
    label: "Categorías",
    title: "Categorías de egreso",
    icon: "receipt",
    view: { kind: "panel" },
    // Una lista corta con un campo para agregar: se abre sobre el listado.
    tab: false,
  },
]);
