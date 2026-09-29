"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  DayPass,
  DayPassProblem,
  MembershipType,
  PaymentMethod,
} from "@apexg/core";
import {
  FREQUENT_VISITOR_PASSES,
  dayPassPlan,
  dayPassProblems,
  passesThisMonth,
  today,
  upgradePlan,
} from "@apexg/core";
import {
  useCollection,
  useMembershipTypeCatalog,
  useRepositories,
} from "@apexg/module-kit";

export interface DayPassValues {
  visitorName: string;
  visitorContact: string;
  paymentMethod: PaymentMethod;
  receipt: File | null;
}

const EMPTY: DayPassValues = {
  visitorName: "",
  visitorContact: "",
  paymentMethod: "cash",
  receipt: null,
};

/** Returning visitor, and the plan worth offering them. */
export interface FrequentVisitor {
  readonly earlierPasses: number;
  readonly plan: MembershipType;
}

/**
 * Selling day passes from the check-in screen, and the day's list of them.
 *
 * The price is never typed: it comes from the one-day plan in the catalogue
 * (the API sets it too, and would ignore anything sent). What the form owns
 * is who the visitor is and how they paid.
 */
export function useDayPasses() {
  const { dayPasses } = useRepositories();
  const plans = useMembershipTypeCatalog();

  const load = useCallback(() => dayPasses.list(), [dayPasses]);
  const passes = useCollection<DayPass>(load);
  const { apply } = passes;

  const [values, setValues] = useState<DayPassValues>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const on = today();
  const plan = dayPassPlan(plans.items);
  const problems: readonly DayPassProblem[] = dayPassProblems({
    ...values,
    hasReceipt: values.receipt !== null,
  });

  const frequent = useMemo((): FrequentVisitor | null => {
    const earlierPasses = passesThisMonth(passes.items, values.visitorContact, on);
    const offer = upgradePlan(plans.items);
    return earlierPasses >= FREQUENT_VISITOR_PASSES && offer
      ? { earlierPasses, plan: offer }
      : null;
  }, [passes.items, values.visitorContact, on, plans.items]);

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
    if (problems.length > 0 || !plan) return false;
    setSaving(true);
    setFailure(null);
    try {
      const saved = await dayPasses.sell(values, values.receipt ?? undefined);
      apply((current) => [...current, saved]);
      reset();
      return true;
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "No pudimos vender el pase.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    today: passes.items.filter((pass) => pass.soldOn === on).reverse(),
    plan,
    plansLoaded: plans.state === "ready",
    values,
    setValue,
    // Shown only after the first attempt: an empty form is not an error yet.
    problems: submitted ? problems : [],
    frequent,
    saving,
    failure,
    sell,
    reset,
    receiptUrl: dayPasses.receiptUrl.bind(dayPasses),
  };
}

export type UseDayPassesResult = ReturnType<typeof useDayPasses>;
