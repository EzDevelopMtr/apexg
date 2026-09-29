"use client";

import { useState } from "react";
import type { ExpenseProblem, PaymentMethod } from "@apexg/core";
import { expenseProblems, fromPesos, isIsoDate, today } from "@apexg/core";
import type { ExpenseEntry } from "@apexg/data";

export interface ExpenseFormValues {
  categoryId: string;
  description: string;
  amountPesos: string;
  spentOn: string;
  paymentMethod: PaymentMethod;
  receipt: File | null;
}

const empty = (): ExpenseFormValues => ({
  categoryId: "",
  description: "",
  amountPesos: "",
  spentOn: today(),
  paymentMethod: "cash",
  receipt: null,
});

export interface UseExpenseFormResult {
  readonly values: ExpenseFormValues;
  readonly setValue: <K extends keyof ExpenseFormValues>(
    field: K,
    value: ExpenseFormValues[K],
  ) => void;
  /** Empty until the first attempt: an untouched form is not an error yet. */
  readonly problems: readonly ExpenseProblem[];
  readonly saving: boolean;
  readonly failure: string | null;
  /** `true` once recorded. */
  readonly submit: () => Promise<boolean>;
}

/** The add-expense form's state; the rules come from `expenseProblems`. */
export function useExpenseForm(
  recordedBy: string,
  onCreate: (draft: ExpenseEntry, receipt?: Blob) => Promise<void>,
): UseExpenseFormResult {
  const [values, setValues] = useState<ExpenseFormValues>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const problems = expenseProblems({
    ...values,
    hasReceipt: values.receipt !== null,
  });

  const setValue = <K extends keyof ExpenseFormValues>(
    field: K,
    value: ExpenseFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFailure(null);
  };

  const submit = async (): Promise<boolean> => {
    setSubmitted(true);
    if (problems.length > 0 || !isIsoDate(values.spentOn)) return false;
    setSaving(true);
    try {
      await onCreate(
        {
          categoryId: values.categoryId,
          description: values.description.trim(),
          amount: fromPesos(Number(values.amountPesos)),
          spentOn: values.spentOn,
          recordedBy,
          paymentMethod: values.paymentMethod,
        },
        values.receipt ?? undefined,
      );
      return true;
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "No se pudo registrar.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    values,
    setValue,
    problems: submitted ? problems : [],
    saving,
    failure,
    submit,
  };
}
