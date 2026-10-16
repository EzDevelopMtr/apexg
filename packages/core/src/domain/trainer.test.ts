import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import { toClientId } from "./client";
import { fromPesos } from "./money";
import { toPaymentId } from "./payment";
import type { Commission } from "./trainer";
import {
  commissionSettlementProblems,
  latestSettlementWithReceipt,
  toTrainerId,
} from "./trainer";

describe("commissionSettlementProblems", () => {
  it("un pago en efectivo no exige comprobante", () => {
    expect(
      commissionSettlementProblems({
        commissionCount: 2,
        method: "cash",
        hasReceipt: false,
      }),
    ).toEqual([]);
  });

  it("una transferencia sin comprobante no se registra", () => {
    expect(
      commissionSettlementProblems({
        commissionCount: 2,
        method: "transfer",
        hasReceipt: false,
      }),
    ).toEqual(["receiptRequired"]);
  });

  it("una transferencia con comprobante sí", () => {
    expect(
      commissionSettlementProblems({
        commissionCount: 1,
        method: "transfer",
        hasReceipt: true,
      }),
    ).toEqual([]);
  });

  it("sin comisiones pendientes no hay nada que pagar", () => {
    expect(
      commissionSettlementProblems({
        commissionCount: 0,
        method: "cash",
        hasReceipt: false,
      }),
    ).toEqual(["nothingToSettle"]);
  });
});

describe("latestSettlementWithReceipt", () => {
  const trainer = toTrainerId("t1");
  const commission = (
    id: string,
    overrides: Partial<Commission>,
  ): Commission => ({
    id,
    trainerId: trainer,
    paymentId: toPaymentId(id),
    clientId: toClientId("c1"),
    amount: fromPesos(50_000),
    earnedOn: "2026-09-01" as IsoDate,
    settled: true,
    settledOn: "2026-09-02" as IsoDate,
    settlementMethod: "transfer",
    settlementReceiptPath: `${id}.jpg`,
    ...overrides,
  });

  it("devuelve la última liquidación del entrenador con comprobante", () => {
    const found = latestSettlementWithReceipt(
      [
        commission("k1", {}),
        commission("k2", {}),
        commission("k3", {
          settlementMethod: "cash",
          settlementReceiptPath: "",
        }),
        commission("k4", { trainerId: toTrainerId("t2") }),
        commission("k5", {
          settled: false,
          settlementMethod: null,
          settlementReceiptPath: "",
        }),
      ],
      trainer,
    );
    expect(found?.id).toBe("k2");
  });

  it("sin comprobantes no devuelve nada", () => {
    expect(latestSettlementWithReceipt([], trainer)).toBeUndefined();
  });
});
