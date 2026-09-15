import { redirect } from "next/navigation";
import { trainerSections } from "@apexg/core";

export default function TrainersIndexPage() {
  redirect(`/modules/trainers/${trainerSections.defaultSectionId}`);
}
