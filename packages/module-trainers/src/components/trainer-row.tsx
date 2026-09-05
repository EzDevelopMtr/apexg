"use client";

import { Pencil } from "lucide-react";
import type { Trainer } from "@apexg/core";
import { formatCOP, hasCapacity, remainingCapacity } from "@apexg/core";
import { Badge, Button, TableCell, TableRow } from "@apexg/ui";

export interface TrainerRowProps {
  trainer: Trainer;
  /** How many clients the trainer currently has (RF-25). */
  assigned: number;
  onEdit: (trainer: Trainer) => void;
}

export default function TrainerRow({
  trainer,
  assigned,
  onEdit,
}: TrainerRowProps) {
  const available = hasCapacity(trainer, assigned);

  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-body">{trainer.fullName}</p>
        <p className="text-sm text-body-soft">{trainer.idNumber}</p>
      </TableCell>

      <TableCell className="text-sm">{trainer.phone}</TableCell>
      <TableCell className="text-sm">{trainer.hiredOn}</TableCell>
      <TableCell className="text-sm">{formatCOP(trainer.salary)}</TableCell>

      <TableCell className="text-sm">
        {assigned} / {trainer.maxClients}
      </TableCell>

      <TableCell>
        {!trainer.active ? (
          <Badge tone="neutral">Inactivo</Badge>
        ) : available ? (
          <Badge tone="success">
            {remainingCapacity(trainer, assigned)} cupos
          </Badge>
        ) : (
          <Badge tone="warning">Sin cupo</Badge>
        )}
      </TableCell>

      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(trainer)}
          aria-label={`Editar a ${trainer.fullName}`}
          title="Editar entrenador"
        >
          <Pencil size={17} />
        </Button>
      </TableCell>
    </TableRow>
  );
}
