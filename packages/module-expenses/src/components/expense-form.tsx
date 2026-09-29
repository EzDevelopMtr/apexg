"use client";

import { Save } from "lucide-react";
import type { ExpenseCategory } from "@apexg/core";
import type { ExpenseEntry } from "@apexg/data";
import { Button } from "@apexg/ui";
import { useExpenseForm } from "../hooks/use-expense-form";
import ExpenseFields from "./expense-fields";

export interface ExpenseFormProps {
  categories: readonly ExpenseCategory[];
  recordedBy: string;
  onCreate: (draft: ExpenseEntry, receipt?: Blob) => Promise<void>;
  onDone: () => void;
}

export default function ExpenseForm({
  categories,
  recordedBy,
  onCreate,
  onDone,
}: ExpenseFormProps) {
  const form = useExpenseForm(recordedBy, onCreate);

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (await form.submit()) onDone();
      }}
    >
      <ExpenseFields form={form} categories={categories} />

      {form.failure && (
        <p role="alert" className="text-sm text-danger-ink">
          {form.failure}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-line-soft pt-5">
        <Button variant="ghost" onClick={onDone} disabled={form.saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={form.saving}>
          <Save size={18} />
          {form.saving ? "Registrando..." : "Registrar egreso"}
        </Button>
      </div>
    </form>
  );
}
