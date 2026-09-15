/** Tipos del módulo Entrenadores (RF-22 a RF-25). */

export type TrainerState = 1 | 2;

/**
 * Proyección para quien SOLO tiene `entrenadores.read` (la Recepcionista).
 *
 * El seed de permisos lo dice explícitamente: "el backend debe limitar el
 * selector a id / full_name / state / max_clients y NO exponer salary ni
 * datos administrativos" (documento, teléfono, fecha de contratación
 * tampoco están en esa lista, así que también se excluyen aquí).
 */
export interface TrainerPickerResult {
  id: string;
  fullName: string;
  state: TrainerState;
  maxClients: number | null;
  /** RF-25: cupos ya ocupados, para poder juzgar disponibilidad. */
  assignedClientCount: number;
}

/** Proyección completa — solo para quien tiene `entrenadores.update` (Administrador). */
export interface TrainerResult extends TrainerPickerResult {
  documentNumber: string;
  phone: string | null;
  hiredAt: string | null;
  salary: string | null;
  /** RF-22: certificados del entrenador, texto libre. `null` si no aplica. */
  certifications: string | null;
}

export interface ListTrainersFilter {
  state?: TrainerState;
}

/** RF-23: una fila de comisión, con el cliente que la originó como evidencia. */
export interface CommissionRecord {
  id: string;
  clientMembershipId: string;
  clientId: string;
  clientFullName: string;
  paymentId: string;
  trainerAmount: string;
  businessAmount: string;
  commissionDate: string;
  /** true una vez que el gimnasio le pagó la comisión al entrenador. */
  settled: boolean;
  settledAt: string | null;
}
