import { redirect } from "next/navigation";
import { financeSections } from "@apexg/core";

export default function FinancesIndexPage() {
  redirect(`/modules/finances/${financeSections.defaultSectionId}`);
}
