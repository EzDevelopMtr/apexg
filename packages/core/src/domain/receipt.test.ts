import { describe, expect, it } from "vitest";

import { isMissingReceipt, isPaymentMethod } from "./receipt";

describe("isMissingReceipt", () => {
  it("una transferencia sin comprobante está incompleta", () => {
    expect(isMissingReceipt("transfer", false)).toBe(true);
  });

  it("una transferencia con comprobante está completa", () => {
    expect(isMissingReceipt("transfer", true)).toBe(false);
  });

  it("el efectivo no lo exige, con o sin archivo", () => {
    expect(isMissingReceipt("cash", false)).toBe(false);
    expect(isMissingReceipt("cash", true)).toBe(false);
  });
});

describe("isPaymentMethod", () => {
  it("acepta los métodos del catálogo", () => {
    expect(isPaymentMethod("cash")).toBe(true);
    expect(isPaymentMethod("transfer")).toBe(true);
  });

  it("rechaza cualquier otro texto", () => {
    expect(isPaymentMethod("card")).toBe(false);
    expect(isPaymentMethod("")).toBe(false);
    expect(isPaymentMethod("toString")).toBe(false);
  });
});
