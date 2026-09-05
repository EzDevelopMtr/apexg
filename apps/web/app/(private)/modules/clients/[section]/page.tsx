import { clientSections } from "@apexg/core";
import ClientsModule from "../../../../../components/clients-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(clientSections, "Clientes");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function ClientSectionPage(props: SectionRouteParams) {
  return <ClientsModule sectionId={await route.resolve(props)} />;
}
