import { describe, expect, it } from "vitest";
import {
  ZERO,
  add,
  atLeastZero,
  formatCOP,
  fromCents,
  fromPesos,
  multiply,
  subtract,
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
});
