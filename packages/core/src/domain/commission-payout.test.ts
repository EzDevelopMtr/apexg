import { describe, expect, it } from "vitest";

import type { DateRange, IsoDate } from "./calendar";
import { isIsoDate, rangeFor } from "./calendar";
import { toClientId } from "./client";
import { calculateBalance } from "./finance";
import { COMMISSIONS_KEY, expensesByCategory } from "./finance-insights";
import { fromPesos } from "./money";
import { toPaymentId } from "./payment";
import type { Commission } from "./trainer";
import { commissionsPaidOutIn, toTrainerId } from "./trainer";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`fecha de prueba inválida: ${value}`);
  return value;
};

const HOY = date("2026-10-16");

function comision(
  id: string,
  pesos: number,
  settledOn: IsoDate | null,
): Commission {
  return {
    id,
    trainerId: toTrainerId("t1"),
    paymentId: toPaymentId(id),
    clientId: toClientId("c1"),
    amount: fromPesos(pesos),
    earnedOn: date("2026-09-20"),
    settled: settledOn !== null,
    settledOn,
    settlementMethod: settledOn === null ? null : "cash",
    settlementReceiptPath: "",
  };
}

const COMISIONES = [
  comision("k1", 50_000, HOY),
  comision("k2", 30_000, date("2026-09-30")),
  comision("k3", 70_000, null),
];

describe("comisiones pagadas como egreso", () => {
  const octubre: DateRange = rangeFor("month", HOY);

  it("cuenta solo las pagadas, por el día en que se pagaron", () => {
    // k2 se ganó y se pagó en septiembre; k3 se debe pero no ha salido plata.
    expect(commissionsPaidOutIn(COMISIONES, octubre)).toBe(fromPesos(50_000));
  });

  it("bajan la utilidad igual que un egreso", () => {
    const balance = calculateBalance(
      {
        payments: [],
        productSales: [],
        dayPasses: [],
        expenses: [],
        clients: [],
        savings: [],
        commissions: COMISIONES,
      },
      "month",
      HOY,
    );
    expect(balance.expenses).toBe(fromPesos(50_000));
    expect(balance.profit).toBe(fromPesos(-50_000));
  });

  it("aparecen como su propia barra en el desglose de egresos", () => {
    const gastos = expensesByCategory(
      { expenses: [], commissions: COMISIONES },
      octubre,
      rangeFor("month", date("2026-09-10")),
      () => "nunca",
    );
    expect(gastos).toEqual([
      {
        key: COMMISSIONS_KEY,
        label: "Comisiones de entrenadores",
        amount: fromPesos(50_000),
        previous: fromPesos(30_000),
      },
    ]);
  });
});
