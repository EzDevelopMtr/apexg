"use client";

import { useRouter } from "next/navigation";
import type { InventorySectionId } from "@apexg/core";
import { inventorySections } from "@apexg/core";
import { InventoryPage } from "@apexg/module-inventory";
import { PageHeader } from "@apexg/ui";

const BASE_PATH = "/modules/inventory";

export default function InventoryModule({
  sectionId,
}: {
  sectionId: InventorySectionId;
}) {
  const router = useRouter();
  const section = inventorySections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Existencias"
          title={section.title}
          description="Ítems, existencias y alertas de stock mínimo."
        />
        <InventoryPage
          sectionId={sectionId}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
        />
      </div>
    </div>
  );
}
