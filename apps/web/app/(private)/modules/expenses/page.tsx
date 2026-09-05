import { redirect } from "next/navigation";
import { expenseSections } from "@apexg/core";

export default function ExpensesIndexPage() {
  redirect(`/modules/expenses/${expenseSections.defaultSectionId}`);
}
