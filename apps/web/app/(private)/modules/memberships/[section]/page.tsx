import { membershipSections } from "@apexg/core";
import MembershipsModule from "../../../../../components/memberships-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(membershipSections, "Membresías");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function MembershipSectionPage(props: SectionRouteParams) {
  return <MembershipsModule sectionId={await route.resolve(props)} />;
}
