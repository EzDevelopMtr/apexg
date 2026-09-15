/**
 * Tipos de la capa de Clientes (RF-04 a RF-08).
 *
 * `agreedPrice` viaja como `string`: PostgreSQL `NUMERIC` se mantiene como
 * string (ver CLAUDE.md, sección NUMERIC) — nunca se convierte a `Number`
 * aquí ni en ninguna capa intermedia.
 */

/** Snapshot de la membresía vigente de un cliente, para la respuesta HTTP. */
export interface ClientMembershipSummary {
  id: string;
  membershipTypeId: string;
  membershipTypeName: string;
  trainerId: string | null;
  startDate: string;
  endDate: string;
  agreedPrice: string;
}

/**
 * Estado de un cliente (schema.dbml, tabla `clients`):
 * 1 = activo · 2 = inactivo · 3 = en mora.
 *
 * A diferencia del frontend (`@apexg/core`), donde "en mora" es puramente
 * derivado y nunca se persiste, este esquema SÍ lo guarda como valor de
 * `state` — hay un índice `(company_id, state)` pensado para filtrar por
 * él. `ClientsService.syncOverdueClients` mantiene esa columna al día en
 * cada lectura, en vez de depender de un job programado que no existe
 * todavía en este backend.
 */
export type ClientState = 1 | 2 | 3;

export interface ClientResult {
  id: string;
  documentNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  bloodType: string | null;
  birthDate: string | null;
  medicalCondition: string | null;
  comments: string | null;
  state: ClientState;
  registeredAt: string;
  retiredAt: string | null;
  currentMembership: ClientMembershipSummary | null;
}

/** Filtros de `GET /clients`. */
export interface ListClientsFilter {
  state?: ClientState;
  /** Solo clientes activos cuya membresía vence dentro de N días. */
  expiringWithinDays?: number;
}
