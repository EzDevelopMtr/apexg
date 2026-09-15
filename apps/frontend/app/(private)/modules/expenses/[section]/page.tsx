import { expenseSections } from "@apexg/core";
import ExpensesModule from "../../../../../components/expenses-module";
import { createSectionRoute } from "../../../../../lib/module-route";
import type { SectionRouteParams } from "../../../../../lib/module-route";

const route = createSectionRoute(expenseSections, "Egresos");

export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;

export default async function ExpensesSectionPage(props: SectionRouteParams) {
  return <ExpensesModule sectionId={await route.resolve(props)} />;
}
