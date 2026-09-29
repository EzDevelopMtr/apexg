"use client";

import { Eye } from "lucide-react";
import type { IsoDate, Payment } from "@apexg/core";
import {
  PAYMENT_METHOD_LABELS,
  formatCOP,
  formatDayMonth,
  paymentLabel,
} from "@apexg/core";
import { Badge, Button, TableCell, TableRow } from "@apexg/ui";

export interface PaymentRowProps {
  payment: Payment;
  /** Resolved by the page; payments store only the client id. */
  clientName: string;
  /** Opens the receipt over the page. Only called when there is one. */
  onViewReceipt: () => void;
  /** Si el saldo que dejó este abono se pagó después, el día en que se saldó. */
  settledOn: IsoDate | null;
}

export default function PaymentRow({
  payment,
  clientName,
  onViewReceipt,
  settledOn,
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

      <TableCell className="whitespace-nowrap text-sm">{payment.paidOn}</TableCell>

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
        {/* El saldo de la columna es el de ESE momento; sin esto, un abono
            ya completado se leía como una deuda vigente. */}
        {settledOn && (
          <p className="text-xs text-ok-ink">
            Saldado el {formatDayMonth(settledOn)}
          </p>
        )}
      </TableCell>

      <TableCell className="text-sm">
        {PAYMENT_METHOD_LABELS[payment.method]}
      </TableCell>

      {/* Con varias personas en el mostrador, un cobro sin autor no se puede
          preguntar a nadie (RNF-07). */}
      <TableCell className="text-sm text-body-soft">
        {payment.recordedBy}
      </TableCell>

      <TableCell className="text-right">
        {payment.receiptPath ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewReceipt}
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
