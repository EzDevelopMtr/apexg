"use client";

import { Pencil } from "lucide-react";
import type { InventoryItem } from "@apexg/core";
import { UNIT_LABELS, isBelowMinimum } from "@apexg/core";
import {
  Badge,
  Button,
  Card,
  Table,
  TableCell,
  TableEmpty,
  TableRow,
} from "@apexg/ui";

const HEADERS = [
  "Ítem",
  "Existencias",
  "Mínimo",
  "Estado",
  "Acción",
] as const;

export interface InventoryListProps {
  items: readonly InventoryItem[];
  onEdit: (item: InventoryItem) => void;
}

/** RF-30: an item at or below its minimum is flagged. */
function stockBadge(item: InventoryItem) {
  if (item.stock <= 0) return <Badge tone="danger">Agotado</Badge>;
  if (isBelowMinimum(item)) return <Badge tone="warning">Bajo mínimo</Badge>;
  return <Badge tone="success">Disponible</Badge>;
}

export default function InventoryList({ items, onEdit }: InventoryListProps) {
  return (
    <Card className="overflow-hidden">
      <Table headers={HEADERS}>
        {items.length === 0 ? (
          <TableEmpty
            columns={HEADERS.length}
            message="No hay ítems que mostrar."
          />
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-semibold text-body">{item.name}</p>
              </TableCell>
              <TableCell className="text-sm">
                {item.stock} {UNIT_LABELS[item.unit]}
              </TableCell>
              <TableCell className="text-sm">{item.minimumStock}</TableCell>
              <TableCell>{stockBadge(item)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                  aria-label={`Editar ${item.name}`}
                  title="Editar ítem"
                >
                  <Pencil size={17} />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </Table>
    </Card>
  );
}
