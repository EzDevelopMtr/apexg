import { describe, expect, it } from "vitest";
import {
  ZERO,
  add,
  atLeastZero,
  formatCOP,
  fromApiString,
  fromCents,
  fromPesos,
  multiply,
  subtract,
  toApiString,
  toPesos,
} from "./money";

describe("money", () => {
  it("stores pesos as integer cents", () => {
    expect(fromPesos(65_000)).toBe(6_500_000);
    expect(toPesos(fromPesos(65_000))).toBe(65_000);
  });

  it("rejects fractional cents", () => {
    expect(() => fromCents(10.5)).toThrow(RangeError);
  });

  it("does not accumulate floating point error", () => {
    // The bug this whole module exists to prevent: 0.1 + 0.2 !== 0.3.
    const tenCents = fromPesos(0.1);
    const twentyCents = fromPesos(0.2);
    expect(add(tenCents, twentyCents)).toBe(fromPesos(0.3));
  });

  it("splits a personal training payment evenly (SRS §4.4)", () => {
    const price = fromPesos(200_000);
    expect(multiply(price, 0.5)).toBe(fromPesos(100_000));
  });

  it("clamps negative balances at zero", () => {
    const overpaid = subtract(fromPesos(50_000), fromPesos(65_000));
    expect(atLeastZero(overpaid)).toBe(ZERO);
  });

  it("formats as Colombian pesos without decimals", () => {
    // Intl uses a non-breaking space, so compare on the digits.
    expect(formatCOP(fromPesos(65_000))).toContain("65.000");
  });

  it("parses the NUMERIC(_,2) string the backend sends", () => {
    expect(fromApiString("65000.00")).toBe(fromPesos(65_000));
    expect(fromApiString("0.50")).toBe(fromCents(50));
    expect(fromApiString("-100.00")).toBe(fromPesos(-100));
  });

  it("rejects a malformed API money string", () => {
    expect(() => fromApiString("65000")).toThrow(RangeError);
    expect(() => fromApiString("65,000.00")).toThrow(RangeError);
    expect(() => fromApiString("65000.0")).toThrow(RangeError);
  });

  it("round-trips through the API string shape", () => {
    for (const pesos of [0, 65_000, 0.5, -100, 1_234_567.89]) {
      const amount = fromPesos(pesos);
      expect(fromApiString(toApiString(amount))).toBe(amount);
    }
  });
});
