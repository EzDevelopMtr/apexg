import { describe, expect, it } from "vitest";
import type { Role } from "./permissions";
import {
  canAccessModule,
  canManageMemberships,
  canViewFinancialReports,
  modulesFor,
} from "./permissions";

const ROLES: Role[] = ["admin", "receptionist"];

describe("permission matrix (SRS §2.2)", () => {
  it("gives the admin every module", () => {
    expect(modulesFor("admin")).toHaveLength(8);
  });

  it.each(["clients", "payments", "dailyLog"])(
    "lets the receptionist open %s",
    (moduleId) => {
      expect(canAccessModule("receptionist", moduleId)).toBe(true);
    },
  );

  it.each(["memberships", "trainers", "expenses", "inventory", "finances"])(
    "keeps the receptionist out of %s",
    (moduleId) => {
      // §2.2 marks each of these ✘ for the receptionist.
      expect(canAccessModule("receptionist", moduleId)).toBe(false);
    },
  );

  it("denies unknown modules to everyone", () => {
    for (const role of ROLES) {
      expect(canAccessModule(role, "nope")).toBe(false);
    }
  });

  it("restricts managing the membership catalogue to the admin (RF-12)", () => {
    expect(canManageMemberships("admin")).toBe(true);
    expect(canManageMemberships("receptionist")).toBe(false);
  });

  it("restricts consolidated reports to the admin", () => {
    expect(canViewFinancialReports("admin")).toBe(true);
    expect(canViewFinancialReports("receptionist")).toBe(false);
  });

  it("never lets the receptionist reach a module the admin cannot", () => {
    for (const moduleId of modulesFor("receptionist")) {
      expect(canAccessModule("admin", moduleId)).toBe(true);
    }
  });
});
