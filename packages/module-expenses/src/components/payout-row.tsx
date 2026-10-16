"use client";

import { Eye } from "lucide-react";
import type { CommissionPayout } from "@apexg/core";
import { PAYMENT_METHOD_LABELS, formatCOP } from "@apexg/core";
import { TableCell, TableRow } from "@apexg/ui";

export interface PayoutRowProps {
  payout: CommissionPayout;
  trainerName: string;
  onViewReceipt: () => void;
}

/** A payout to a trainer among the expenses: read-only, paid elsewhere. */
export default function PayoutRow({ payout, trainerName, onViewReceipt }: PayoutRowProps) {
  const count = payout.commissions.length;
  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-body">Comisiones de {trainerName}</p>
        <p className="text-sm text-body-soft">
          {count} {count === 1 ? "comisión" : "comisiones"}
        </p>
      </TableCell>
      <TableCell className="text-sm">Comisiones de entrenadores</TableCell>
      <TableCell className="font-semibold">{formatCOP(payout.amount)}</TableCell>
      <TableCell className="text-sm">{payout.paidOn}</TableCell>
      <TableCell className="text-sm">
        <span className="flex items-center gap-2">
          {payout.method ? PAYMENT_METHOD_LABELS[payout.method] : "—"}
          {payout.receiptPath && (
            <button
              type="button"
              onClick={onViewReceipt}
              aria-label={`Ver comprobante del pago a ${trainerName}`}
              className="rounded-md p-1 text-body-soft hover:text-body"
            >
              <Eye size={18} />
            </button>
          )}
        </span>
      </TableCell>
      {/* El pago de comisiones no guarda quién lo registró. */}
      <TableCell className="text-sm text-body-faint">—</TableCell>
    </TableRow>
  );
}
