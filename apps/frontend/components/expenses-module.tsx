"use client";

import { useRouter } from "next/navigation";
import type { ExpenseSectionId } from "@apexg/core";
import { expenseSections } from "@apexg/core";
import { ExpensesPage } from "@apexg/module-expenses";
import { useSession } from "../lib/use-session";
import { PageHeader } from "@apexg/ui";

const BASE_PATH = "/modules/expenses";

export default function ExpensesModule({
  sectionId,
}: {
  sectionId: ExpenseSectionId;
}) {
  const router = useRouter();
  const { session } = useSession();

  // RequireModule already blocked anyone without a session.
  if (!session) return null;

  const section = expenseSections.getSection(sectionId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Gastos"
          title={section.title}
          description="Registra los egresos del gimnasio y administra sus categorías."
        />
        <ExpensesPage
          sectionId={sectionId}
          recordedBy={session.username}
          onNavigate={(next) => router.push(`${BASE_PATH}/${next}`)}
        />
      </div>
    </div>
  );
}
