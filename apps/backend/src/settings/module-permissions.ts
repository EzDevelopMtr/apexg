import type { ModuleId } from './setting-definitions.js';

/**
 * Prefijo de `permissions.code` → módulo de la app. Los que no aparecen
 * (usuarios, asistencia, auditoría) no se pueden apagar: el ingreso de
 * clientes y la seguridad no son opcionales.
 */
const MODULE_BY_PERMISSION_PREFIX: Readonly<Record<string, ModuleId>> = {
  clientes: 'clients',
  membresias: 'memberships',
  pagos: 'payments',
  entrenadores: 'trainers',
  egresos: 'expenses',
  inventario: 'inventory',
  finanzas: 'finances',
  apartado_diario: 'dailyLog',
};

/** El módulo apagado que bloquea este permiso, si lo hay. */
export function blockedModule(code: string, enabled: readonly ModuleId[]): ModuleId | undefined {
  const module = MODULE_BY_PERMISSION_PREFIX[code.split('.')[0] ?? ''];
  return module && !enabled.includes(module) ? module : undefined;
}
