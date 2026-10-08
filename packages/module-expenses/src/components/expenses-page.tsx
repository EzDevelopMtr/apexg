"use client";

import { useMemo, useState } from "react";
import type { ExpenseSectionId } from "@apexg/core";
import { expenseSections, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { CategoryPanel, Modal } from "@apexg/ui";
import { useExpenseCategories, useExpenses } from "../hooks/use-expenses";

import ExpenseForm from "./expense-form";
import ExpenseList from "./expense-list";

export interface ExpensesPageProps {
  sectionId: ExpenseSectionId;
  recordedBy: string;
  onNavigate: (sectionId: string) => void;
}

/**
 * The list is always on screen. Registering an expense and managing the
 * categories open as dialogs over it — each is a short form, not a place — and
 * closing one returns to the list, already showing what was just saved.
 */
export default function ExpensesPage({
  sectionId,
  recordedBy,
  onNavigate,
}: ExpensesPageProps) {
  const requested = expenseSections.getSection(sectionId);
  const section = expenseSections.sectionBehind(sectionId);
  const expenses = useExpenses();
  const categories = useExpenseCategories();
  const [referenceDate] = useState(today);
  const close = () => onNavigate(section.id);

  const visible = useMemo(() => {
    if (section.view.kind !== "list") return [];
    const { includes } = section.view;
    return [...expenses.items]
      .filter((expense) => includes(expense, referenceDate))
      .sort((a, b) => b.spentOn.localeCompare(a.spentOn));
  }, [expenses.items, section, referenceDate]);

  return (
    <>
      <CollectionGate
        collection={expenses}
        loadingMessage="Cargando egresos..."
        errorMessage="No pudimos cargar los egresos."
      >
        <ExpenseList
          expenses={visible}
          categories={categories.items}
          receiptUrl={expenses.receiptUrl}
        />
      </CollectionGate>

      <Modal open={requested.view.kind === "form"} title={requested.title} onClose={close}>
        <CollectionGate
          collection={categories}
          loadingMessage="Cargando categorías..."
          errorMessage="No pudimos cargar las categorías."
        >
          <ExpenseForm
            categories={categories.items}
            recordedBy={recordedBy}
            onCreate={expenses.create}
            onDone={close}
          />
        </CollectionGate>
      </Modal>

      <Modal open={requested.view.kind === "panel"} title={requested.title} onClose={close}>
        <CollectionGate
          collection={categories}
          loadingMessage="Cargando categorías..."
          errorMessage="No pudimos cargar las categorías."
        >
          <CategoryPanel
            placeholder="Ej. Publicidad"
            categories={categories.items}
            onCreate={categories.create}
            onToggle={(category) =>
              categories.save({ ...category, active: !category.active })
            }
          />
        </CollectionGate>
      </Modal>
    </>
  );
}
