"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  Client,
  ClientDraft,
  ClientId,
  ClientSection,
  IsoDate,
} from "@apexg/core";
import { countClientsBySection } from "@apexg/core";
import { useGymSettings, useMembershipTypeCatalog } from "@apexg/module-kit";
import { Modal } from "@apexg/ui";
import { useVisibleClients } from "../hooks/use-visible-clients";
import { useClientReminders } from "../hooks/use-client-reminders";
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
  /** Prefills the search: a name picked on the selector's client search. */
  initialQuery?: string;
  /**
   * The app's toolbar (filters and main action, which route), given this
   * view's search and the count behind each filter so all share one row.
   */
  toolbar?: (slots: ClientsToolbarSlots) => ReactNode;
}

export interface ClientsToolbarSlots {
  readonly search: ReactNode;
  readonly counts: Partial<Record<string, number>>;
}

export default function ClientsListView({
  clients,
  section,
  referenceDate,
  onSave,
  photoUrl,
  initialQuery = "",
  toolbar,
}: ClientsListViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [editing, setEditing] = useState<Client | null>(null);
  const settings = useGymSettings();
  const visible = useVisibleClients(clients, section, { query, referenceDate, settings });
  const membershipTypes = useMembershipTypeCatalog();
  const reminders = useClientReminders();
  const counts = useMemo(() => countClientsBySection(clients, referenceDate, settings), [clients, referenceDate, settings]);
  const search = <ClientSearch value={query} onChange={setQuery} />;

  return (
    <>
      {toolbar ? toolbar({ search, counts }) : <div className="mb-4">{search}</div>}

      <ClientList
        clients={visible}
        referenceDate={referenceDate}
        membershipTypes={membershipTypes.items}
        photoUrl={photoUrl}
        onEdit={setEditing}
        settings={settings}
        reminders={reminders.latest}
        onRemind={reminders.record}
      />

      <Modal
        open={editing !== null}
        title="Editar cliente"
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
    </>
  );
}
