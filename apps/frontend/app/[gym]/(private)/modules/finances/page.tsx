import { redirect } from "next/navigation";
import { financeSections } from "@apexg/core";

export default async function FinancesIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/finances/${financeSections.defaultSectionId}`);
}
