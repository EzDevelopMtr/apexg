"use client";

import { useState } from "react";
import type { InventoryCategory } from "@apexg/core";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@apexg/ui";

export interface CategoryPanelProps {
  categories: readonly InventoryCategory[];
  onSave: (category: InventoryCategory) => Promise<void>;
}

/** Lets the admin extend or retire the category list. */
export default function CategoryPanel({
  categories,
  onSave,
}: CategoryPanelProps) {
  const [name, setName] = useState("");

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // The id is derived from the name so a new category stays readable
    // before the backend assigns its real one (see `saveCategory`).
    await onSave({
      id: trimmed.toLowerCase().replace(/\s+/g, "-"),
      name: trimmed,
      active: true,
    });
    setName("");
  };

  return (
    <Card>
      <CardHeader
        title="Categorías de inventario"
        description="El administrador puede ampliar o retirar categorías."
      />
      <CardBody className="space-y-4">
        <ul className="divide-y divide-line-soft">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between py-3"
            >
              <span className="font-medium text-body">{category.name}</span>
              <div className="flex items-center gap-3">
                <Badge tone={category.active ? "success" : "neutral"}>
                  {category.active ? "Activa" : "Inactiva"}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onSave({ ...category, active: !category.active })
                  }
                >
                  {category.active ? "Retirar" : "Reactivar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-end gap-3 border-t border-line-soft pt-4">
          <div className="flex-1">
            <Input
              id="newCategory"
              label="Nueva categoría"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Suplementos"
            />
          </div>
          <Button onClick={add} disabled={!name.trim()}>
            Agregar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
