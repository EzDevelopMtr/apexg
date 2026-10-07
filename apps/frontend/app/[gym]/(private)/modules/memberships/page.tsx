import { redirect } from "next/navigation";
import { membershipSections } from "@apexg/core";

export default async function MembershipsIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/memberships/${membershipSections.defaultSectionId}`);
}
