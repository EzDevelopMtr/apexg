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
  /**
   * Whether the module is built. Unavailable ones render as "Próximamente".
   * `route` is `null` exactly when `available` is false.
   */
  readonly available: boolean;
  readonly route: string | null;
}

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
    available: true,
    route: "/modules/clients/all",
  },
  {
    id: "memberships",
    name: "Membresías",
    description: "Planes, tarifas y condiciones",
    icon: "card",
    available: true,
    route: "/modules/memberships/all",
  },
  {
    id: "payments",
    name: "Pagos",
    description: "Pagos, abonos y saldos",
    icon: "wallet",
    available: true,
    route: "/modules/payments/all",
  },
  {
    id: "trainers",
    name: "Entrenadores",
    description: "Entrenadores y comisiones",
    icon: "dumbbell",
    available: true,
    route: "/modules/trainers/all",
  },
  {
    id: "expenses",
    name: "Egresos",
    description: "Gastos y categorías",
    icon: "receipt",
    available: true,
    route: "/modules/expenses/all",
  },
  {
    id: "inventory",
    name: "Inventario",
    description: "Ítems y existencias",
    icon: "package",
    available: true,
    route: "/modules/inventory/all",
  },
  {
    id: "finances",
    name: "Finanzas",
    description: "Balances y reportes",
    icon: "chart",
    available: true,
    route: "/modules/finances/dashboard",
  },
  {
    id: "dailyLog",
    name: "Apartado diario",
    description: "Bitácora del día",
    icon: "notebook",
    available: true,
    route: "/modules/daily-log/today",
  },
];

export function findModule(id: string): Module | undefined {
  return MODULES.find((module) => module.id === id);
}
