import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";
import { toClientId } from "./client";
import type { DayPass } from "./day-pass";
import { toDayPassId } from "./day-pass";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";
import type { Payment } from "./payment";
import { toCycleId, toPaymentId } from "./payment";
import { EMPTY_PAYMENT_FILTER, filterPayments, paymentsTotal } from "./payment-filter";
import { ledgerOf } from "./payment-ledger";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`fecha de prueba inválida: ${value}`);
  return value;
};

const clientId = toClientId("c-juan");

const pago: Payment = {
  id: toPaymentId("p1"),
  clientId,
  cycleId: toCycleId(clientId, date("2026-10-01")),
  membershipTypeId: toMembershipTypeId("mensual"),
  agreedPrice: fromPesos(65_000),
  amount: fromPesos(65_000),
  balanceAfter: fromPesos(0),
  kind: "full",
  sequence: 1,
  paidOn: date("2026-10-05"),
  method: "cash",
  receiptPath: "",
  recordedBy: "Recepción mañana",
  notes: "",
};

const pase: DayPass = {
  id: toDayPassId("d1"),
  visitorName: "Ana Visitante",
  amount: fromPesos(8_000),
  paymentMethod: "transfer",
  soldOn: date("2026-10-06"),
  soldAt: "10:30",
  receiptPath: "ana.png",
  recordedBy: "Recepción tarde",
};

describe("ledgerOf", () => {
  const entries = ledgerOf([pago], [pase]);

  it("junta pagos y pases en un solo listado", () => {
    expect(entries.map((entry) => entry.id)).toEqual(["p1", "d1"]);
  });

  it("el total del listado incluye los pases", () => {
    expect(paymentsTotal(entries)).toBe(fromPesos(73_000));
  });

  it("el pase se filtra por su tipo, método y autor", () => {
    const names = (entry: (typeof entries)[number]) =>
      entry.kind === "dayPass" ? entry.pass.visitorName : "Juan";

    const onlyPasses = filterPayments(
      entries,
      { ...EMPTY_PAYMENT_FILTER, kind: "dayPass" },
      names,
    );
    expect(onlyPasses.map((entry) => entry.id)).toEqual(["d1"]);

    const byVisitor = filterPayments(
      entries,
      { ...EMPTY_PAYMENT_FILTER, query: "ana" },
      names,
    );
    expect(byVisitor.map((entry) => entry.id)).toEqual(["d1"]);

    const cash = filterPayments(
      entries,
      { ...EMPTY_PAYMENT_FILTER, method: "cash" },
      names,
    );
    expect(cash.map((entry) => entry.id)).toEqual(["p1"]);
  });
});
