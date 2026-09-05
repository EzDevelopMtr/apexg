"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { Expense, ExpenseCategory } from "@apexg/core";
import { fromPesos, isIsoDate, today } from "@apexg/core";
import { Button } from "@apexg/ui";
import ExpenseFields from "./expense-fields";
import type { ExpenseFieldsValues } from "./expense-fields";

export interface ExpenseFormProps {
  categories: readonly ExpenseCategory[];
  recordedBy: string;
  onCreate: (draft: Omit<Expense, "id">) => Promise<void>;
  onDone: () => void;
}

/** Mirrors what the API must also enforce (RNF-07). */
function validate(values: ExpenseFieldsValues): string | null {
  if (!values.categoryId) return "Selecciona una categoría.";
  if (!values.description.trim()) return "El concepto es obligatorio.";
  if (Number(values.amountPesos) <= 0) {
    return "El valor debe ser mayor que cero.";
  }
  if (!isIsoDate(values.spentOn)) return "La fecha no es válida.";
  return null;
}

export default function ExpenseForm({
  categories,
  recordedBy,
  onCreate,
  onDone,
}: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFieldsValues>({
    categoryId: "",
    description: "",
    amountPesos: "",
    spentOn: today(),
  });
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const setValue = <K extends keyof ExpenseFieldsValues>(
    field: K,
    value: ExpenseFieldsValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFailure(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = validate(values);
    if (problem) return setFailure(problem);
    if (!isIsoDate(values.spentOn)) return;

    setSaving(true);
    try {
      await onCreate({
        categoryId: values.categoryId,
        description: values.description.trim(),
        amount: fromPesos(Number(values.amountPesos)),
        spentOn: values.spentOn,
        recordedBy,
      });
      onDone();
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "No se pudo registrar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ExpenseFields
        values={values}
        categories={categories}
        setValue={setValue}
      />

      {failure && (
        <p role="alert" className="text-sm text-danger-ink">
          {failure}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-line-soft pt-5">
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Registrando..." : "Registrar egreso"}
        </Button>
      </div>
    </form>
  );
}
