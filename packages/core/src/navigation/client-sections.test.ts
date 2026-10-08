import { describe, expect, it } from "vitest";
import type { IsoDate } from "../domain/calendar";
import { isIsoDate } from "../domain/calendar";
import type { Client } from "../domain/client";
import { toClientId } from "../domain/client";
import { toMembershipTypeId } from "../domain/membership";
import {
  CLIENT_SECTIONS,
  countClientsBySection,
  getClientSection,
  isClientSectionId,
} from "./client-sections";
import type { ClientSectionId } from "./client-sections";
import { DEFAULT_GYM_SETTINGS } from "../domain/gym-settings";

const date = (value: string): IsoDate => {
  if (!isIsoDate(value)) throw new Error(`bad test date: ${value}`);
  return value;
};

const TODAY = date("2026-06-15");

function makeClient(id: string, overrides: Partial<Client> = {}): Client {
  return {
    id: toClientId(id),
    fullName: `Client ${id}`,
    idNumber: id,
    phone: "3000000000",
    email: `${id}@email.com`,
    membershipTypeId: toMembershipTypeId("monthly"),
    status: "active",
    startDate: date("2026-06-01"),
    expirationDate: date("2026-07-01"),
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodType: "",
    medicalCondition: "",
    hasPhoto: false,
    ...overrides,
  };
}

const CURRENT = makeClient("current", { expirationDate: date("2026-07-01") });
const EXPIRING = makeClient("expiring", { expirationDate: date("2026-06-18") });
const OVERDUE = makeClient("overdue", { expirationDate: date("2026-06-01") });
const RETIRED = makeClient("retired", { status: "inactive" });

const ALL = [CURRENT, EXPIRING, OVERDUE, RETIRED];

function idsIn(sectionId: ClientSectionId): string[] {
  const section = getClientSection(sectionId);
  if (section.view.kind !== "list") {
    throw new Error(`${sectionId} is not a list section`);
  }
  const { includes } = section.view;
  return ALL.filter((client) => includes(client, TODAY)).map(
    (client) => client.id as string,
  );
}

describe("client sections", () => {
  it("exposes 'add' as a form, not a filter", () => {
    expect(getClientSection("add").view.kind).toBe("form");
  });

  it("narrows unknown URL segments", () => {
    expect(isClientSectionId("active")).toBe(true);
    expect(isClientSectionId("todos")).toBe(false);
    expect(isClientSectionId("../../etc")).toBe(false);
  });

  it("lists every client under 'all'", () => {
    expect(idsIn("all")).toHaveLength(ALL.length);
  });

  it("counts a client expiring soon as active too", () => {
    // Overlap is intentional: "expiring" is a heads-up view over active
    // clients, not a separate lifecycle state.
    expect(idsIn("active")).toEqual(["current", "expiring"]);
  });

  it("selects only the client past due under 'overdue'", () => {
    expect(idsIn("overdue")).toEqual(["overdue"]);
  });

  it("selects only the client lapsing inside the window", () => {
    expect(idsIn("expiring")).toEqual(["expiring"]);
  });

  it("excludes retired clients from every status view", () => {
    for (const sectionId of ["active", "expiring", "overdue"] as const) {
      expect(idsIn(sectionId)).not.toContain("retired");
    }
  });

  it("keeps every list section's predicate total", () => {
    // Guards the open/closed promise: a new section must work for any client
    // without the caller special-casing it.
    for (const section of CLIENT_SECTIONS) {
      if (section.view.kind !== "list") continue;
      for (const client of ALL) {
        expect(typeof section.view.includes(client, TODAY)).toBe("boolean");
      }
    }
  });
});

describe("client sections under a gym's settings", () => {
  // Expired two days ago: overdue by default, still active with 5 days of grace.
  const lapsed = {
    id: "c-grace",
    expirationDate: "2026-03-08",
    status: "active",
  } as unknown as Client;
  const on = "2026-03-10" as IsoDate;

  it("grace days keep a lapsed client out of En mora", () => {
    const overdue = getClientSection("overdue").view;
    if (overdue.kind !== "list") throw new Error("overdue is a list");
    expect(overdue.includes(lapsed, on)).toBe(true);
    expect(overdue.includes(lapsed, on, { ...DEFAULT_GYM_SETTINGS, graceDays: 5 })).toBe(false);
  });

  it("the expiring window follows the setting", () => {
    const expiring = getClientSection("expiring").view;
    if (expiring.kind !== "list") throw new Error("expiring is a list");
    const soon = { ...lapsed, expirationDate: "2026-03-20" } as typeof lapsed;
    expect(expiring.includes(soon, on)).toBe(false);
    expect(expiring.includes(soon, on, { ...DEFAULT_GYM_SETTINGS, expiringSoonDays: 14 })).toBe(true);
  });
});

describe("countClientsBySection", () => {
  it("cuenta cada filtro con el mismo predicado que su tabla", () => {
    const counts = countClientsBySection(ALL, TODAY);
    for (const id of ["all", "active", "expiring", "overdue"] as const) {
      expect(counts[id], id).toBe(idsIn(id).length);
    }
  });

  it("no cuenta el formulario: no es un filtro", () => {
    expect(countClientsBySection(ALL, TODAY).add).toBeUndefined();
  });

  it("respeta los días de gracia del gimnasio", () => {
    const sinGracia = countClientsBySection([OVERDUE], TODAY, DEFAULT_GYM_SETTINGS).overdue;
    const conGracia = countClientsBySection([OVERDUE], TODAY, { ...DEFAULT_GYM_SETTINGS, graceDays: 30 }).overdue;
    expect(sinGracia).toBe(1);
    expect(conGracia).toBe(0);
  });
});
