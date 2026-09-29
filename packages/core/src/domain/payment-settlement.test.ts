import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import { formatDayMonth, isIsoDate } from "./calendar";
import { toClientId } from "./client";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";
import type { Payment } from "./payment";
import { toCycleId, toPaymentId } from "./payment";
import { settledLaterOn, settlementDates } from "./payment-settlement";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`fecha inválida: ${value}`);
  return value;
};

const OSCAR = toClientId("c-oscar");
const CICLO = toCycleId(OSCAR, date("2026-09-16"));

function pago(overrides: Partial<Payment>): Payment {
  return {
    id: toPaymentId("p"),
    clientId: OSCAR,
    cycleId: CICLO,
    membershipTypeId: toMembershipTypeId("personal"),
    agreedPrice: fromPesos(200_000),
    amount: fromPesos(185_000),
    balanceAfter: fromPesos(15_000),
    kind: "installment",
    sequence: 1,
    paidOn: date("2026-09-16"),
    method: "transfer",
    receiptPath: "",
    recordedBy: "apexg",
    notes: "",
    ...overrides,
  };
}

const ABONO = pago({ id: toPaymentId("p1") });
const FINAL = pago({
  id: toPaymentId("p2"),
  amount: fromPesos(15_000),
  balanceAfter: fromPesos(0),
  kind: "finalInstallment",
  sequence: 2,
  paidOn: date("2026-09-23"),
});

describe("settledLaterOn", () => {
  it("un abono cuyo ciclo se completó después dice cuándo", () => {
    expect(settledLaterOn(ABONO, settlementDates([ABONO, FINAL]))).toBe("2026-09-23");
  });

  it("un abono todavía pendiente no se marca", () => {
    expect(settledLaterOn(ABONO, settlementDates([ABONO]))).toBeNull();
  });

  it("el pago que salda no se marca a sí mismo", () => {
    expect(settledLaterOn(FINAL, settlementDates([ABONO, FINAL]))).toBeNull();
  });

  it("un pago de otro ciclo no cuenta", () => {
    const otro = pago({
      id: toPaymentId("p3"),
      cycleId: toCycleId(OSCAR, date("2026-10-16")),
      balanceAfter: fromPesos(0),
      paidOn: date("2026-10-16"),
    });
    expect(settledLaterOn(ABONO, settlementDates([ABONO, otro]))).toBeNull();
  });
});

describe("formatDayMonth", () => {
  it("día sin cero y mes abreviado en español", () => {
    expect(formatDayMonth(date("2026-09-23"))).toBe("23 sep");
    expect(formatDayMonth(date("2026-01-05"))).toBe("5 ene");
  });
});
