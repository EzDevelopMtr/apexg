"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { InventoryItem, InventorySectionId } from "@apexg/core";
import { inventorySections, itemsBelowMinimum, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { CategoryPanel, Modal } from "@apexg/ui";
import type { UseInventoryCategoriesResult } from "../hooks/use-inventory";
import { useInventory, useInventoryCategories } from "../hooks/use-inventory";
import { useVisibleInventory } from "../hooks/use-visible-inventory";

import InventoryForm from "./inventory-form";
import InventoryList from "./inventory-list";
import InventorySearch from "./inventory-search";
import LowStockNotice from "./low-stock-notice";

/** Both dialogs need the category catalogue loaded: one gate, written once. */
function CategoriesGate({ categories, children }: { categories: UseInventoryCategoriesResult; children: ReactNode }) {
  return (
    <CollectionGate collection={categories} loadingMessage="Cargando categorías..." errorMessage="No pudimos cargar las categorías.">
      {children}
    </CollectionGate>
  );
}

export interface InventoryPageProps {
  sectionId: InventorySectionId;
  onNavigate: (sectionId: string) => void;
}

/**
 * The list is always on screen; adding an item and the category catalogue open
 * as dialogs over it, and closing one returns to the list.
 */
export default function InventoryPage({
  sectionId,
  onNavigate,
}: InventoryPageProps) {
  const requested = inventorySections.getSection(sectionId);
  const section = inventorySections.sectionBehind(sectionId);
  const inventory = useInventory();
  const categories = useInventoryCategories();
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [referenceDate] = useState(today);
  const [query, setQuery] = useState("");
  const close = () => onNavigate(section.id);

  const visible = useVisibleInventory(inventory.items, section, query, referenceDate);

  return (
    <CollectionGate
      collection={inventory}
      loadingMessage="Cargando inventario..."
      errorMessage="No pudimos cargar el inventario."
    >
      {section.id === "all" && (
        <LowStockNotice items={itemsBelowMinimum(inventory.items)} />
      )}

      <InventorySearch value={query} onChange={setQuery} />

      <InventoryList items={visible} categories={categories.items} onEdit={setEditing} />

      <Modal open={requested.view.kind === "form"} title={requested.title} onClose={close}>
        <CategoriesGate categories={categories}>
          <InventoryForm
            categories={categories.items}
            onSave={async (draft) => {
              await inventory.save(draft);
              close();
            }}
            onCancel={close}
          />
        </CategoriesGate>
      </Modal>

      <Modal open={requested.view.kind === "panel"} title={requested.title} onClose={close}>
        <CategoriesGate categories={categories}>
          <CategoryPanel
            placeholder="Ej. Suplementos"
            categories={categories.items}
            onCreate={categories.create}
            onToggle={(category) => categories.save({ ...category, active: !category.active })}
          />
        </CategoriesGate>
      </Modal>

      <Modal open={editing !== null} title="Editar ítem" onClose={() => setEditing(null)}>
        {editing && (
          <InventoryForm
            item={editing}
            categories={categories.items}
            onSave={async (draft, existing) => {
              await inventory.save(draft, existing);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </CollectionGate>
  );
}
