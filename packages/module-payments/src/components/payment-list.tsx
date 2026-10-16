"use client";

import { useState } from "react";
import type {
  Client,
  CycleId,
  DayPassId,
  IsoDate,
  LedgerEntry,
  PaymentId,
} from "@apexg/core";
import { settledLaterOn } from "@apexg/core";
import { Card, ReceiptPreview, Table, TableEmpty } from "@apexg/ui";
import DayPassRow from "./day-pass-row";
import PaymentRow from "./payment-row";
import { clientNameOf } from "./client-name";

const HEADERS = [
  "Cliente",
  "Fecha",
  "Monto",
  "Tipo",
  "Saldo tras el pago",
  "Método",
  "Registró",
  "Comprobante",
] as const;

export interface PaymentListProps {
  entries: readonly LedgerEntry[];
  clients: readonly Client[];
  /** Built by the data layer: no component here knows the API path. */
  receiptUrl: (paymentId: PaymentId) => string;
  passReceiptUrl: (passId: DayPassId) => string;
  /**
   * Cuándo se saldó cada ciclo, calculado sobre TODOS los pagos: la tabla
   * puede estar filtrada y ocultar justo el pago que saldó.
   */
  settlements: ReadonlyMap<CycleId, IsoDate>;
}

/** What the preview needs, resolved once when the eye is clicked. */
interface OpenReceipt {
  url: string;
  fileName: string;
  subject: string;
}

export default function PaymentList({
  entries,
  clients,
  receiptUrl,
  passReceiptUrl,
  settlements,
}: PaymentListProps) {
  // Held here rather than in the row: one preview is open at a time, and a
  // row that owned its own modal would let two stack on top of each other.
  const [open, setOpen] = useState<OpenReceipt | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <Table headers={HEADERS}>
          {entries.length === 0 ? (
            <TableEmpty
              columns={HEADERS.length}
              message="No hay pagos registrados en esta vista."
            />
          ) : (
            entries.map((entry) => {
              if (entry.kind === "dayPass") {
                const { pass } = entry;
                return (
                  <DayPassRow
                    key={pass.id}
                    pass={pass}
                    onViewReceipt={() =>
                      setOpen({
                        url: passReceiptUrl(pass.id),
                        fileName: pass.receiptPath,
                        subject: `Pase de día de ${pass.visitorName}`,
                      })
                    }
                  />
                );
              }
              const { payment } = entry;
              const clientName = clientNameOf(clients, payment);
              return (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  clientName={clientName}
                  settledOn={settledLaterOn(payment, settlements)}
                  onViewReceipt={() =>
                    setOpen({
                      url: receiptUrl(payment.id),
                      fileName: payment.receiptPath,
                      subject: `Pago de ${clientName}`,
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
