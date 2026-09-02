/**
 * Constantes del aprovisionamiento base de una empresa.
 *
 * Deben coincidir 1:1 con los seeds SQL de referencia:
 *   apps/backend/database/seeds/company/001_roles_permissions.sql
 *   apps/backend/database/seeds/company/002_membership_types.sql
 *   apps/backend/database/seeds/company/003_expense_categories.sql
 *
 * Si un seed SQL cambia, actualizar aquí (no al revés): el seed es la
 * especificación de referencia.
 */

/** Rol con acceso total. Recibe TODOS los permisos globales existentes. */
export const ADMINISTRATOR_ROLE = {
  name: 'Administrador',
  description: 'Acceso completo a la gestión del gimnasio',
  state: 1,
} as const;

/** Rol operativo. Recibe exactamente los 12 permisos de abajo. */
export const RECEPTIONIST_ROLE = {
  name: 'Recepcionista',
  description: 'Gestión operativa diaria del gimnasio',
  state: 1,
} as const;

/**
 * Los 12 permisos del Recepcionista (001_roles_permissions.sql).
 * `entrenadores.read` está incluido para poder seleccionar entrenador al
 * registrar planes Personalizado / Semipersonalizado.
 */
export const RECEPTIONIST_PERMISSION_CODES = [
  'clientes.create',
  'clientes.read',
  'clientes.update',
  'membresias.read',
  'pagos.create',
  'pagos.read',
  'entrenadores.read',
  'apartado_diario.create',
  'apartado_diario.read',
  'apartado_diario.update',
  'asistencia.create',
  'asistencia.read',
] as const;

/**
 * Forma de una fila de `membership_types` para el seed de aprovisionamiento.
 * Los importes NUMERIC van como string para preservar precisión exacta.
 */
export interface MembershipTypeSeed {
  name: string;
  price: string;
  description: string;
  durationValue: number;
  durationUnit: 'day' | 'month';
  minimumPayment: string | null;
  trainerShare: string | null;
  businessShare: string | null;
  allowsPartialPayment: boolean;
  isPromotional: boolean;
  state: number;
}

/**
 * Los 9 tipos de membresía base (002_membership_types.sql), valores exactos.
 * 'Personalizado' y 'Semipersonalizado' usan 1 mes como decisión de
 * implementación (el ERS no fija su duración).
 */
export const MEMBERSHIP_TYPE_SEED: readonly MembershipTypeSeed[] = [
  {
    name: 'Mensualidad (lunes a sábado)',
    price: '65000',
    description: 'Acceso de lunes a sábado durante un mes',
    durationValue: 1,
    durationUnit: 'month',
    minimumPayment: '30000',
    trainerShare: null,
    businessShare: null,
    allowsPartialPayment: true,
    isPromotional: false,
    state: 1,
  },
  {
    name: 'Mes 3 veces por semana',
    price: '50000',
    description: 'Acceso tres días por semana durante un mes',
    durationValue: 1,
    durationUnit: 'month',
    minimumPayment: '30000',
    trainerShare: null,
    businessShare: null,
    allowsPartialPayment: true,
    isPromotional: false,
    state: 1,
  },
  {
    name: 'Quincena',
    price: '45000',
    description: 'Vigencia de 15 días calendario',
    durationValue: 15,
    durationUnit: 'day',
    minimumPayment: null,
    trainerShare: null,
    businessShare: null,
    allowsPartialPayment: false,
    isPromotional: false,
    state: 1,
  },
  {
    name: 'Semana',
    price: '25000',
    description: 'Vigencia de 7 días calendario',
    durationValue: 7,
    durationUnit: 'day',
    minimumPayment: null,
    trainerShare: null,
    businessShare: null,
    allowsPartialPayment: false,
    isPromotional: false,
    state: 1,
  },
  {
    name: 'Día',
    price: '6000',
    description: 'Vigencia de un día',
    durationValue: 1,
    durationUnit: 'day',
    minimumPayment: null,
    trainerShare: null,
    businessShare: null,
    allowsPartialPayment: false,
    isPromotional: false,
    state: 1,
  },
  {
    name: 'Promo amigos/familiar',
    price: '60000',
    description:
      'Tarifa por persona para grupos de tres o más clientes que pagan juntos el mismo día',
    durationValue: 1,
    durationUnit: 'month',
    minimumPayment: null,
    trainerShare: null,
    businessShare: null,
    allowsPartialPayment: false,
    isPromotional: true,
    state: 1,
  },
  {
    name: 'Promo folleto físico',
    price: '55000',
    description:
      'Promoción para clientes nuevos que presentan folleto físico; aplica al primer mes',
    durationValue: 1,
    durationUnit: 'month',
    minimumPayment: null,
    trainerShare: null,
    businessShare: null,
    allowsPartialPayment: false,
    isPromotional: true,
    state: 1,
  },
  {
    name: 'Personalizado',
    price: '200000',
    description: 'Entrenamiento personalizado uno a uno',
    durationValue: 1,
    durationUnit: 'month',
    minimumPayment: '100000',
    trainerShare: '100000',
    businessShare: '100000',
    allowsPartialPayment: true,
    isPromotional: false,
    state: 1,
  },
  {
    name: 'Semipersonalizado',
    price: '150000',
    description: 'Entrenamiento semipersonalizado',
    durationValue: 1,
    durationUnit: 'month',
    minimumPayment: '75000',
    trainerShare: '75000',
    businessShare: '75000',
    allowsPartialPayment: true,
    isPromotional: false,
    state: 1,
  },
];

/** Forma de una fila de `expense_categories` para el seed. */
export interface ExpenseCategorySeed {
  name: string;
  description: string;
  state: number;
}

/** Las 4 categorías de egreso base (003_expense_categories.sql), texto exacto. */
export const EXPENSE_CATEGORY_SEED: readonly ExpenseCategorySeed[] = [
  {
    name: 'Nómina',
    description: 'Pagos de nómina y remuneraciones del personal',
    state: 1,
  },
  {
    name: 'Mantenimiento',
    description: 'Gastos de mantenimiento de equipos e instalaciones',
    state: 1,
  },
  {
    name: 'Servicios públicos',
    description: 'Pagos de servicios públicos del gimnasio',
    state: 1,
  },
  {
    name: 'Insumos de aseo/antibacteriales',
    description: 'Compra de productos de aseo, limpieza y antibacteriales',
    state: 1,
  },
];
