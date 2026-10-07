import { describe, expect, it } from "vitest";
import type { PlatformUser } from "./company";
import {
  isLastAdministrator,
  slugProblem,
  suggestSlug,
  suggestUsername,
  usernameProblem,
} from "./company-rules";

const user = (id: string, roleName: string, active = true): PlatformUser => ({
  id,
  username: id,
  fullName: id,
  roleId: 1,
  roleName,
  active,
  createdAt: "2026-10-06",
});

describe("slugProblem", () => {
  it("accepts a well-formed, free address", () => {
    expect(slugProblem("gimnasio-x", ["apex-gym"])).toBeNull();
  });

  it.each([
    ["ab", "too-short"],
    ["a".repeat(41), "too-long"],
    ["Gimnasio", "format"],
    ["gym--x", "format"],
    ["-gym", "format"],
    ["admin", "reserved"],
    ["login", "reserved"],
    ["apex-gym", "taken"],
  ] as const)("%s → %s", (slug, problem) => {
    expect(slugProblem(slug, ["apex-gym"])).toBe(problem);
  });
});

describe("usernameProblem", () => {
  it("accepts dots, dashes and underscores", () => {
    expect(usernameProblem("recepcion.tarde_2", [])).toBeNull();
  });

  it.each([
    ["ab", "too-short"],
    ["ana ruiz", "format"],
    ["recepción", "format"],
    ["admin", "taken"],
  ] as const)("%s → %s", (username, problem) => {
    expect(usernameProblem(username, ["admin"])).toBe(problem);
  });
});

describe("suggestions", () => {
  it("builds an address from a name, without accents", () => {
    expect(suggestSlug("Ñandú Fit Centro")).toBe("nandu-fit-centro");
    expect(suggestSlug("  Gym #1!  ")).toBe("gym-1");
  });

  it("builds a username from the first and last word", () => {
    expect(suggestUsername("Ana María Ruiz")).toBe("ana.ruiz");
    expect(suggestUsername("Recepción")).toBe("recepcion");
    expect(suggestUsername("")).toBe("");
  });
});

describe("isLastAdministrator", () => {
  const admin = user("a", "Administrador");
  const reception = user("r", "Recepcionista");

  it("is true for the only active administrator", () => {
    expect(isLastAdministrator(admin, [admin, reception])).toBe(true);
  });

  it("is false once there is another active one", () => {
    expect(isLastAdministrator(admin, [admin, user("b", "Administrador")])).toBe(false);
  });

  it("an inactive administrator does not share the load", () => {
    expect(isLastAdministrator(admin, [admin, user("b", "Administrador", false)])).toBe(true);
  });

  it("never applies to someone who is not an active administrator", () => {
    expect(isLastAdministrator(reception, [admin, reception])).toBe(false);
  });
});
