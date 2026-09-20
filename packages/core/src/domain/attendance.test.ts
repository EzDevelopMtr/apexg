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
  checkInRefusal,
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
    membershipName: "Mensualidad",
    weeklyVisits: 3,
    usedThisWeek: 1,
  };
}

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

  // Passed straight in: every seeded plan now carries a cap, so there is no
  // catalogue entry left to take an uncapped allowance from. The domain still
  // understands `null`, and this is what pins that it does.
  it("never exhausts an uncapped allowance", () => {
    const quota = visitQuota(null, 40);
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

describe("checkInRefusal", () => {
  const room = visitQuota(3, 1);
  const spent = visitQuota(3, 3);

  it("lets an active client with days left in", () => {
    expect(checkInRefusal("active", room)).toBeNull();
  });

  it("refuses a client with no membership", () => {
    expect(checkInRefusal(null, room)).toBe("noMembership");
  });

  it("refuses a retired client", () => {
    expect(checkInRefusal("inactive", room)).toBe("inactive");
  });

  it("refuses an overdue client", () => {
    expect(checkInRefusal("overdue", room)).toBe("overdue");
  });

  it("refuses an active client who spent the week", () => {
    expect(checkInRefusal("active", spent)).toBe("quotaSpent");
  });

  // Renewing is what unblocks them. Reporting the spent week instead would
  // send them home to wait for Monday, when Monday refuses them again.
  it("reports the expiry, not the quota, when both apply", () => {
    expect(checkInRefusal("overdue", spent)).toBe("overdue");
  });

  it("never refuses an uncapped plan on quota", () => {
    expect(checkInRefusal("active", visitQuota(null, 40))).toBeNull();
  });
});

describe("weekly allowances of the seeded catalogue", () => {
  // "Lunes a sábado" and "3 veces por semana" both carried their limit only in
  // the plan's name, where nothing could compare it. These pin the numbers so
  // a catalogue edit cannot quietly drop a cap back to unlimited.
  it("caps the monthly plan at six, the days the gym opens", () => {
    expect(weeklyAllowance(plan("monthly"))).toBe(6);
  });

  it("caps the three-days plan at three", () => {
    expect(weeklyAllowance(plan("monthlyThreeDays"))).toBe(3);
  });

  // Six is full access with the gym closed on Sundays. The short plans are
  // limited by their expiry date, which is a different thing and untouched.
  it("gives the short plans full weekly access", () => {
    expect(weeklyAllowance(plan("week"))).toBe(6);
    expect(weeklyAllowance(plan("day"))).toBe(6);
  });
});
