"use client";

import { useRouter } from "next/navigation";
import type { ClientSectionId } from "@apexg/core";
import { ClientsPage } from "@apexg/module-clients";
import { CLIENTS_BASE_PATH } from "./clients-sidebar";

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

  return (
    <ClientsPage
      sectionId={sectionId}
      onNavigate={(next) => router.push(`${CLIENTS_BASE_PATH}/${next}`)}
    />
  );
}
