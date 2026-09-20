"use client";

import type { FinanceSectionId } from "@apexg/core";
import { financeSections } from "@apexg/core";
import { FinancesPage } from "@apexg/module-finances";
import { PageHeader } from "@apexg/ui";

export default function FinancesModule({
  sectionId,
}: {
  sectionId: FinanceSectionId;
}) {
  const section = financeSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Finanzas"
          title={section.title}
          description="Balances, utilidad y comisiones. Solo para el administrador."
        />
        <FinancesPage sectionId={sectionId} />
      </div>
    </div>
  );
}
