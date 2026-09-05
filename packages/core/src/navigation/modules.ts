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
 * Every module the SRS defines. Only Clients is built; the rest are listed so
 * the grid reflects the real scope rather than a subset of it.
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
    available: false,
    route: null,
  },
  {
    id: "payments",
    name: "Pagos",
    description: "Pagos, abonos y saldos",
    icon: "wallet",
    available: false,
    route: null,
  },
  {
    id: "trainers",
    name: "Entrenadores",
    description: "Entrenadores y comisiones",
    icon: "dumbbell",
    available: false,
    route: null,
  },
  {
    id: "expenses",
    name: "Egresos",
    description: "Gastos y categorías",
    icon: "receipt",
    available: false,
    route: null,
  },
  {
    id: "inventory",
    name: "Inventario",
    description: "Ítems y existencias",
    icon: "package",
    available: false,
    route: null,
  },
  {
    id: "finances",
    name: "Finanzas",
    description: "Balances y reportes",
    icon: "chart",
    available: false,
    route: null,
  },
  {
    id: "dailyLog",
    name: "Apartado diario",
    description: "Bitácora del día",
    icon: "notebook",
    available: false,
    route: null,
  },
];
