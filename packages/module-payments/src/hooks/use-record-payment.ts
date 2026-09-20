"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  Client,
  ClientId,
  MembershipType,
  Money,
  Payment,
  PaymentMethod,
} from "@apexg/core";
import {
  checkPayment,
  classifyPayment,
  requiresReceipt,
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
  notes: string;
  /** Photo of the receipt. Required unless the client paid cash. */
  receipt: File | null;
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
  notes: "",
  receipt: null,
};

/**
 * One field changed, plus whatever that change drags with it.
 *
 * Choosing a method that needs no receipt also drops the file: its field
 * disappears with the switch, so a leftover attachment would ride along on the
 * payment with no control left on screen to remove it.
 */
function withField<K extends keyof RecordPaymentValues>(
  current: RecordPaymentValues,
  field: K,
  value: RecordPaymentValues[K],
): RecordPaymentValues {
  const next = { ...current, [field]: value };
  return requiresReceipt(next.method) ? next : { ...next, receipt: null };
}

/**
 * Every reason the form can refuse, in one place and outside the hook.
 *
 * Returns the message to show, or null when the values pass. Gathered here so
 * `build` reads as a mapping from a valid form to a draft, instead of that
 * mapping interleaved with the ways it can bail out.
 */
function rejectionFor(
  values: RecordPaymentValues,
  type: MembershipType,
  cycle: CycleSummary,
): string | null {
  const check = checkPayment(
    type,
    fromPesos(Number(values.amountPesos || 0)),
    cycle.balanceBefore,
  );
  if (!check.accepted) {
    return rejectionMessage(check.reason, type.name, type.minimumInstallment);
  }
  // Mirrors the API, which rejects the same thing (PaymentReceiptService).
  if (requiresReceipt(values.method) && !values.receipt) {
    return "Adjunta el comprobante: es obligatorio si el pago no es en efectivo.";
  }
  return null;
}

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
  initialClientId = "",
) {
  // Initial state, not an effect: the id arrives with the first render and
  // setting it afterwards would blank a choice the receptionist had already
  // made if the component happened to re-mount.
  const [values, setValues] = useState<RecordPaymentValues>({
    ...EMPTY,
    clientId: initialClientId,
  });
  const [error, setError] = useState<string | null>(null);
  const membershipTypes = useMembershipTypeCatalog();

  const setValue = useCallback(
    <K extends keyof RecordPaymentValues>(
      field: K,
      value: RecordPaymentValues[K],
    ) => {
      setValues((current) => withField(current, field, value));
      setError(null);
    },
    [],
  );

  const cycle = useMemo<CycleSummary | null>(() => {
    const client = clients.find((item) => item.id === values.clientId);
    if (!client) return null;

    const type = membershipTypes.items.find(
      (item) => item.id === client.membershipTypeId,
    );
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

    const type = membershipTypes.items.find(
      (item) => item.id === cycle.client.membershipTypeId,
    );
    if (!type) {
      setError("El plan del cliente ya no existe en el catálogo.");
      return null;
    }

    const rejection = rejectionFor(values, type, cycle);
    if (rejection) {
      setError(rejection);
      return null;
    }

    const amount = fromPesos(Number(values.amountPesos || 0));
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
      // Lo asigna el backend al guardar el archivo; el borrador no lo conoce.
      receiptPath: "",
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
