"use client";

import { useState } from "react";
import type {
  Commission,
  CommissionSettlementProblem,
  PaymentMethod,
} from "@apexg/core";
import { commissionSettlementProblems } from "@apexg/core";

export interface UseSettlementResult {
  readonly method: PaymentMethod;
  readonly setMethod: (method: PaymentMethod) => void;
  readonly receipt: File | null;
  readonly setReceipt: (receipt: File | null) => void;
  /** Empty until the first attempt: an untouched form is not an error yet. */
  readonly problems: readonly CommissionSettlementProblem[];
  readonly saving: boolean;
  readonly failure: string | null;
  /** `true` once paid. */
  readonly confirm: () => Promise<boolean>;
  readonly reset: () => void;
}

/**
 * The payout being confirmed in the settle dialog: how it was paid and its
 * receipt. One payout, one receipt, however many commissions it covers.
 */
export function useSettlement(
  pending: readonly Commission[],
  onSettle: (method: PaymentMethod, receipt?: Blob) => Promise<void>,
): UseSettlementResult {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const problems = commissionSettlementProblems({
    commissionCount: pending.length,
    method,
    hasReceipt: receipt !== null,
  });

  const reset = () => {
    setMethod("cash");
    setReceipt(null);
    setSubmitted(false);
    setFailure(null);
  };

  const confirm = async (): Promise<boolean> => {
    setSubmitted(true);
    if (problems.length > 0) return false;
    setSaving(true);
    setFailure(null);
    try {
      await onSettle(method, receipt ?? undefined);
      reset();
      return true;
    } catch (cause) {
      setFailure(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar el pago.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    method,
    setMethod,
    receipt,
    setReceipt,
    problems: submitted ? problems : [],
    saving,
    failure,
    confirm,
    reset,
  };
}
