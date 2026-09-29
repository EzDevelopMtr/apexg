"use client";

import SectionHeading from "./section-heading";
import type { FinanceSectionId } from "@apexg/core";
import { financeSections } from "@apexg/core";
import { FinancesPage } from "@apexg/module-finances";

export default function FinancesModule({
  sectionId,
}: {
  sectionId: FinanceSectionId;
}) {
  const section = financeSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          moduleId="finances"
          sectionId={sectionId}
          title={section.title}
        />
        <FinancesPage />
      </div>
    </div>
  );
}
