"use client";

import type { Client, IsoDate } from "@apexg/core";
import { Card, Table, TableEmpty } from "@apexg/ui";
import ClientRow from "./client-row";

const HEADERS = [
  "Cliente",
  "Documento",
  "Teléfono",
  "Membresía",
  "Estado",
  "Vencimiento",
  "Acción",
] as const;

export interface ClientListProps {
  clients: readonly Client[];
  referenceDate: IsoDate;
  onEdit: (client: Client) => void;
}

export default function ClientList({
  clients,
  referenceDate,
  onEdit,
}: ClientListProps) {
  return (
    <Card className="overflow-hidden">
      <Table headers={HEADERS}>
        {clients.length === 0 ? (
          <TableEmpty
            columns={HEADERS.length}
            message="No encontramos clientes. Intenta cambiar los filtros o la búsqueda."
          />
        ) : (
          clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              referenceDate={referenceDate}
              onEdit={onEdit}
            />
          ))
        )}
      </Table>
    </Card>
  );
}
