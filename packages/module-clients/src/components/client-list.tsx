"use client";

import type { Client, IsoDate, MembershipType } from "@apexg/core";
import { useState } from "react";
import type { ClientId } from "@apexg/core";
import { Card, PhotoViewer, Table, TableEmpty } from "@apexg/ui";
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
  /** Dónde abrir la foto de un cliente. La arma la capa de datos. */
  photoUrl: (clientId: ClientId) => string;
  onEdit: (client: Client) => void;
}

export default function ClientList({
  clients,
  referenceDate,
  membershipTypes,
  photoUrl,
  onEdit,
}: ClientListProps) {
  // Una sola foto abierta a la vez, y por eso vive aquí: si cada fila tuviera
  // la suya, dos se podrían apilar una encima de otra.
  const [viewing, setViewing] = useState<Client | null>(null);

  return (
    <>
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
              membershipType={membershipTypes.find(
                (type) => type.id === client.membershipTypeId,
              )}
              photoUrl={client.hasPhoto ? photoUrl(client.id) : undefined}
              onEdit={onEdit}
              onOpenPhoto={() => setViewing(client)}
            />
          ))
        )}
      </Table>
    </Card>

    <PhotoViewer
      photo={
        viewing && viewing.hasPhoto
          ? { url: photoUrl(viewing.id), name: viewing.fullName }
          : null
      }
      onClose={() => setViewing(null)}
    />
    </>
  );
}
