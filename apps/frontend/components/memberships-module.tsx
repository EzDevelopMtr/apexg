"use client";

import ListToolbar from "./list-toolbar";
import SectionHeading from "./section-heading";
import { useRouter } from "next/navigation";
import type { MembershipSectionId } from "@apexg/core";
import { membershipSections } from "@apexg/core";
import { MembershipsPage } from "@apexg/module-memberships";
import { useSession } from "../lib/use-session";

const BASE_PATH = "/modules/memberships";

export default function MembershipsModule({
  sectionId,
}: {
  sectionId: MembershipSectionId;
}) {
  const router = useRouter();
  const { session } = useSession();

  // RequireModule already blocked anyone without a session.
  if (!session) return null;

  const section = membershipSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          moduleId="memberships"
          sectionId={sectionId}
          title={section.title}
        />
        <ListToolbar moduleId="memberships" basePath={BASE_PATH} />
        <MembershipsPage
          sectionId={sectionId}
          role={session.role}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
        />
      </div>
    </div>
  );
}
