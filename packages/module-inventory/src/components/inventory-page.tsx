"use client";

import { useMemo, useState } from "react";
import type { InventoryItem, InventorySectionId } from "@apexg/core";
import { inventorySections, itemsBelowMinimum, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Card, CardBody, Modal } from "@apexg/ui";
import { useInventory } from "../hooks/use-inventory";
import InventoryForm from "./inventory-form";
import InventoryList from "./inventory-list";
import LowStockNotice from "./low-stock-notice";

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
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [referenceDate] = useState(today);

  const visible = useMemo(() => {
    if (section.view.kind !== "list") return [];
    const { includes } = section.view;
    return inventory.items.filter((item) => includes(item, referenceDate));
  }, [inventory.items, section, referenceDate]);

  if (section.view.kind === "form") {
    return (
      <Card>
        <CardBody>
          <InventoryForm
            onSave={async (draft) => {
              await inventory.save(draft);
              onNavigate("all");
            }}
            onCancel={() => onNavigate("all")}
          />
        </CardBody>
      </Card>
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

      <InventoryList items={visible} onEdit={setEditing} />

      <Modal
        open={editing !== null}
        title="Editar ítem"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <InventoryForm
            item={editing}
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
