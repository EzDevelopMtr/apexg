import { inventorySections } from "@apexg/core";
import InventoryModule from "../../../../../components/inventory-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(inventorySections, "Inventario");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function InventorySectionPage(props: SectionRouteParams) {
  return <InventoryModule sectionId={await route.resolve(props)} />;
}
