import { describe, expect, it } from "vitest";

import type { ExpenseDraft } from "./expense";
import { expenseProblems } from "./expense";

const base: ExpenseDraft = {
  categoryId: "utilities",
  description: "Energía",
  amountPesos: "420000",
  spentOn: "2026-09-02",
  paymentMethod: "cash",
  hasReceipt: false,
};

describe("expenseProblems", () => {
  it("un egreso completo en efectivo no tiene problemas", () => {
    expect(expenseProblems(base)).toEqual([]);
  });

  it("una transferencia sin comprobante no se registra", () => {
    expect(expenseProblems({ ...base, paymentMethod: "transfer" })).toEqual([
      "receiptRequired",
    ]);
  });

  it("una transferencia con comprobante sí", () => {
    expect(
      expenseProblems({ ...base, paymentMethod: "transfer", hasReceipt: true }),
    ).toEqual([]);
  });

  it("exige categoría, concepto, valor positivo y fecha válida", () => {
    expect(
      expenseProblems({
        ...base,
        categoryId: "",
        description: "   ",
        amountPesos: "0",
        spentOn: "ayer",
      }),
    ).toEqual([
      "categoryRequired",
      "descriptionRequired",
      "amountNotPositive",
      "dateInvalid",
    ]);
  });

  it("un valor que no es número no pasa", () => {
    expect(expenseProblems({ ...base, amountPesos: "abc" })).toEqual([
      "amountNotPositive",
    ]);
  });
});
