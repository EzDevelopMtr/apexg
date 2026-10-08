"use client";

import { useState } from "react";
import type { ClientSectionId } from "@apexg/core";
import { clientSections, getClientSection, today } from "@apexg/core";
import type { ReactNode } from "react";
import type { ClientsToolbarSlots } from "./clients-list-view";
import { useClients } from "../hooks/use-clients";
import { Modal } from "@apexg/ui";
import ClientForm from "./client-form";
import ClientsListView from "./clients-list-view";
import { ErrorState, LoadingState } from "./load-state";

export interface ClientsPageProps {
  sectionId: ClientSectionId;
  /** Navigates to another section. Supplied by the app, which owns routing. */
  onNavigate: (sectionId: string) => void;
  /** Prefills the list's search. */
  initialQuery?: string;
  /** The app's filters and main action, sharing a row with the search. */
  toolbar?: (slots: ClientsToolbarSlots) => ReactNode;
}

/**
 * Entry point of the module.
 *
 * Dispatches on the section's view kind instead of comparing URL strings, so a
 * new section needs no change here. Adding a client opens as a dialog over the
 * list, which stays on screen and shows the new client when it closes.
 */
export default function ClientsPage({
  sectionId,
  onNavigate,
  initialQuery,
  toolbar,
}: ClientsPageProps) {
  // Resolved here rather than passed in: sections carry predicates, and a
  // function cannot cross the server/client boundary.
  const requested = getClientSection(sectionId);
  const section = clientSections.sectionBehind(sectionId);
  const close = () => onNavigate(section.id);

  const { items: clients, state, error, save, photoUrl, reload } =
    useClients();

  // Pinned once per mount: recomputing "today" on every render would make the
  // derived statuses flicker across a midnight boundary mid-session.
  const [referenceDate] = useState(today);

  return (
    <>
      {state === "loading" && <LoadingState />}

      {state === "error" && (
        <ErrorState message={error ?? "Error desconocido"} onRetry={reload} />
      )}

      {state === "ready" && (
        <ClientsListView
          clients={clients}
          section={section}
          referenceDate={referenceDate}
          onSave={save}
          photoUrl={photoUrl}
          initialQuery={initialQuery}
          toolbar={toolbar}
        />
      )}

      <Modal open={requested.view.kind === "form"} title={requested.title} onClose={close}>
        <ClientForm
          onSave={async (draft, _existing, photo) => {
            await save(draft, undefined, photo);
            close();
          }}
          onCancel={close}
        />
      </Modal>
    </>
  );
}
