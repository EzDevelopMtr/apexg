import type { Expense } from "../domain/expense";
import { createSectionCatalog } from "./section-catalog";

export type ExpenseSectionId = "all" | "add" | "categories";

/** Sections of the Expenses module (RF-26, RF-27). */
export const expenseSections = createSectionCatalog<ExpenseSectionId, Expense>([
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
  },
]);
