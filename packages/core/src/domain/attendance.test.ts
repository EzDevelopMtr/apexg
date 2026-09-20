import { describe, expect, it } from "vitest";
import type { IsoDate } from "./calendar";
import { toClientId } from "./client";
import { findMembershipType } from "./membership-catalog";
import { toMembershipTypeId } from "./membership";
import type { Attendance } from "./attendance";
import {
  isInside,
  peopleInside,
  toAttendanceId,
  visitQuota,
  weeklyAllowance,
} from "./attendance";

const plan = (id: string) => {
  const type = findMembershipType(toMembershipTypeId(id));
  if (!type) throw new Error(`missing plan: ${id}`);
  return type;
};

function visit(id: string, leftAt = ""): Attendance {
  return {
    id: toAttendanceId(id),
    clientId: toClientId("c-1"),
    clientName: "Laura Gómez",
    day: "2026-09-21" as IsoDate,
    enteredAt: "18:30",
    leftAt,
  };
}

describe("weeklyAllowance", () => {
  it("caps the three-days-a-week plan at three", () => {
    expect(weeklyAllowance(plan("monthlyThreeDays"))).toBe(3);
  });

  it("leaves the monthly plan uncapped", () => {
    expect(weeklyAllowance(plan("monthly"))).toBeNull();
  });
});

describe("visitQuota", () => {
  const capped = plan("monthlyThreeDays");

  it("reports nothing used before the first visit", () => {
    expect(visitQuota(weeklyAllowance(capped), 0)).toEqual({
      used: 0,
      allowed: 3,
      exhausted: false,
    });
  });

  it("is not exhausted while a visit is left", () => {
    expect(visitQuota(weeklyAllowance(capped), 2).exhausted).toBe(false);
  });

  it("is exhausted on the last allowed visit", () => {
    expect(visitQuota(weeklyAllowance(capped), 3).exhausted).toBe(true);
  });

  // The receptionist can wave someone through, so the count can pass the cap.
  // It must keep reading as exhausted rather than wrapping around.
  it("stays exhausted past the cap", () => {
    expect(visitQuota(weeklyAllowance(capped), 5).exhausted).toBe(true);
  });

  it("never exhausts an uncapped plan", () => {
    const quota = visitQuota(weeklyAllowance(plan("monthly")), 40);
    expect(quota.allowed).toBeNull();
    expect(quota.exhausted).toBe(false);
  });
});

describe("who is inside", () => {
  it("counts an entry with no exit", () => {
    expect(isInside(visit("a"))).toBe(true);
  });

  it("stops counting once the person is marked out", () => {
    expect(isInside(visit("a", "19:40"))).toBe(false);
  });

  it("filters the day down to those still in", () => {
    const today = [visit("a"), visit("b", "19:40"), visit("c")];
    expect(peopleInside(today).map((one) => one.id)).toEqual(["a", "c"]);
  });
});
