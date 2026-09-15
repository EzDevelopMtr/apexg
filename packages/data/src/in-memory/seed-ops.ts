import type { Expense, InventoryItem, IsoDate } from "@apexg/core";
import { fromPesos, toExpenseId, toInventoryItemId } from "@apexg/core";

/** Test data used while there is no backend. Not shipped to production. */

const day = (value: string) => value as IsoDate;

export function buildSeedExpenses(): Expense[] {
  return [
    {
      id: toExpenseId("expense-1"),
      categoryId: "payroll",
      description: "Nómina mes de agosto",
      amount: fromPesos(1_500_000),
      spentOn: day("2026-08-30"),
      recordedBy: "apexg",
    },
    {
      id: toExpenseId("expense-2"),
      categoryId: "utilities",
      description: "Energía y agua",
      amount: fromPesos(420_000),
      spentOn: day("2026-09-02"),
      recordedBy: "apexg",
    },
  ];
}

export function buildSeedInventory(): InventoryItem[] {
  return [
    {
      id: toInventoryItemId("item-1"),
      name: "Proteína whey 2 lb",
      unit: "unit",
      stock: 18,
      minimumStock: 10,
      active: true,
    },
    {
      id: toInventoryItemId("item-2"),
      name: "Guantes de entrenamiento",
      unit: "unit",
      stock: 6,
      minimumStock: 8,
      active: true,
    },
    {
      id: toInventoryItemId("item-3"),
      name: "Camiseta APEX",
      unit: "unit",
      stock: 0,
      minimumStock: 5,
      active: true,
    },
  ];
}
