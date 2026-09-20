"use client";

import { useState } from "react";
import Badge from "./badge";
import Button from "./button";
import Card, { CardBody, CardHeader } from "./card";
import Input from "./input";

/** The shape both category kinds share. Nothing else about them is used here. */
export interface CategoryLike {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

export interface CategoryPanelProps<T extends CategoryLike> {
  /** Card heading, in Spanish. */
  title: string;
  /** Example name under the new-category box, in Spanish. */
  placeholder: string;
  categories: readonly T[];
  /** Given only the name: the id is not this component's to invent. */
  onCreate: (name: string) => Promise<void>;
  onToggle: (category: T) => Promise<void>;
}

/**
 * Lets the admin extend or retire a category list.
 *
 * One component for expenses and inventory, whose categories are the same
 * three fields; it used to be two near-identical copies differing in a title
 * and a placeholder.
 *
 * It hands `onCreate` a name and nothing else. The previous copies built an id
 * from the name here, which both put an id outside the data layer and hid a
 * contract: the repository read that fabricated id to tell a new category from
 * an existing one.
 */
export default function CategoryPanel<T extends CategoryLike>({
  title,
  placeholder,
  categories,
  onCreate,
  onToggle,
}: CategoryPanelProps<T>) {
  const [name, setName] = useState("");

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreate(trimmed);
    setName("");
  };

  return (
    <Card>
      <CardHeader
        title={title}
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
                  onClick={() => onToggle(category)}
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
              placeholder={placeholder}
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
