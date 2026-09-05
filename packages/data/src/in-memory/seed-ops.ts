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
      sku: "SUP-001",
      category: "supplements",
      unit: "unit",
      costPrice: fromPesos(180_000),
      salePrice: fromPesos(260_000),
      stock: 18,
      minimumStock: 10,
      supplier: "Nutribalance",
      active: true,
      addedOn: day("2026-08-05"),
    },
    {
      id: toInventoryItemId("item-2"),
      name: "Guantes de entrenamiento",
      sku: "ACC-024",
      category: "accessories",
      unit: "unit",
      costPrice: fromPesos(22_000),
      salePrice: fromPesos(31_000),
      stock: 6,
      minimumStock: 8,
      supplier: "PowerFit",
      active: true,
      addedOn: day("2026-08-10"),
    },
    {
      id: toInventoryItemId("item-3"),
      name: "Camiseta APEX",
      sku: "ROP-112",
      category: "clothing",
      unit: "unit",
      costPrice: fromPesos(18_000),
      salePrice: fromPesos(35_000),
      stock: 0,
      minimumStock: 5,
      supplier: "Textiles MTR",
      active: true,
      addedOn: day("2026-07-20"),
    },
  ];
}
