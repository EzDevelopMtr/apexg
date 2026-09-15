"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Client,
  ClientId,
  Money,
  Payment,
  PaymentMethod,
} from "@apexg/core";
import {
  checkPayment,
  classifyPayment,
  formatCOP,
  fromPesos,
  outstandingBalance,
  paymentsInCycle,
  subtract,
  toCycleId,
  today,
} from "@apexg/core";
import { useMembershipTypeCatalog } from "@apexg/module-kit";

export interface RecordPaymentValues {
  clientId: string;
  amountPesos: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

/** What the form knows about the selected client's current cycle. */
export interface CycleSummary {
  readonly client: Client;
  readonly planName: string;
  readonly agreedPrice: Money;
  readonly balanceBefore: Money;
  readonly previousCount: number;
}

const EMPTY: RecordPaymentValues = {
  clientId: "",
  amountPesos: "",
  method: "cash",
  reference: "",
  notes: "",
};

/**
 * Turns a form into a payment record (RF-17 to RF-20).
 *
 * Every rule it applies — the minimum, the balance, the label — comes from
 * `@apexg/core`, so the API will reject exactly what this rejects (RNF-07).
 */
export function useRecordPayment(
  clients: readonly Client[],
  payments: readonly Payment[],
  recordedBy: string,
) {
  const [values, setValues] = useState<RecordPaymentValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const membershipTypes = useMembershipTypeCatalog();

  const setValue = useCallback(
    <K extends keyof RecordPaymentValues>(
      field: K,
      value: RecordPaymentValues[K],
    ) => {
      setValues((current) => ({ ...current, [field]: value }));
      setError(null);
    },
    [],
  );

  const cycle = useMemo<CycleSummary | null>(() => {
    const client = clients.find((item) => item.id === values.clientId);
    if (!client) return null;

    const type = membershipTypes.items.find((item) => item.id === client.membershipTypeId);
    if (!type) return null;

    const cycleId = toCycleId(client.id, client.startDate);

    return {
      client,
      planName: type.name,
      agreedPrice: type.price,
      balanceBefore: outstandingBalance(payments, cycleId, type.price),
      previousCount: paymentsInCycle(payments, cycleId).length,
    };
  }, [clients, payments, values.clientId, membershipTypes.items]);

  const build = useCallback((): Omit<Payment, "id"> | null => {
    if (!cycle) {
      setError("Selecciona un cliente.");
      return null;
    }

    const type = membershipTypes.items.find((item) => item.id === cycle.client.membershipTypeId);
    if (!type) {
      setError("El plan del cliente ya no existe en el catálogo.");
      return null;
    }

    const amount = fromPesos(Number(values.amountPesos || 0));
    const check = checkPayment(type, amount, cycle.balanceBefore);
    if (!check.accepted) {
      setError(
        rejectionMessage(check.reason, type.name, type.minimumInstallment),
      );
      return null;
    }

    if (!values.reference.trim()) {
      setError("La referencia del pago es obligatoria.");
      return null;
    }

    const balanceAfter = subtract(cycle.balanceBefore, amount);

    return {
      clientId: cycle.client.id as ClientId,
      cycleId: toCycleId(cycle.client.id, cycle.client.startDate),
      membershipTypeId: type.id,
      agreedPrice: cycle.agreedPrice,
      amount,
      balanceAfter,
      kind: classifyPayment(cycle.previousCount, balanceAfter),
      sequence: cycle.previousCount + 1,
      paidOn: today(),
      method: values.method,
      reference: values.reference.trim(),
      recordedBy,
      notes: values.notes.trim(),
    };
  }, [cycle, values, recordedBy, membershipTypes.items]);

  const reset = useCallback(() => {
    setValues(EMPTY);
    setError(null);
  }, []);

  return { values, setValue, cycle, error, setError, build, reset };
}

function rejectionMessage(
  reason: string,
  planName: string,
  minimum: Money | null,
): string {
  if (reason === "notPositive") return "El monto debe ser mayor que cero.";
  if (reason === "exceedsBalance") {
    return "El monto no puede superar el saldo pendiente.";
  }
  if (reason === "installmentsNotAllowed") {
    return `${planName} no admite abonos: debe pagarse completo.`;
  }
  return `El abono mínimo para ${planName} es ${minimum ? formatCOP(minimum) : "mayor"}.`;
}
