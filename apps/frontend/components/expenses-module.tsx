"use client";

import ListToolbar from "./list-toolbar";
import SectionHeading from "./section-heading";
import { useRouter } from "next/navigation";
import { useGymPath } from "../lib/gym-path";
import type { ExpenseSectionId } from "@apexg/core";
import { expenseSections } from "@apexg/core";
import { ExpensesPage } from "@apexg/module-expenses";
import { useSession } from "../lib/use-session";

const BASE_PATH = "/modules/expenses";

export default function ExpensesModule({
  sectionId,
}: {
  sectionId: ExpenseSectionId;
}) {
  const router = useRouter();
  const to = useGymPath();
  const { session } = useSession();

  // RequireModule already blocked anyone without a session.
  if (!session) return null;

  const section = expenseSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          moduleId="expenses"
          sectionId={sectionId}
          title={section.title}
        />
        <ListToolbar moduleId="expenses" basePath={BASE_PATH} />
        <ExpensesPage
          sectionId={sectionId}
          recordedBy={session.username}
          onNavigate={(next) => router.push(to(`${BASE_PATH}/${next}`))}
        />
      </div>
    </div>
  );
}
