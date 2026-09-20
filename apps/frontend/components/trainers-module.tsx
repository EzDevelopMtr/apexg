"use client";

import { useRouter } from "next/navigation";
import type { TrainerSectionId } from "@apexg/core";
import { trainerSections } from "@apexg/core";
import { TrainersPage } from "@apexg/module-trainers";
import { PageHeader } from "@apexg/ui";

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
        <PageHeader
          eyebrow="Equipo"
          title={section.title}
          description="Entrenadores, disponibilidad y comisiones."
        />
        <TrainersPage
          sectionId={sectionId}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
        />
      </div>
    </div>
  );
}
