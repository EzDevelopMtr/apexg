"use client";

import { Pencil } from "lucide-react";
import type { MembershipType } from "@apexg/core";
import { allowsInstallments, formatCOP, requiresTrainer } from "@apexg/core";
import { Badge, Button, TableCell, TableRow } from "@apexg/ui";

/** Reads the plan's term as Spanish text, e.g. "15 días". */
function termLabel(type: MembershipType): string {
  const { unit, amount } = type.term;
  if (unit === "month") return amount === 1 ? "1 mes" : `${amount} meses`;
  return amount === 1 ? "1 día" : `${amount} días`;
}

export interface MembershipRowProps {
  type: MembershipType;
  /** Absent when the role may not manage the catalogue (RF-12). */
  onEdit?: (type: MembershipType) => void;
}

export default function MembershipRow({ type, onEdit }: MembershipRowProps) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-slate-900">{type.name}</p>
        <p className="text-sm text-slate-500">{type.conditions}</p>
      </TableCell>

      <TableCell className="font-semibold">{formatCOP(type.price)}</TableCell>
      <TableCell className="text-sm">{termLabel(type)}</TableCell>

      <TableCell className="text-sm">
        {allowsInstallments(type) && type.minimumInstallment
          ? formatCOP(type.minimumInstallment)
          : "Pago completo"}
      </TableCell>

      <TableCell>
        {type.isPromotional && <Badge tone="warning">Promoción</Badge>}
        {requiresTrainer(type) && <Badge tone="neutral">Con entrenador</Badge>}
      </TableCell>

      <TableCell className="text-right">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(type)}
            aria-label={`Editar ${type.name}`}
            title="Editar plan"
          >
            <Pencil size={17} />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
