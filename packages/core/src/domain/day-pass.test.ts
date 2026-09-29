import { describe, expect, it } from "vitest";

import type { IsoDate } from "./calendar";
import type { DayPass } from "./day-pass";
import {
  dayPassPlan,
  dayPassProblems,
  passesThisMonth,
  toDayPassId,
  upgradePlan,
} from "./day-pass";
import type { MembershipType } from "./membership";
import { DEFAULT_MEMBERSHIP_TYPES } from "./membership-catalog";
import { toMembershipTypeId } from "./membership";
import { fromPesos } from "./money";

const plan = (overrides: Partial<MembershipType>): MembershipType => ({
  ...(DEFAULT_MEMBERSHIP_TYPES[0] as MembershipType),
  ...overrides,
});

const pass = (contact: string, soldOn: string): DayPass => ({
  id: toDayPassId(`${contact}-${soldOn}`),
  membershipTypeId: toMembershipTypeId("day"),
  visitorName: "Visitante",
  visitorContact: contact,
  amount: fromPesos(6_000),
  paymentMethod: "cash",
  soldOn: soldOn as IsoDate,
  soldAt: "08:00",
  receiptPath: "",
  recordedBy: "Recepción",
});

describe("dayPassPlan", () => {
  it("es el plan regular que dura exactamente un día", () => {
    expect(dayPassPlan(DEFAULT_MEMBERSHIP_TYPES)?.name).toBe("Día");
  });

  it("lo encuentra por su vigencia, no por su nombre", () => {
    const renombrado = plan({ name: "Visita", term: { unit: "day", amount: 1 } });
    expect(dayPassPlan([renombrado])?.name).toBe("Visita");
  });

  it("deja fuera las promociones y los planes más largos", () => {
    const promo = plan({ isPromotional: true, term: { unit: "day", amount: 1 } });
    const semana = plan({ term: { unit: "day", amount: 7 } });
    expect(dayPassPlan([promo, semana])).toBeUndefined();
  });

  it("con varios candidatos elige el más barato", () => {
    const caro = plan({ name: "Caro", price: fromPesos(9_000), term: { unit: "day", amount: 1 } });
    const barato = plan({ name: "Barato", price: fromPesos(5_000), term: { unit: "day", amount: 1 } });
    expect(dayPassPlan([caro, barato])?.name).toBe("Barato");
  });
});

describe("dayPassProblems", () => {
  const base = {
    visitorName: "Ana",
    visitorContact: "",
    paymentMethod: "cash" as const,
    hasReceipt: false,
  };

  it("en efectivo basta con el nombre", () => {
    expect(dayPassProblems(base)).toEqual([]);
  });

  it("el nombre es obligatorio, aunque venga en blanco con espacios", () => {
    expect(dayPassProblems({ ...base, visitorName: "   " })).toEqual(["nameRequired"]);
  });

  it("una transferencia exige comprobante, igual que un pago", () => {
    expect(dayPassProblems({ ...base, paymentMethod: "transfer" })).toEqual([
      "receiptRequired",
    ]);
    expect(
      dayPassProblems({ ...base, paymentMethod: "transfer", hasReceipt: true }),
    ).toEqual([]);
  });

  it("el contacto es opcional", () => {
    expect(dayPassProblems({ ...base, visitorContact: "" })).toEqual([]);
  });
});

describe("passesThisMonth", () => {
  const on = "2026-09-26" as IsoDate;

  it("cuenta por documento o teléfono, ignorando espacios y guiones", () => {
    const passes = [pass("300 123-4567", "2026-09-02"), pass("3001234567", "2026-09-20")];
    expect(passesThisMonth(passes, "300.123.4567", on)).toBe(2);
  });

  it("solo el mes en curso", () => {
    expect(passesThisMonth([pass("123", "2026-08-30")], "123", on)).toBe(0);
  });

  it("sin contacto no hay a quién reconocer", () => {
    expect(passesThisMonth([pass("", "2026-09-02")], "", on)).toBe(0);
  });
});

describe("upgradePlan", () => {
  it("ofrece el plan regular más barato que dure más de un día", () => {
    expect(upgradePlan(DEFAULT_MEMBERSHIP_TYPES)?.name).toBe("Semana");
  });
});
