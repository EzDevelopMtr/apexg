"use client";

import ListToolbar from "./list-toolbar";
import SectionHeading from "./section-heading";
import { useRouter } from "next/navigation";
import type { InventorySectionId } from "@apexg/core";
import { inventorySections } from "@apexg/core";
import { InventoryPage } from "@apexg/module-inventory";

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
        <SectionHeading
          moduleId="inventory"
          sectionId={sectionId}
          title={section.title}
        />
        <ListToolbar moduleId="inventory" basePath={BASE_PATH} />
        <InventoryPage
          sectionId={sectionId}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
        />
      </div>
    </div>
  );
}
