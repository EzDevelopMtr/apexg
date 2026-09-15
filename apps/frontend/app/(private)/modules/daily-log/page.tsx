import { redirect } from "next/navigation";
import { dailyLogSections } from "@apexg/core";

export default function DailyLogIndexPage() {
  redirect(`/modules/daily-log/${dailyLogSections.defaultSectionId}`);
}
