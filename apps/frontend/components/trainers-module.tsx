"use client";

import ListToolbar from "./list-toolbar";
import SectionHeading from "./section-heading";
import { useRouter } from "next/navigation";
import type { TrainerSectionId } from "@apexg/core";
import { trainerSections } from "@apexg/core";
import { TrainersPage } from "@apexg/module-trainers";

const BASE_PATH = "/modules/trainers";

export default function TrainersModule({
  sectionId,
}: {
  sectionId: TrainerSectionId;
}) {
  const router = useRouter();
  const section = trainerSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          moduleId="trainers"
          sectionId={sectionId}
          title={section.title}
        />
        <ListToolbar moduleId="trainers" basePath={BASE_PATH} />
        <TrainersPage
          sectionId={sectionId}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
        />
      </div>
    </div>
  );
}
