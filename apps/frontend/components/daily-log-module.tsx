"use client";

import type { DailyLogSectionId } from "@apexg/core";
import { dailyLogSections } from "@apexg/core";
import { DailyLogPage } from "@apexg/module-daily-log";
import { useSession } from "../lib/use-session";
import ModulePageHeader from "./module-page-header";

export default function DailyLogModule({
  sectionId,
}: {
  sectionId: DailyLogSectionId;
}) {
  const { session } = useSession();

  // RequireModule already blocked anyone without a session.
  if (!session) return null;

  const section = dailyLogSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl">
        <ModulePageHeader
          eyebrow="Bitácora"
          title={section.title}
          description="Ingresos, clientes nuevos y novedades del día."
        />
        <DailyLogPage sectionId={sectionId} recordedBy={session.username} />
      </div>
    </div>
  );
}
