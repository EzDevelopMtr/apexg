import { dailyLogSections } from "@apexg/core";
import DailyLogModule from "../../../../../components/daily-log-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(dailyLogSections, "Apartado diario");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function DailyLogSectionPage(props: SectionRouteParams) {
  return <DailyLogModule sectionId={await route.resolve(props)} />;
}
