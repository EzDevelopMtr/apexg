"use client";

import { useCallback, useState } from "react";
import type { DayPass, DayPassProblem, PaymentMethod } from "@apexg/core";
import { dayPassProblems, fromPesos, today } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";

export interface DayPassValues {
  visitorName: string;
  /** Pesos as typed, like an expense; converted to cents on sale. */
  amountPesos: string;
  paymentMethod: PaymentMethod;
  receipt: File | null;
}

const EMPTY: DayPassValues = {
  visitorName: "",
  amountPesos: "",
  paymentMethod: "cash",
  receipt: null,
};

/**
 * Selling day passes from the check-in screen, and the day's list of them.
 *
 * The visitor is never registered as a client, and the day is not a plan:
 * the receptionist types what was charged.
 */
export function useDayPasses() {
  const { dayPasses } = useRepositories();

  const load = useCallback(() => dayPasses.list(), [dayPasses]);
  const passes = useCollection<DayPass>(load);
  const { apply } = passes;

  const [values, setValues] = useState<DayPassValues>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const on = today();
  const problems: readonly DayPassProblem[] = dayPassProblems({
    ...values,
    hasReceipt: values.receipt !== null,
  });

  const setValue = <K extends keyof DayPassValues>(
    field: K,
    value: DayPassValues[K],
  ) => setValues((current) => ({ ...current, [field]: value }));

  const reset = () => {
    setValues(EMPTY);
    setSubmitted(false);
    setFailure(null);
  };

  /** `true` once sold; the dialog closes only then. */
  const sell = async (): Promise<boolean> => {
    setSubmitted(true);
    if (problems.length > 0) return false;
    setSaving(true);
    setFailure(null);
    try {
      const saved = await dayPasses.sell(
        {
          visitorName: values.visitorName,
          amount: fromPesos(Number(values.amountPesos)),
          paymentMethod: values.paymentMethod,
        },
        values.receipt ?? undefined,
      );
      apply((current) => [...current, saved]);
      reset();
      return true;
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "No pudimos vender el pase.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    today: passes.items.filter((pass) => pass.soldOn === on).reverse(),
    values,
    setValue,
    // Shown only after the first attempt: an empty form is not an error yet.
    problems: submitted ? problems : [],
    saving,
    failure,
    sell,
    reset,
    receiptUrl: dayPasses.receiptUrl.bind(dayPasses),
  };
}

export type UseDayPassesResult = ReturnType<typeof useDayPasses>;
