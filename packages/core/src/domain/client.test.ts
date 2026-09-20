import { describe, expect, it } from "vitest";
import type { IsoDate } from "./calendar";
import { isIsoDate } from "./calendar";
import { toMembershipTypeId } from "./membership";
import { findMembershipType } from "./membership-catalog";
import type { Client, ClientStatus } from "./client";
import {
  createClient,
  daysUntilExpiration,
  isExpiringSoon,
  matchesQuery,
  resolveStatus,
  retire,
  toClientId,
  withMembership,
} from "./client";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`bad test date: ${value}`);
  return value;
};

const TODAY = date("2026-06-15");

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: toClientId("c-1"),
    fullName: "Juan Pérez",
    idNumber: "1001234567",
    phone: "3001234567",
    email: "juan@email.com",
    membershipTypeId: toMembershipTypeId("monthly"),
    status: "active" satisfies ClientStatus,
    startDate: date("2026-06-01"),
    expirationDate: date("2026-07-01"),
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodType: "",
    medicalCondition: "",
    ...overrides,
  };
}

describe("resolveStatus (RF-21, SRS §4.2)", () => {
  it("stays active while the membership is current", () => {
    const client = makeClient({ expirationDate: date("2026-07-01") });
    expect(resolveStatus(client, TODAY)).toBe("active");
  });

  it("is still active on the expiration day itself", () => {
    const client = makeClient({ expirationDate: TODAY });
    expect(resolveStatus(client, TODAY)).toBe("active");
  });

  it("turns overdue the day after expiry", () => {
    const client = makeClient({ expirationDate: date("2026-06-14") });
    expect(resolveStatus(client, TODAY)).toBe("overdue");
  });

  it("honours a grace period when one is configured", () => {
    const client = makeClient({ expirationDate: date("2026-06-13") });
    expect(resolveStatus(client, TODAY, 3)).toBe("active");
    expect(resolveStatus(client, TODAY, 0)).toBe("overdue");
  });

  it("keeps a retired client inactive regardless of dates (SRS §4.5)", () => {
    const client = makeClient({
      status: "inactive",
      expirationDate: date("2020-01-01"),
    });
    expect(resolveStatus(client, TODAY)).toBe("inactive");
  });
});

describe("isExpiringSoon (derived view, not a stored state)", () => {
  it("flags a membership lapsing inside the window", () => {
    const client = makeClient({ expirationDate: date("2026-06-20") });
    expect(isExpiringSoon(client, TODAY)).toBe(true);
  });

  it("ignores one lapsing beyond the window", () => {
    const client = makeClient({ expirationDate: date("2026-06-30") });
    expect(isExpiringSoon(client, TODAY)).toBe(false);
  });

  it("does not flag an already overdue membership", () => {
    const client = makeClient({ expirationDate: date("2026-06-01") });
    expect(isExpiringSoon(client, TODAY)).toBe(false);
  });

  it("does not flag a retired client", () => {
    const client = makeClient({
      status: "inactive",
      expirationDate: date("2026-06-16"),
    });
    expect(isExpiringSoon(client, TODAY)).toBe(false);
  });
});

describe("daysUntilExpiration", () => {
  it("counts forward and backward", () => {
    expect(
      daysUntilExpiration(
        makeClient({ expirationDate: date("2026-06-20") }),
        TODAY,
      ),
    ).toBe(5);
    expect(
      daysUntilExpiration(
        makeClient({ expirationDate: date("2026-06-10") }),
        TODAY,
      ),
    ).toBe(-5);
  });
});

describe("retire (SRS §4.5)", () => {
  it("marks the client inactive without mutating the original", () => {
    const client = makeClient();
    const retired = retire(client);
    expect(retired.status).toBe("inactive");
    expect(client.status).toBe("active");
  });
});

describe("createClient / withMembership (RF-07)", () => {
  const plan = (id: string) => {
    const type = findMembershipType(toMembershipTypeId(id));
    if (!type) throw new Error(`missing membership type: ${id}`);
    return type;
  };

  it("derives the expiration date instead of trusting input", () => {
    const {
      id: _id,
      expirationDate: _expiry,
      ...draft
    } = makeClient({
      startDate: date("2026-06-01"),
    });
    const created = createClient(toClientId("c-9"), draft, plan("monthly"));

    expect(created.expirationDate).toBe("2026-07-01");
    expect(created.id).toBe("c-9");
  });

  it("re-derives expiry when the plan changes", () => {
    const client = makeClient({ startDate: date("2026-06-15") });
    const moved = withMembership(client, plan("fortnight"));

    expect(moved.membershipTypeId).toBe("fortnight");
    expect(moved.expirationDate).toBe("2026-06-30");
  });

  it("re-derives expiry when the start date changes (RF-06)", () => {
    const client = makeClient({ startDate: date("2026-06-01") });
    const moved = withMembership(client, plan("monthly"), date("2026-06-10"));

    expect(moved.expirationDate).toBe("2026-07-10");
  });
});

describe("matchesQuery", () => {
  const client = makeClient({
    fullName: "Juan Pérez",
    idNumber: "1001234567",
    phone: "3001234567",
  });

  it("matches an empty query", () => {
    expect(matchesQuery(client, "   ")).toBe(true);
  });

  it("matches on name, id number and phone, case-insensitively", () => {
    expect(matchesQuery(client, "juan")).toBe(true);
    expect(matchesQuery(client, "PÉREZ")).toBe(true);
    expect(matchesQuery(client, "100123")).toBe(true);
    expect(matchesQuery(client, "3001")).toBe(true);
  });

  it("does not match the email, which is not a search field", () => {
    expect(matchesQuery(client, "juan@email.com")).toBe(false);
  });

  it("rejects a query that matches nothing", () => {
    expect(matchesQuery(client, "zzz")).toBe(false);
  });
});
