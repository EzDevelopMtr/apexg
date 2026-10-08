"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useGymPath } from "../lib/gym-path";
import type { ClientSectionId } from "@apexg/core";
import { getClientSection } from "@apexg/core";
import { ClientsPage } from "@apexg/module-clients";
import ListToolbar from "./list-toolbar";
import SectionHeading from "./section-heading";
const CLIENTS_BASE_PATH = "/modules/clients";

/**
 * Bridges the module to Next.js routing.
 *
 * `@apexg/module-clients` stays router-agnostic; the app decides what
 * navigating to a section means.
 */
export default function ClientsModule({
  sectionId,
}: {
  sectionId: ClientSectionId;
}) {
  const router = useRouter();
  const to = useGymPath();
  // A name picked on the selector's client search arrives as ?q=.
  const initialQuery = useSearchParams().get("q") ?? undefined;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          moduleId="clients"
          sectionId={sectionId}
          title={getClientSection(sectionId).title}
        />
        <ClientsPage
          sectionId={sectionId}
          initialQuery={initialQuery}
          toolbar={({ search, counts }) => (
            <ListToolbar moduleId="clients" basePath={CLIENTS_BASE_PATH} search={search} counts={counts} />
          )}
          onNavigate={(next) => router.push(to(`${CLIENTS_BASE_PATH}/${next}`))}
        />
      </div>
    </div>
  );
}
