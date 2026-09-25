/** Tipos del módulo Asistencias (control de ingreso al gimnasio). */

export interface AttendanceResult {
  id: string;
  clientId: string;
  clientName: string;
  /** Instante del ingreso, TIMESTAMPTZ en ISO. */
  checkIn: string;
  /** Presente solo cuando ya se registró la salida. */
  checkOut: string | null;
  /** Nombre del plan vigente del cliente, para mostrarlo en la lista. */
  membershipName: string | null;
  /** Cupo semanal del plan, o null si no tiene tope. */
  weeklyVisits: number;
  /** Visitas consumidas en la semana de ESTE ingreso, incluyéndolo. */
  usedThisWeek: number;
  /** Quién lo registró, para el rastro de RNF-07. "—" si es anterior. */
  recordedBy: string;
}

/** Un cliente tal como lo devuelve la búsqueda del panel de ingreso. */
export interface AttendanceCandidate {
  clientId: string;
  clientName: string;
  idNumber: string;
  /** Estado del cliente, o null si no tiene membresía. */
  status: "active" | "inactive" | "overdue" | null;
  membershipName: string | null;
  expirationDate: string | null;
  /** Si tiene foto. El archivo lo sirve `GET /clients/:id/photo`. */
  hasPhoto: boolean;
  weeklyVisits: number;
  usedThisWeek: number;
  /** True cuando ya está dentro y no ha marcado salida. */
  inside: boolean;
}
