import { describe, expect, it } from "vitest";
import { MODULES, modulesByTier } from "./modules";

const ids = (modules: readonly { id: string }[]) => modules.map((module) => module.id);

describe("modulesByTier", () => {
  it("lo diario va primero y el apartado diario encabeza: es lo que más se usa", () => {
    expect(ids(modulesByTier(MODULES).daily)).toEqual(["dailyLog", "clients", "payments"]);
  });

  it("lo de gestión conserva el orden del catálogo", () => {
    expect(ids(modulesByTier(MODULES).management)).toEqual([
      "memberships",
      "trainers",
      "expenses",
      "inventory",
      "finances",
    ]);
  });

  it("ningún módulo se pierde entre los dos niveles", () => {
    const { daily, management } = modulesByTier(MODULES);
    expect(daily.length + management.length).toBe(MODULES.length);
  });

  it("cada módulo diario ofrece un atajo dentro del gimnasio", () => {
    for (const module of modulesByTier(MODULES).daily) {
      expect(module.shortcut?.route, module.id).toMatch(/^\/modules\//);
    }
  });
});
