import { redirect } from "next/navigation";
import { expenseSections } from "@apexg/core";

export default async function ExpensesIndexPage({ params }: { params: Promise<{ gym: string }> }) {
  const { gym } = await params;
  redirect(`/${gym}/modules/expenses/${expenseSections.defaultSectionId}`);
}
