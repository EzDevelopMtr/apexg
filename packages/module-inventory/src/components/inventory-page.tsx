"use client";

import { useState } from "react";
import type { InventoryItem, InventorySectionId } from "@apexg/core";
import { inventorySections, itemsBelowMinimum, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { CategoryPanel, Card, CardBody, Modal } from "@apexg/ui";
import type { UseInventoryCategoriesResult } from "../hooks/use-inventory";
import { useInventory, useInventoryCategories } from "../hooks/use-inventory";
import { useVisibleInventory } from "../hooks/use-visible-inventory";

import InventoryForm from "./inventory-form";
import InventoryList from "./inventory-list";
import InventorySearch from "./inventory-search";
import LowStockNotice from "./low-stock-notice";

/** Extracted only to keep `InventoryPage` under the function-length cap. */
function InventoryCategoryPanel({
  categories,
}: {
  categories: UseInventoryCategoriesResult;
}) {
  return (
    <CategoryPanel
      title="Categorías de inventario"
      placeholder="Ej. Suplementos"
      categories={categories.items}
      onCreate={categories.create}
      onToggle={(category) =>
        categories.save({ ...category, active: !category.active })
      }
    />
  );
}

export interface InventoryPageProps {
  sectionId: InventorySectionId;
  onNavigate: (sectionId: string) => void;
}

export default function InventoryPage({
  sectionId,
  onNavigate,
}: InventoryPageProps) {
  const section = inventorySections.getSection(sectionId);
  const inventory = useInventory();
  const categories = useInventoryCategories();
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [referenceDate] = useState(today);
  const [query, setQuery] = useState("");

  const visible = useVisibleInventory(
    inventory.items,
    section,
    query,
    referenceDate,
  );

  // Form and panel both need the category catalogue loaded — one gate.
  if (section.view.kind === "form" || section.view.kind === "panel") {
    return (
      <CollectionGate
        collection={categories}
        loadingMessage="Cargando categorías..."
        errorMessage="No pudimos cargar las categorías."
      >
        {section.view.kind === "panel" ? (
          <InventoryCategoryPanel categories={categories} />
        ) : (
          <Card>
            <CardBody>
              <InventoryForm
                categories={categories.items}
                onSave={async (draft) => {
                  await inventory.save(draft);
                  onNavigate("all");
                }}
                onCancel={() => onNavigate("all")}
              />
            </CardBody>
          </Card>
        )}
      </CollectionGate>
    );
  }

  return (
    <CollectionGate
      collection={inventory}
      loadingMessage="Cargando inventario..."
      errorMessage="No pudimos cargar el inventario."
    >
      {sectionId === "all" && (
        <LowStockNotice items={itemsBelowMinimum(inventory.items)} />
      )}

      <InventorySearch value={query} onChange={setQuery} />

      <InventoryList
        items={visible}
        categories={categories.items}
        onEdit={setEditing}
      />

      <Modal
        open={editing !== null}
        title="Editar ítem"
        onClose={() => setEditing(null)}
      >
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
