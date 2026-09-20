"use client";

import { useRouter } from "next/navigation";
import type { DailyLogSectionId } from "@apexg/core";
import { dailyLogSections } from "@apexg/core";
import { DailyLogPage } from "@apexg/module-daily-log";
import { useSession } from "../lib/use-session";
import { PageHeader } from "@apexg/ui";

const BASE_PATH = "/modules/daily-log";

export default function DailyLogModule({
  sectionId,
}: {
  sectionId: DailyLogSectionId;
}) {
  const { session } = useSession();
  const router = useRouter();

  // RequireModule already blocked anyone without a session.
  if (!session) return null;

  const section = dailyLogSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Bitácora"
          title={section.title}
          description="Ingresos, clientes nuevos y novedades del día."
        />
        <DailyLogPage
          sectionId={sectionId}
          recordedBy={session.username}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
          // Payments owns the charge; the daily log only asks for it. The
          // client travels in the URL so the form opens already pointed at
          // the person standing at the counter.
          onCharge={(clientId) =>
            router.push(`/modules/payments/record?client=${clientId}`)
          }
        />
      </div>
    </div>
  );
}
