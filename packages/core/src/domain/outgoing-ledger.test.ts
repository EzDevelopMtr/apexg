import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";
import { toClientId } from "./client";
import type { Expense } from "./expense";
import { toExpenseId } from "./expense";
import { fromPesos } from "./money";
import { commissionPayouts, outgoingsOf } from "./outgoing-ledger";
import { toPaymentId } from "./payment";
import type { Commission } from "./trainer";
import { toTrainerId } from "./trainer";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`fecha de prueba inválida: ${value}`);
  return value;
};

function comision(
  id: string,
  trainer: string,
  settledOn: string | null,
  receipt = "",
): Commission {
  return {
    id,
    trainerId: toTrainerId(trainer),
    paymentId: toPaymentId(id),
    clientId: toClientId("c1"),
    amount: fromPesos(25_000),
    earnedOn: date("2026-10-01"),
    settled: settledOn !== null,
    settledOn: settledOn === null ? null : date(settledOn),
    settlementMethod: settledOn === null ? null : "transfer",
    settlementReceiptPath: receipt,
  };
}

const arriendo: Expense = {
  id: toExpenseId("e1"),
  categoryId: "arriendo",
  description: "Arriendo octubre",
  amount: fromPesos(900_000),
  spentOn: date("2026-10-05"),
  recordedBy: "admin",
  paymentMethod: "transfer",
  receiptPath: "",
};

describe("pagos de comisiones como egreso", () => {
  const comisiones = [
    comision("k1", "ana", "2026-10-09", "r1.png"),
    comision("k2", "ana", "2026-10-09", "r1.png"),
    comision("k3", "luis", "2026-10-09", "r2.png"),
    comision("k4", "ana", null),
  ];

  it("agrupa en un pago lo liquidado junto, y deja fuera lo pendiente", () => {
    const pagos = commissionPayouts(comisiones);
    expect(pagos).toHaveLength(2);
    const ana = pagos.find((pago) => pago.trainerId === toTrainerId("ana"));
    expect(ana?.amount).toBe(fromPesos(50_000));
    expect(ana?.commissions.map((one) => one.id)).toEqual(["k1", "k2"]);
  });

  it("lista egresos y pagos a entrenadores juntos, lo más reciente primero", () => {
    const filas = outgoingsOf([arriendo], comisiones);
    expect(filas.map((fila) => fila.kind)).toEqual(["commissions", "commissions", "expense"]);
  });
});
