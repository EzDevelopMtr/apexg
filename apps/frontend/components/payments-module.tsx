"use client";

import { useRouter } from "next/navigation";
import type { PaymentSectionId } from "@apexg/core";
import { paymentSections } from "@apexg/core";
import { PaymentsPage } from "@apexg/module-payments";
import { useSession } from "../lib/use-session";
import { PageHeader } from "@apexg/ui";

const BASE_PATH = "/modules/payments";

export default function PaymentsModule({
  sectionId,
}: {
  sectionId: PaymentSectionId;
}) {
  const router = useRouter();
  const { session } = useSession();

  // RequireModule already blocked anyone without a session.
  if (!session) return null;

  const section = paymentSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Cobros"
          title={section.title}
          description="Registra pagos completos y abonos, y consulta los saldos."
        />
        <PaymentsPage
          sectionId={sectionId}
          recordedBy={session.username}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
        />
      </div>
    </div>
  );
}
