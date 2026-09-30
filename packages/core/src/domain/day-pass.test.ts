import { describe, expect, it } from "vitest";

import { dayPassProblems } from "./day-pass";

describe("dayPassProblems", () => {
  const base = {
    visitorName: "Ana",
    amountPesos: "6000",
    paymentMethod: "cash" as const,
    hasReceipt: false,
  };

  it("en efectivo basta con el nombre y el valor", () => {
    expect(dayPassProblems(base)).toEqual([]);
  });

  it("el nombre es obligatorio, aunque venga en blanco con espacios", () => {
    expect(dayPassProblems({ ...base, visitorName: "   " })).toEqual([
      "nameRequired",
    ]);
  });

  it.each(["", "0", "-5000", "abc"])("el valor %j no pasa", (amountPesos) => {
    expect(dayPassProblems({ ...base, amountPesos })).toEqual([
      "amountNotPositive",
    ]);
  });

  it("una transferencia exige comprobante, igual que un pago", () => {
    expect(dayPassProblems({ ...base, paymentMethod: "transfer" })).toEqual([
      "receiptRequired",
    ]);
    expect(
      dayPassProblems({ ...base, paymentMethod: "transfer", hasReceipt: true }),
    ).toEqual([]);
  });
});
