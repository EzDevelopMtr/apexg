"use client";

import { useState } from "react";
import type { ClientSectionId } from "@apexg/core";
import { getClientSection, today } from "@apexg/core";
import { useClients } from "../hooks/use-clients";
import ClientsFormView from "./clients-form-view";
import ClientsListView from "./clients-list-view";
import { ErrorState, LoadingState } from "./load-state";

export interface ClientsPageProps {
  sectionId: ClientSectionId;
  /** Navigates to another section. Supplied by the app, which owns routing. */
  onNavigate: (sectionId: string) => void;
}

/**
 * Entry point of the module.
 *
 * Dispatches on the section's view kind instead of comparing URL strings, so a
 * new section needs no change here.
 */
export default function ClientsPage({
  sectionId,
  onNavigate,
}: ClientsPageProps) {
  // Resolved here rather than passed in: sections carry predicates, and a
  // function cannot cross the server/client boundary.
  const section = getClientSection(sectionId);

  const { items: clients, state, error, save, photoUrl, reload } =
    useClients();

  // Pinned once per mount: recomputing "today" on every render would make the
  // derived statuses flicker across a midnight boundary mid-session.
  const [referenceDate] = useState(today);

  if (section.view.kind === "form") {
    return (
      <div className="p-8">
        <ClientsFormView
          title={section.title}
          onSave={(draft, _existing, photo) => save(draft, undefined, photo)}
          onDone={() => onNavigate("all")}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
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
          onAdd={() => onNavigate("add")}
        />
      )}
    </div>
  );
}
