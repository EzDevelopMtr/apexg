import { redirect } from "next/navigation";
import { dailyLogSections } from "@apexg/core";

export default async function DailyLogIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/daily-log/${dailyLogSections.defaultSectionId}`);
}
