"use client";

import type { Payment } from "@apexg/core";
import { PAYMENT_METHOD_LABELS, formatCOP, paymentLabel } from "@apexg/core";
import { Badge, TableCell, TableRow } from "@apexg/ui";

export interface PaymentRowProps {
  payment: Payment;
  /** Resolved by the page; payments store only the client id. */
  clientName: string;
}

export default function PaymentRow({ payment, clientName }: PaymentRowProps) {
  const settled = payment.balanceAfter <= 0;

  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-body">{clientName}</p>
        <p className="text-sm text-body-soft">{payment.reference}</p>
      </TableCell>

      <TableCell className="text-sm">{payment.paidOn}</TableCell>

      <TableCell className="font-semibold">
        {formatCOP(payment.amount)}
      </TableCell>

      <TableCell>
        <Badge tone={settled ? "success" : "warning"}>
          {paymentLabel(payment)}
        </Badge>
      </TableCell>

      <TableCell className="text-sm">
        {settled ? "—" : formatCOP(payment.balanceAfter)}
      </TableCell>

      <TableCell className="text-sm">
        {PAYMENT_METHOD_LABELS[payment.method]}
      </TableCell>
    </TableRow>
  );
}
