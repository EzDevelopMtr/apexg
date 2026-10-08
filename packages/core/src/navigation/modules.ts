import type { AccentName } from "./accents";
import type { IconName } from "./icons";

/** A business module of the system. */
export interface Module {
  /** Segment used in the URL. */
  readonly id: string;
  /** User-facing name, in Spanish. */
  readonly name: string;
  /** Short description shown on the module card, in Spanish. */
  readonly description: string;
  readonly icon: IconName;
  /** Tells the module apart on the selector. Identity, never state. */
  readonly accent: AccentName;
  /**
   * Whether the module is built. Unavailable ones render as "Próximamente".
   * `route` is `null` exactly when `available` is false.
   */
  readonly available: boolean;
  readonly route: string | null;
  /** How often it is used: it decides where and how large it shows on the selector. */
  readonly tier: ModuleTier;
  /** The daily module the selector leads with. */
  readonly featured?: true;
  /** A daily module's most frequent task, offered right on its card. Route relative to the gym. */
  readonly shortcut?: { readonly label: string; readonly route: string };
}

/**
 * `daily`: used on every shift — large on the selector, with live figures and
 * one shortcut. `management`: checked now and then — compact, below.
 */
export type ModuleTier = "daily" | "management";

/**
 * Every module the SRS defines.
 *
 * The daily log is a module of its own rather than a section of Finances:
 * §2.2 grants it to the receptionist while denying her Finances.
 */
export const MODULES: readonly Module[] = [
  {
    id: "clients",
    name: "Clientes",
    description: "Gestiona los clientes del gimnasio",
    icon: "users",
    accent: "green",
    available: true,
    route: "/modules/clients/all",
    tier: "daily",
    shortcut: { label: "Agregar", route: "/modules/clients/add" },
  },
  {
    id: "memberships",
    name: "Membresías",
    description: "Planes, tarifas y condiciones",
    icon: "card",
    accent: "violet",
    available: true,
    route: "/modules/memberships/all",
    tier: "management",
  },
  {
    id: "payments",
    name: "Pagos",
    description: "Pagos, abonos y saldos",
    icon: "wallet",
    accent: "fuchsia",
    available: true,
    route: "/modules/payments/all",
    tier: "daily",
    shortcut: { label: "Cobrar", route: "/modules/payments/record" },
  },
  {
    id: "trainers",
    name: "Entrenadores",
    description: "Entrenadores y comisiones",
    icon: "dumbbell",
    accent: "orange",
    available: true,
    route: "/modules/trainers/all",
    tier: "management",
  },
  {
    id: "expenses",
    name: "Egresos",
    description: "Gastos y categorías",
    icon: "receipt",
    accent: "teal",
    available: true,
    route: "/modules/expenses/all",
    tier: "management",
  },
  {
    id: "inventory",
    name: "Inventario",
    description: "Ítems y existencias",
    icon: "package",
    accent: "rose",
    available: true,
    route: "/modules/inventory/all",
    tier: "management",
  },
  {
    id: "finances",
    name: "Finanzas",
    description: "Balances y reportes",
    icon: "chart",
    accent: "lime",
    available: true,
    route: "/modules/finances/dashboard",
    tier: "management",
  },
  {
    id: "dailyLog",
    name: "Apartado diario",
    description: "Ingresos, ventas y novedades del día",
    icon: "notebook",
    accent: "amber",
    available: true,
    route: "/modules/daily-log/today",
    tier: "daily",
    featured: true,
    shortcut: { label: "Registrar ingreso", route: "/modules/daily-log/today" },
  },
];

/**
 * The selector's two tiers. Daily modules lead, the featured one first; the
 * rest keep catalogue order. A new module only declares its tier.
 */
export function modulesByTier(modules: readonly Module[]): Record<ModuleTier, readonly Module[]> {
  const daily = modules.filter((module) => module.tier === "daily");
  return {
    daily: [...daily.filter((module) => module.featured), ...daily.filter((module) => !module.featured)],
    management: modules.filter((module) => module.tier === "management"),
  };
}

export function findModule(id: string): Module | undefined {
  return MODULES.find((module) => module.id === id);
}
