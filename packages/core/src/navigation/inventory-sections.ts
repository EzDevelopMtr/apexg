import type { InventoryItem } from "../domain/inventory";
import { isBelowMinimum } from "../domain/inventory";
import type { ModuleSection } from "./section-catalog";
import { createSectionCatalog } from "./section-catalog";

export type InventorySectionId =
  | "all"
  | "add"
  | "lowStock"
  | "outOfStock"
  | "categories";

export type InventorySection = ModuleSection<InventorySectionId, InventoryItem>;

/** Sections of the Inventory module (RF-28, RF-29, RF-30). */
export const inventorySections = createSectionCatalog<
  InventorySectionId,
  InventoryItem
>([
  {
    id: "all",
    label: "Todos los ítems",
    title: "Todos los ítems",
    icon: "list",
    view: { kind: "list", includes: () => true },
  },
  {
    id: "add",
    label: "Agregar ítem",
    title: "Agregar ítem",
    icon: "userPlus",
    view: { kind: "form" },
  },
  {
    id: "lowStock",
    label: "Bajo mínimo",
    title: "Ítems por debajo del mínimo",
    icon: "clock",
    view: {
      kind: "list",
      includes: (item) => item.stock > 0 && isBelowMinimum(item),
    },
  },
  {
    id: "outOfStock",
    label: "Agotados",
    title: "Ítems agotados",
    icon: "userX",
    view: { kind: "list", includes: (item) => item.stock <= 0 },
  },
  {
    id: "categories",
    label: "Categorías",
    title: "Categorías de inventario",
    icon: "package",
    view: { kind: "panel" },
  },
]);
