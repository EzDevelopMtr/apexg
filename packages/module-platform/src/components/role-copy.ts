import { ROLE_LABELS } from "@apexg/core";

/**
 * What each profile can do, in the words of the module matrix (SRS §2.2,
 * core/domain/permissions.ts). A profile created later without a line here
 * still shows, with a neutral description.
 */
export function roleHelp(roleName: string): string {
  if (roleName === ROLE_LABELS.admin) {
    return "Todos los módulos: planes, entrenadores, egresos, inventario y finanzas.";
  }
  if (roleName === ROLE_LABELS.receptionist) {
    return "Clientes, pagos, apartado diario e ingreso. No ve finanzas, egresos ni inventario.";
  }
  return "Perfil propio de este gimnasio.";
}

export const isAdminRole = (roleName: string): boolean => roleName === ROLE_LABELS.admin;
