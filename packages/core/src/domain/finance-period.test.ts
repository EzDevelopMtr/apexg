import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import type { FinancialRecords } from "./finance";
import {
  FINANCE_PERIODS,
  customRange,
  formatRange,
  isFinancePeriodId,
  previousRangeOf,
  trendGranularity,
  trendOver,
} from "./finance-period";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";
import type { Payment } from "./payment";
import { toCycleId, toPaymentId } from "./payment";
import { toClientId } from "./client";

const d = (value: string) => value as IsoDate;
const HOY = d("2026-09-26"); // sábado

const rangeOf = (id: string) =>
  FINANCE_PERIODS.find((period) => period.id === id)?.rangeOn?.(HOY);

function pago(id: string, paidOn: string, pesos: number): Payment {
  return {
    id: toPaymentId(id),
    clientId: toClientId("c1"),
    cycleId: toCycleId(toClientId("c1"), d("2026-01-01")),
    membershipTypeId: toMembershipTypeId("mensual"),
    agreedPrice: fromPesos(pesos),
    amount: fromPesos(pesos),
    balanceAfter: fromPesos(0),
    kind: "full",
    sequence: 1,
    paidOn: d(paidOn),
    method: "cash",
    receiptPath: "",
    recordedBy: "Recepción",
    notes: "",
  };
}

const REGISTROS: FinancialRecords = {
  payments: [
    pago("p1", "2026-09-01", 65_000),
    pago("p2", "2026-09-26", 25_000),
    pago("p3", "2026-08-10", 65_000),
  ],
  productSales: [],
  dayPasses: [],
  expenses: [],
  clients: [],
  savings: [],
};

describe("FINANCE_PERIODS", () => {
  it("la semana pasada va de lunes a domingo", () => {
    expect(rangeOf("lastWeek")).toEqual({ from: "2026-09-14", to: "2026-09-20" });
  });

  it("el mes actual es el mes calendario completo", () => {
    expect(rangeOf("thisMonth")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("los últimos 6 meses incluyen el actual", () => {
    expect(rangeOf("lastSixMonths")).toEqual({ from: "2026-04-01", to: "2026-09-30" });
  });

  it("el personalizado no trae rango propio", () => {
    expect(rangeOf("custom")).toBeUndefined();
    expect(isFinancePeriodId("custom")).toBe(true);
    expect(isFinancePeriodId("yesterday")).toBe(false);
  });
});

describe("customRange", () => {
  it("acepta un rango en orden, incluso de un solo día", () => {
    expect(customRange("2026-09-10", "2026-09-10")).toEqual({
      from: "2026-09-10",
      to: "2026-09-10",
    });
  });

  it("rechaza fechas incompletas o invertidas", () => {
    expect(customRange("", "2026-09-10")).toBeNull();
    expect(customRange("2026-09-20", "2026-09-10")).toBeNull();
  });
});

describe("previousRangeOf", () => {
  it("una semana se compara con la semana anterior", () => {
    expect(previousRangeOf({ from: d("2026-09-14"), to: d("2026-09-20") })).toEqual({
      from: "2026-09-07",
      to: "2026-09-13",
    });
  });

  it("un mes completo se compara con el mes anterior completo, no con 30 días", () => {
    expect(previousRangeOf({ from: d("2026-10-01"), to: d("2026-10-31") })).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });

  it("seis meses completos, con los seis anteriores", () => {
    expect(previousRangeOf({ from: d("2026-04-01"), to: d("2026-09-30") })).toEqual({
      from: "2025-10-01",
      to: "2026-03-31",
    });
  });
});

describe("trendOver", () => {
  it("hasta 31 días va día a día y marca hoy", () => {
    const range = { from: d("2026-09-01"), to: d("2026-09-30") };
    expect(trendGranularity(range)).toBe("day");
    const dias = trendOver(REGISTROS, range, HOY);
    expect(dias).toHaveLength(30);
    expect(dias[0]?.income).toBe(fromPesos(65_000));
    expect(dias[25]).toMatchObject({ label: "26", title: "26 sep", current: true });
    expect(dias.filter((dia) => dia.current)).toHaveLength(1);
  });

  it("más largo va mes a mes, recortando el primero y el último al rango", () => {
    const range = { from: d("2026-08-15"), to: d("2026-09-30") };
    expect(trendGranularity(range)).toBe("month");
    const meses = trendOver(REGISTROS, range, HOY);
    expect(meses.map((mes) => mes.label)).toEqual(["ago", "sep"]);
    // El pago del 10 de agosto queda fuera: el rango empieza el 15.
    expect(meses[0]?.income).toBe(fromPesos(0));
    expect(meses[1]).toMatchObject({ income: fromPesos(90_000), current: true });
  });
});

describe("formatRange", () => {
  it("abrevia según lo que compartan las dos fechas", () => {
    expect(formatRange({ from: d("2026-09-14"), to: d("2026-09-20") })).toBe("14 – 20 sep 2026");
    expect(formatRange({ from: d("2026-09-28"), to: d("2026-10-04") })).toBe(
      "28 sep – 4 oct 2026",
    );
    expect(formatRange({ from: d("2025-12-15"), to: d("2026-01-03") })).toBe(
      "15 dic 2025 – 3 ene 2026",
    );
  });
});
