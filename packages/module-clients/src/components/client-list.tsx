"use client";

import type { Client, IsoDate, MembershipType } from "@apexg/core";
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
  membershipTypes: readonly MembershipType[];
  onEdit: (client: Client) => void;
}

export default function ClientList({
  clients,
  referenceDate,
  membershipTypes,
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
              membershipType={membershipTypes.find((type) => type.id === client.membershipTypeId)}
              onEdit={onEdit}
            />
          ))
        )}
      </Table>
    </Card>
  );
}
