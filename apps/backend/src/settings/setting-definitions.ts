/**
 * Catálogo de ajustes. Agregar un ajuste es agregar un registro aquí (regla 3
 * de CLAUDE.md): las tablas de 023 solo guardan lo que se cambió.
 *
 * Los ids de módulo son los de `MODULES` en `@apexg/core`
 * (navigation/modules.ts); se repiten porque este backend no depende de ese
 * paquete.
 */

export const MODULE_IDS = [
  'clients',
  'memberships',
  'payments',
  'trainers',
  'expenses',
  'inventory',
  'finances',
  'dailyLog',
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

/** Lo que recibe cada gimnasio: un valor por clave, ya resuelto. */
export interface CompanySettings {
  /** RF-21: días que un cliente puede seguir sin pagar antes de quedar en mora. */
  'clients.graceDays': number;
  /** Ventana de "por vencer". */
  'clients.expiringSoonDays': number;
  /** Módulos que el gimnasio puede abrir. Apagar uno también lo cierra en la API. */
  'modules.enabled': ModuleId[];
}

export type SettingKey = keyof CompanySettings;

export interface SettingDefinition<K extends SettingKey = SettingKey> {
  key: K;
  defaultValue: CompanySettings[K];
  /** `null` si sirve; si no, el motivo en español. */
  problem: (value: unknown) => string | null;
}

function wholeDays(min: number, max: number) {
  return (value: unknown): string | null =>
    Number.isInteger(value) && (value as number) >= min && (value as number) <= max
      ? null
      : `Debe ser un número entero de días entre ${min} y ${max}.`;
}

function moduleList(value: unknown): string | null {
  if (!Array.isArray(value)) return 'Debe ser una lista de módulos.';
  const unknownIds = value.filter((id) => !(MODULE_IDS as readonly unknown[]).includes(id));
  return unknownIds.length > 0 ? `Módulos desconocidos: ${unknownIds.join(', ')}.` : null;
}

export const SETTING_DEFINITIONS: { [K in SettingKey]: SettingDefinition<K> } = {
  'clients.graceDays': { key: 'clients.graceDays', defaultValue: 0, problem: wholeDays(0, 30) },
  'clients.expiringSoonDays': {
    key: 'clients.expiringSoonDays',
    defaultValue: 7,
    problem: wholeDays(1, 60),
  },
  'modules.enabled': { key: 'modules.enabled', defaultValue: [...MODULE_IDS], problem: moduleList },
};

export function isSettingKey(value: string): value is SettingKey {
  return Object.hasOwn(SETTING_DEFINITIONS, value);
}
