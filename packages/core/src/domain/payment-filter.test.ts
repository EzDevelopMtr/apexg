import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";
import { toClientId } from "./client";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";
import type { Payment } from "./payment";
import { toCycleId, toPaymentId } from "./payment";
import type { PaymentFilter } from "./payment-filter";
import {
  EMPTY_PAYMENT_FILTER,
  filterPayments,
  isPaymentFilterActive,
  paymentAuthors,
  paymentsTotal,
} from "./payment-filter";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`fecha de prueba inválida: ${value}`);
  return value;
};

const NOMBRES: Record<string, string> = {
  "c-juan": "Juan Pérez",
  "c-oscar": "Oscar Lopez",
};

function pago(id: string, overrides: Partial<Payment> = {}): Payment {
  const clientId = toClientId("c-juan");
  return {
    id: toPaymentId(id),
    clientId,
    cycleId: toCycleId(clientId, date("2026-09-01")),
    membershipTypeId: toMembershipTypeId("mensual"),
    agreedPrice: fromPesos(65_000),
    amount: fromPesos(65_000),
    balanceAfter: fromPesos(0),
    kind: "full",
    sequence: 1,
    paidOn: date("2026-09-15"),
    method: "cash",
    receiptPath: "",
    recordedBy: "Recepción mañana",
    notes: "",
    ...overrides,
  };
}

const PAGOS: Payment[] = [
  pago("p1"),
  pago("p2", {
    clientId: toClientId("c-oscar"),
    kind: "installment",
    amount: fromPesos(185_000),
    paidOn: date("2026-09-16"),
    method: "transfer",
    receiptPath: "abc.png",
    recordedBy: "Recepción tarde",
  }),
  pago("p3", {
    clientId: toClientId("c-oscar"),
    kind: "finalInstallment",
    amount: fromPesos(15_000),
    paidOn: date("2026-09-23"),
  }),
];

const filtrar = (cambios: Partial<PaymentFilter>) =>
  filterPayments(PAGOS, { ...EMPTY_PAYMENT_FILTER, ...cambios }, (p) =>
    NOMBRES[p.clientId] ?? "",
  ).map((p) => p.id);

describe("filterPayments", () => {
  it("el filtro vacío deja pasar todo", () => {
    expect(filtrar({})).toEqual(["p1", "p2", "p3"]);
  });

  it("busca por nombre sin importar mayúsculas ni tildes", () => {
    expect(filtrar({ query: "perez" })).toEqual(["p1"]);
    expect(filtrar({ query: "OSCAR" })).toEqual(["p2", "p3"]);
  });

  it("el rango de fechas incluye los dos extremos", () => {
    expect(filtrar({ from: date("2026-09-16") })).toEqual(["p2", "p3"]);
    expect(filtrar({ to: date("2026-09-16") })).toEqual(["p1", "p2"]);
    expect(
      filtrar({ from: date("2026-09-16"), to: date("2026-09-16") }),
    ).toEqual(["p2"]);
  });

  it("filtra por tipo, método, autor y comprobante", () => {
    expect(filtrar({ kind: "installment" })).toEqual(["p2"]);
    expect(filtrar({ method: "transfer" })).toEqual(["p2"]);
    expect(filtrar({ recordedBy: "Recepción mañana" })).toEqual(["p1", "p3"]);
    expect(filtrar({ receipt: "with" })).toEqual(["p2"]);
    expect(filtrar({ receipt: "without" })).toEqual(["p1", "p3"]);
  });

  it("los criterios se suman: tienen que cumplirse todos", () => {
    expect(filtrar({ query: "oscar", method: "cash" })).toEqual(["p3"]);
    expect(filtrar({ query: "juan", method: "transfer" })).toEqual([]);
  });
});

describe("isPaymentFilterActive", () => {
  it("vacío no está activo; cualquier criterio lo activa", () => {
    expect(isPaymentFilterActive(EMPTY_PAYMENT_FILTER)).toBe(false);
    expect(
      isPaymentFilterActive({ ...EMPTY_PAYMENT_FILTER, method: "cash" }),
    ).toBe(true);
  });
});

describe("paymentsTotal y paymentAuthors", () => {
  it("suma los montos de lo filtrado", () => {
    expect(paymentsTotal(PAGOS)).toBe(fromPesos(265_000));
  });

  it("lista los autores sin repetir y en orden", () => {
    expect(paymentAuthors(PAGOS)).toEqual(["Recepción mañana", "Recepción tarde"]);
  });
});
