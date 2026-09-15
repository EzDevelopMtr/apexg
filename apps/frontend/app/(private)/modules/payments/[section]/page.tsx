import { paymentSections } from "@apexg/core";
import PaymentsModule from "../../../../../components/payments-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(paymentSections, "Pagos");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function PaymentSectionPage(props: SectionRouteParams) {
  return <PaymentsModule sectionId={await route.resolve(props)} />;
}
