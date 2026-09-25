"use client";

import { useState } from "react";
import type { Client, Payment, PaymentId } from "@apexg/core";
import { Card, Table, TableEmpty } from "@apexg/ui";
import PaymentRow from "./payment-row";
import ReceiptPreview from "./receipt-preview";
import { clientNameOf } from "./client-name";

const HEADERS = [
  "Cliente",
  "Fecha",
  "Monto",
  "Tipo",
  "Saldo",
  "Método",
  "Registró",
  "Comprobante",
] as const;

export interface PaymentListProps {
  payments: readonly Payment[];
  clients: readonly Client[];
  /** Built by the data layer: no component here knows the API path. */
  receiptUrl: (paymentId: PaymentId) => string;
}

/** What the preview needs, resolved once when the eye is clicked. */
interface OpenReceipt {
  url: string;
  fileName: string;
  clientName: string;
}

export default function PaymentList({
  payments,
  clients,
  receiptUrl,
}: PaymentListProps) {
  // Held here rather than in the row: one preview is open at a time, and a
  // row that owned its own modal would let two stack on top of each other.
  const [open, setOpen] = useState<OpenReceipt | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <Table headers={HEADERS}>
          {payments.length === 0 ? (
            <TableEmpty
              columns={HEADERS.length}
              message="No hay pagos registrados en esta vista."
            />
          ) : (
            payments.map((payment) => {
              const clientName = clientNameOf(clients, payment);
              return (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  clientName={clientName}
                  onViewReceipt={() =>
                    setOpen({
                      url: receiptUrl(payment.id),
                      fileName: payment.receiptPath,
                      clientName,
                    })
                  }
                />
              );
            })
          )}
        </Table>
      </Card>

      <ReceiptPreview receipt={open} onClose={() => setOpen(null)} />
    </>
  );
}
