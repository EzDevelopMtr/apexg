import { redirect } from "next/navigation";
import { membershipSections } from "@apexg/core";

export default function MembershipsIndexPage() {
  redirect(`/modules/memberships/${membershipSections.defaultSectionId}`);
}
