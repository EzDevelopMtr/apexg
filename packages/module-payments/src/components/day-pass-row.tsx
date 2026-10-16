"use client";

import { Eye } from "lucide-react";
import type { DayPass } from "@apexg/core";
import { PAYMENT_METHOD_LABELS, formatCOP } from "@apexg/core";
import { Badge, Button, TableCell, TableRow } from "@apexg/ui";

export interface DayPassRowProps {
  pass: DayPass;
  /** Opens the receipt over the page. Only called when there is one. */
  onViewReceipt: () => void;
}

/** A day pass among the payments: same columns, no balance to show. */
export default function DayPassRow({ pass, onViewReceipt }: DayPassRowProps) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-body">{pass.visitorName}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">{pass.soldOn}</TableCell>
      <TableCell className="font-semibold">{formatCOP(pass.amount)}</TableCell>
      <TableCell>
        <Badge tone="neutral">Pase de día</Badge>
      </TableCell>
      <TableCell className="text-sm">—</TableCell>
      <TableCell className="text-sm">
        {PAYMENT_METHOD_LABELS[pass.paymentMethod]}
      </TableCell>
      <TableCell className="text-sm text-body-soft">{pass.recordedBy}</TableCell>
      <TableCell className="text-right">
        {pass.receiptPath ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewReceipt}
            aria-label={`Ver comprobante del pase de ${pass.visitorName}`}
            title="Ver comprobante"
          >
            <Eye size={17} />
          </Button>
        ) : (
          <span className="text-body-faint" title="Sin comprobante">
            —
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
