import { redirect } from "next/navigation";
import { trainerSections } from "@apexg/core";

export default async function TrainersIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/trainers/${trainerSections.defaultSectionId}`);
}
