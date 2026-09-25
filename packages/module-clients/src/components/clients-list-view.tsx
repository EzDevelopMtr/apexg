"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type {
  Client,
  ClientDraft,
  ClientId,
  ClientSection,
  IsoDate,
} from "@apexg/core";
import { useMembershipTypeCatalog } from "@apexg/module-kit";
import { Button, Modal, PageHeader } from "@apexg/ui";
import { useVisibleClients } from "../hooks/use-visible-clients";
import ClientForm from "./client-form";
import ClientList from "./client-list";
import ClientSearch from "./client-search";

export interface ClientsListViewProps {
  clients: readonly Client[];
  section: ClientSection;
  referenceDate: IsoDate;
  onSave: (
    draft: ClientDraft,
    existing?: Client,
    photo?: File,
  ) => Promise<void>;
  photoUrl: (clientId: ClientId) => string;
  onAdd: () => void;
}

export default function ClientsListView({
  clients,
  section,
  referenceDate,
  onSave,
  photoUrl,
  onAdd,
}: ClientsListViewProps) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const visible = useVisibleClients(clients, section, query, referenceDate);
  const membershipTypes = useMembershipTypeCatalog();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Gestión de clientes"
        title={section.title}
        description="Administra los clientes registrados en el gimnasio."
        action={
          // Routes to the dedicated form section rather than opening a second,
          // divergent modal for the same task.
          <Button onClick={onAdd}>
            <Plus size={20} />
            Agregar cliente
          </Button>
        }
      />

      <ClientSearch value={query} onChange={setQuery} />

      <ClientList
        clients={visible}
        referenceDate={referenceDate}
        membershipTypes={membershipTypes.items}
        photoUrl={photoUrl}
        onEdit={setEditing}
      />

      <Modal
        open={editing !== null}
        title="Editar cliente"
        description="Actualiza la información del cliente."
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ClientForm
            client={editing}
            onSave={async (draft, existing, photo) => {
              await onSave(draft, existing, photo);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
