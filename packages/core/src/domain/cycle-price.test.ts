import { describe, expect, it } from "vitest";
import { cyclePrice } from "./cycle-price";
import { fromPesos } from "./money";

describe("cyclePrice", () => {
  const catalogue = fromPesos(100_000);
  const agreed = fromPesos(90_000);

  it("keeps the price agreed when the cycle began, even if the plan changed since", () => {
    expect(cyclePrice(catalogue, agreed, false)).toBe(agreed);
  });

  it("prices a renewal at the plan's current price: it is a new cycle", () => {
    expect(cyclePrice(catalogue, agreed, true)).toBe(catalogue);
  });

  it("falls back to the catalogue when the agreed price is unknown", () => {
    expect(cyclePrice(catalogue, undefined, false)).toBe(catalogue);
  });
});
