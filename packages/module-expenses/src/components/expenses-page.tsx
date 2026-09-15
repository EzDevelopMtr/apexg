"use client";

import { useMemo, useState } from "react";
import type { ExpenseSectionId } from "@apexg/core";
import { expenseSections, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Card, CardBody } from "@apexg/ui";
import { useExpenseCategories, useExpenses } from "../hooks/use-expenses";
import CategoryPanel from "./category-panel";
import ExpenseForm from "./expense-form";
import ExpenseList from "./expense-list";

export interface ExpensesPageProps {
  sectionId: ExpenseSectionId;
  recordedBy: string;
  onNavigate: (sectionId: string) => void;
}

export default function ExpensesPage({
  sectionId,
  recordedBy,
  onNavigate,
}: ExpensesPageProps) {
  const section = expenseSections.getSection(sectionId);
  const expenses = useExpenses();
  const categories = useExpenseCategories();
  const [referenceDate] = useState(today);

  const visible = useMemo(() => {
    if (section.view.kind !== "list") return [];
    const { includes } = section.view;
    return [...expenses.items]
      .filter((expense) => includes(expense, referenceDate))
      .sort((a, b) => b.spentOn.localeCompare(a.spentOn));
  }, [expenses.items, section, referenceDate]);

  if (section.view.kind === "form") {
    return (
      <CollectionGate
        collection={categories}
        loadingMessage="Cargando categorías..."
        errorMessage="No pudimos cargar las categorías."
      >
        <Card>
          <CardBody>
            <ExpenseForm
              categories={categories.items}
              recordedBy={recordedBy}
              onCreate={expenses.create}
              onDone={() => onNavigate("all")}
            />
          </CardBody>
        </Card>
      </CollectionGate>
    );
  }

  if (section.view.kind === "panel") {
    return (
      <CollectionGate
        collection={categories}
        loadingMessage="Cargando categorías..."
        errorMessage="No pudimos cargar las categorías."
      >
        <CategoryPanel categories={categories.items} onSave={categories.save} />
      </CollectionGate>
    );
  }

  return (
    <CollectionGate
      collection={expenses}
      loadingMessage="Cargando egresos..."
      errorMessage="No pudimos cargar los egresos."
    >
      <ExpenseList expenses={visible} categories={categories.items} />
    </CollectionGate>
  );
}
