import { describe, expect, it } from "vitest";
import {
  DEFAULT_MEMBERSHIP_TYPES,
  findMembershipType,
  isMembershipTypeId,
} from "./membership-catalog";
import {
  allowsInstallments,
  checkInstallment,
  requiresTrainer,
} from "./membership";
import { fromPesos, toPesos } from "./money";
import type { MembershipTypeId } from "./membership";

const get = (id: MembershipTypeId) => {
  const type = findMembershipType(id);
  if (!type) throw new Error(`missing membership type: ${id}`);
  return type;
};

describe("membership catalogue (SRS §4.1)", () => {
  it("ships the nine types the SRS defines", () => {
    expect(DEFAULT_MEMBERSHIP_TYPES).toHaveLength(9);
  });

  it.each([
    ["monthly", 65_000],
    ["monthlyThreeDays", 50_000],
    ["fortnight", 45_000],
    ["week", 25_000],
    ["day", 6_000],
    ["friendsPromo", 60_000],
    ["flyerPromo", 55_000],
    ["personalTraining", 200_000],
    ["semiPersonal", 150_000],
  ] as const)("prices %s at $%i", (id, pesos) => {
    expect(toPesos(get(id).price)).toBe(pesos);
  });

  it("narrows unknown ids", () => {
    expect(isMembershipTypeId("monthly")).toBe(true);
    expect(isMembershipTypeId("Trimestral")).toBe(false);
  });
});

describe("trainer split (SRS §4.4)", () => {
  it("splits personal training 100/100", () => {
    const split = get("personalTraining").trainerSplit;
    expect(split).toEqual({
      trainer: fromPesos(100_000),
      business: fromPesos(100_000),
    });
  });

  it("splits semi-personal 75/75", () => {
    const split = get("semiPersonal").trainerSplit;
    expect(split).toEqual({
      trainer: fromPesos(75_000),
      business: fromPesos(75_000),
    });
  });

  it("only the trainer-led plans require a trainer (RF-24)", () => {
    const withTrainer = DEFAULT_MEMBERSHIP_TYPES.filter(requiresTrainer);
    expect(withTrainer.map((type) => type.id)).toEqual([
      "personalTraining",
      "semiPersonal",
    ]);
  });

  it("the split always adds up to the price", () => {
    for (const type of DEFAULT_MEMBERSHIP_TYPES.filter(requiresTrainer)) {
      const split = type.trainerSplit;
      expect(split && split.trainer + split.business).toBe(type.price);
    }
  });
});

describe("installments (SRS §4.3, RF-19)", () => {
  it("allows installments only on the four plans that define a minimum", () => {
    const payable = DEFAULT_MEMBERSHIP_TYPES.filter(allowsInstallments);
    expect(payable.map((type) => type.id)).toEqual([
      "monthly",
      "monthlyThreeDays",
      "personalTraining",
      "semiPersonal",
    ]);
  });

  it("rejects installments on full-payment plans", () => {
    expect(checkInstallment(get("fortnight"), fromPesos(20_000))).toEqual({
      accepted: false,
      reason: "notAllowed",
    });
  });

  it("rejects an amount below the plan minimum", () => {
    expect(checkInstallment(get("monthly"), fromPesos(29_999))).toEqual({
      accepted: false,
      reason: "belowMinimum",
    });
  });

  it("accepts exactly the minimum", () => {
    expect(checkInstallment(get("monthly"), fromPesos(30_000))).toEqual({
      accepted: true,
    });
    expect(
      checkInstallment(get("personalTraining"), fromPesos(100_000)),
    ).toEqual({ accepted: true });
  });

  it("rejects zero, negative and over-price amounts", () => {
    expect(checkInstallment(get("monthly"), fromPesos(0)).accepted).toBe(false);
    expect(checkInstallment(get("monthly"), fromPesos(-1)).accepted).toBe(
      false,
    );
    expect(checkInstallment(get("monthly"), fromPesos(65_001))).toEqual({
      accepted: false,
      reason: "exceedsPrice",
    });
  });
});
