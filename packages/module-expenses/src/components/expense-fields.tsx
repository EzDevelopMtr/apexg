"use client";

import type {
  ExpenseCategory,
  ExpenseProblem,
  PaymentMethod,
} from "@apexg/core";
import {
  PAYMENT_METHOD_LABELS,
  activeCategories,
  requiresReceipt,
} from "@apexg/core";
import { FileInput, Input, Select, Textarea } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import type { UseExpenseFormResult } from "../hooks/use-expense-form";

const METHOD_OPTIONS: readonly SelectOption[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

const PROBLEM_TEXT: Record<ExpenseProblem, string> = {
  categoryRequired: "Selecciona una categoría.",
  descriptionRequired: "El concepto es obligatorio.",
  amountNotPositive: "El valor debe ser mayor que cero.",
  dateInvalid: "La fecha no es válida.",
  receiptRequired: "Adjunta la foto del comprobante de la transferencia.",
};

export interface ExpenseFieldsProps {
  form: Pick<UseExpenseFormResult, "values" | "setValue" | "problems">;
  categories: readonly ExpenseCategory[];
}

/** The fields of an expense (RF-26). Retired categories are not offered. */
export default function ExpenseFields({
  form,
  categories,
}: ExpenseFieldsProps) {
  const { values, setValue, problems } = form;
  const error = (problem: ExpenseProblem) =>
    problems.includes(problem) ? PROBLEM_TEXT[problem] : undefined;
  const options = activeCategories(categories).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <>
      <Select
        id="categoryId"
        label="Categoría"
        value={values.categoryId}
        options={options}
        placeholder="Selecciona una categoría"
        onChange={(event) => setValue("categoryId", event.target.value)}
        error={error("categoryRequired")}
      />

      <Textarea
        id="description"
        label="Concepto / justificación"
        value={values.description}
        onChange={(event) => setValue("description", event.target.value)}
        placeholder="Ej. Nómina mes de septiembre"
        error={error("descriptionRequired")}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="amountPesos"
          label="Valor (COP)"
          type="number"
          min={0}
          step={1000}
          value={values.amountPesos}
          onChange={(event) => setValue("amountPesos", event.target.value)}
          error={error("amountNotPositive")}
        />
        <Input
          id="spentOn"
          label="Fecha"
          type="date"
          value={values.spentOn}
          onChange={(event) => setValue("spentOn", event.target.value)}
          error={error("dateInvalid")}
        />
      </div>

      <Select
        id="expenseMethod"
        label="Forma de pago"
        options={METHOD_OPTIONS}
        value={values.paymentMethod}
        onChange={(event) =>
          setValue("paymentMethod", event.target.value as PaymentMethod)
        }
      />
      {requiresReceipt(values.paymentMethod) && (
        <FileInput
          id="expenseReceipt"
          label="Comprobante"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          file={values.receipt}
          onChange={(file) => setValue("receipt", file)}
          error={error("receiptRequired")}
        />
      )}
    </>
  );
}
