import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  calculateExpirationDate,
  daysBetween,
  isIsoDate,
  toIsoDate,
} from "./calendar";

const date = (value: string) => {
  if (!isIsoDate(value)) throw new Error(`bad test date: ${value}`);
  return value;
};

describe("calendar", () => {
  it("rejects impossible calendar days", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("06-01-2026")).toBe(false);
    expect(isIsoDate("2026-02-28")).toBe(true);
  });

  it("formats using local components, not UTC", () => {
    expect(toIsoDate(new Date(2026, 0, 31))).toBe("2026-01-31");
  });

  it("clamps month arithmetic to the last day of the target month", () => {
    // Without clamping this rolls into March and grants free days.
    expect(addMonths(date("2026-01-31"), 1)).toBe("2026-02-28");
    expect(addMonths(date("2024-01-31"), 1)).toBe("2024-02-29");
    expect(addMonths(date("2026-03-31"), 1)).toBe("2026-04-30");
  });

  it("crosses year boundaries", () => {
    expect(addMonths(date("2026-12-15"), 1)).toBe("2027-01-15");
    expect(addDays(date("2026-12-31"), 1)).toBe("2027-01-01");
  });

  it("counts whole days between two dates", () => {
    expect(daysBetween(date("2026-06-15"), date("2026-06-30"))).toBe(15);
    expect(daysBetween(date("2026-06-30"), date("2026-06-15"))).toBe(-15);
  });

  describe("calculateExpirationDate (RF-07)", () => {
    it("matches the fortnight example in SRS §4.1", () => {
      // "inicia 15 jun., vence 30 jun."
      const expiry = calculateExpirationDate(date("2026-06-15"), {
        unit: "day",
        amount: 15,
      });
      expect(expiry).toBe("2026-06-30");
    });

    it("matches the monthly example in SRS §4.1", () => {
      // "inicia 1 jun., vence 1 jul."
      const expiry = calculateExpirationDate(date("2026-06-01"), {
        unit: "month",
        amount: 1,
      });
      expect(expiry).toBe("2026-07-01");
    });

    it("expires a day pass the next day", () => {
      const expiry = calculateExpirationDate(date("2026-06-01"), {
        unit: "day",
        amount: 1,
      });
      expect(expiry).toBe("2026-06-02");
    });
  });
});
