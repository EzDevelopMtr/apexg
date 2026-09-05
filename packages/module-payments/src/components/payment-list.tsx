"use client";

import type { Client, Payment } from "@apexg/core";
import { Card, Table, TableEmpty } from "@apexg/ui";
import PaymentRow from "./payment-row";
import { clientNameOf } from "./client-name";

const HEADERS = [
  "Cliente",
  "Fecha",
  "Monto",
  "Tipo",
  "Saldo",
  "Método",
] as const;

export interface PaymentListProps {
  payments: readonly Payment[];
  clients: readonly Client[];
}

export default function PaymentList({ payments, clients }: PaymentListProps) {
  return (
    <Card className="overflow-hidden">
      <Table headers={HEADERS}>
        {payments.length === 0 ? (
          <TableEmpty
            columns={HEADERS.length}
            message="No hay pagos registrados en esta vista."
          />
        ) : (
          payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              clientName={clientNameOf(clients, payment)}
            />
          ))
        )}
      </Table>
    </Card>
  );
}
