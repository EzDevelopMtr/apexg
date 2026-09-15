import { trainerSections } from "@apexg/core";
import TrainersModule from "../../../../../components/trainers-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(trainerSections, "Entrenadores");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function TrainersSectionPage(props: SectionRouteParams) {
  return <TrainersModule sectionId={await route.resolve(props)} />;
}
