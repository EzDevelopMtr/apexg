/** El valor general de un ajuste, tal como lo dejó el super admin. */
export interface PlatformValue<T> {
  value: T;
  /** Obligatorio para todos: ignora cualquier excepción. */
  enforced: boolean;
}

/**
 * Qué valor rige para un gimnasio. Orden (023):
 *   1. general obligatorio;  2. excepción del gimnasio;
 *   3. general;              4. defecto del catálogo.
 */
export function resolveSetting<T>(
  defaultValue: T,
  platform: PlatformValue<T> | undefined,
  companyOverride: { value: T } | undefined,
): T {
  if (platform?.enforced) return platform.value;
  if (companyOverride) return companyOverride.value;
  if (platform) return platform.value;
  return defaultValue;
}
