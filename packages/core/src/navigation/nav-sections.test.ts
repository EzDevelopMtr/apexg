import { describe, expect, it } from "vitest";

import {
  NAV_SECTIONS,
  listFiltersFor,
  navSectionsFor,
  navTabsFor,
  needsVisibleTitle,
  primaryActionFor,
} from "./nav-sections";

const ids = (items: readonly { id: string }[]) => items.map((item) => item.id);

describe("navTabsFor", () => {
  it("un módulo con un solo lugar no muestra pestañas", () => {
    // Clientes: el listado (con sus filtros) y el formulario, que se abre
    // desde el botón de la tabla. No queda nada entre qué moverse.
    expect(navTabsFor("clients")).toEqual([]);
    expect(navTabsFor("payments")).toEqual([]);
    expect(navTabsFor("memberships")).toEqual([]);
  });

  it("el formulario no es pestaña si el módulo tiene listado", () => {
    expect(ids(navTabsFor("inventory"))).toEqual(["all", "categories"]);
    expect(ids(navTabsFor("trainers"))).toEqual(["all", "commissions"]);
    expect(ids(navTabsFor("expenses"))).toEqual(["all", "categories"]);
  });

  it("la pestaña del listado se rotula 'Listado' y cubre todos sus filtros", () => {
    const listado = navTabsFor("inventory")[0];
    expect(listado?.label).toBe("Listado");
    expect(listado?.matches).toEqual(["all", "lowStock", "outOfStock"]);
  });

  it("sin listado, cada sección —formularios incluidos— es su pestaña", () => {
    // Finanzas quedó en una sola vista: sin pestañas.
    expect(navTabsFor("finances")).toEqual([]);
    expect(ids(navTabsFor("dailyLog"))).toEqual([
      "today",
      "checkin",
      "history",
      "sell",
    ]);
  });

  it("ninguna sección se pierde: toda queda alcanzable por pestaña, filtro, acción o como portada", () => {
    for (const moduleId of Object.keys(NAV_SECTIONS)) {
      const alcanzables = new Set<string>([
        ...navTabsFor(moduleId).flatMap((tab) => tab.matches),
        ...ids(listFiltersFor(moduleId)),
      ]);
      const accion = primaryActionFor(moduleId);
      if (accion) alcanzables.add(accion.id);
      // La primera sección es a donde lleva la tarjeta del selector.
      const portada = navSectionsFor(moduleId)[0];
      if (portada) alcanzables.add(portada.id);

      expect([...alcanzables].sort(), moduleId).toEqual(
        ids(navSectionsFor(moduleId)).sort(),
      );
    }
  });
});

describe("primaryActionFor", () => {
  it("es el formulario cuando el módulo tiene listado", () => {
    expect(primaryActionFor("clients")?.label).toBe("Agregar cliente");
    expect(primaryActionFor("payments")?.label).toBe("Registrar pago");
  });

  it("no hay acción de tabla si el módulo no tiene tabla", () => {
    expect(primaryActionFor("dailyLog")).toBeNull();
    expect(primaryActionFor("finances")).toBeNull();
  });
});

describe("listFiltersFor", () => {
  it("devuelve los listados como filtros, el primero rotulado 'Todos'", () => {
    const filtros = listFiltersFor("inventory");
    expect(ids(filtros)).toEqual(["all", "lowStock", "outOfStock"]);
    expect(filtros[0]?.label).toBe("Todos");
    expect(filtros[1]?.label).toBe("Bajo mínimo");
  });

  it("con un solo listado no hay filtros que mostrar", () => {
    expect(listFiltersFor("expenses")).toEqual([]);
  });
});

describe("needsVisibleTitle", () => {
  it("solo el formulario abierto desde el botón lleva título visible", () => {
    expect(needsVisibleTitle("clients", "add")).toBe(true);
    expect(needsVisibleTitle("clients", "all")).toBe(false);
    expect(needsVisibleTitle("clients", "overdue")).toBe(false);
  });

  it("un formulario con pestaña no repite título: la pestaña ya lo dice", () => {
    expect(needsVisibleTitle("dailyLog", "sell")).toBe(false);
    expect(needsVisibleTitle("finances", "dashboard")).toBe(false);
  });
});
