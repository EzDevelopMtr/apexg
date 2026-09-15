import { financeSections } from "@apexg/core";
import FinancesModule from "../../../../../components/finances-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(financeSections, "Finanzas");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function FinancesSectionPage(props: SectionRouteParams) {
  return <FinancesModule sectionId={await route.resolve(props)} />;
}
