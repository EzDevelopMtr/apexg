"use client";

import { Eye } from "lucide-react";
import type { Payment } from "@apexg/core";
import { PAYMENT_METHOD_LABELS, formatCOP, paymentLabel } from "@apexg/core";
import { Badge, Button, TableCell, TableRow } from "@apexg/ui";

export interface PaymentRowProps {
  payment: Payment;
  /** Resolved by the page; payments store only the client id. */
  clientName: string;
  /** Where this payment's receipt can be opened. Empty when it has none. */
  receiptUrl: string;
}

export default function PaymentRow({
  payment,
  clientName,
  receiptUrl,
}: PaymentRowProps) {
  const settled = payment.balanceAfter <= 0;

  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-body">{clientName}</p>
        {/* Was the reference, which no longer exists: a cash payment has no
            transaction id, so the field only ever held invented text. */}
        {payment.notes && (
          <p className="text-sm text-body-soft">{payment.notes}</p>
        )}
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

      <TableCell className="text-right">
        {/* A link and not a button: the receipt is a document at an address,
            so opening it in a tab is the browser's job. That also gives the
            receptionist back, zoom and save for free. */}
        {payment.receiptPath ? (
          <Button
            variant="ghost"
            size="sm"
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver comprobante del pago de ${clientName}`}
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
