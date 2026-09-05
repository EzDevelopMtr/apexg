"use client";

import { useState } from "react";
import type { ExpenseCategory } from "@apexg/core";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@apexg/ui";

export interface CategoryPanelProps {
  categories: readonly ExpenseCategory[];
  onSave: (category: ExpenseCategory) => Promise<void>;
}

/** Lets the admin extend or retire the category list (RF-27). */
export default function CategoryPanel({
  categories,
  onSave,
}: CategoryPanelProps) {
  const [name, setName] = useState("");

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // The id is derived from the name so the seeded ids stay readable; the
    // backend will assign real ones.
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
        title="Categorías de egreso"
        description="El administrador puede ampliar o retirar categorías."
      />
      <CardBody className="space-y-4">
        <ul className="divide-y divide-slate-100">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between py-3"
            >
              <span className="font-medium text-slate-800">
                {category.name}
              </span>
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

        <div className="flex items-end gap-3 border-t border-slate-100 pt-4">
          <div className="flex-1">
            <Input
              id="newCategory"
              label="Nueva categoría"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Publicidad"
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
