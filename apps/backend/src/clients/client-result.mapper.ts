import { clients } from "../database/schema/schema.js";
import type { UpdateClientDto } from "./update-client.dto.js";

import type {
  ClientMembershipSummary,
  ClientResult,
  ClientState,
} from "./clients.types.js";

type ClientRow = typeof clients.$inferSelect;

/** La fila del cliente más su membresía vigente, tal como la expone la API. */
export function toClientResult(
  row: ClientRow,
  membership: ClientMembershipSummary | null,
  registeredBy: string,
): ClientResult {
  return {
    id: row.id,
    documentNumber: row.documentNumber,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    bloodType: row.bloodType,
    birthDate: row.birthDate,
    medicalCondition: row.medicalCondition,
    hasPhoto: row.photoPath !== null,
    state: row.state as ClientState,
    registeredAt: row.registeredAt,
    registeredBy,
    retiredAt: row.retiredAt,
    currentMembership: membership,
  };
}

/**
 * Los campos de identidad que un PATCH puede cambiar, solo los que vinieron.
 *
 * No incluye el plan ni las fechas: cambiar de membresía abre una nueva (ver
 * `ClientRenewalService`), no reescribe la vigente.
 */
export function toClientPatch(
  input: UpdateClientDto,
): Partial<typeof clients.$inferInsert> {
  const fields = [
    "fullName",
    "phone",
    "email",
    "emergencyContactName",
    "emergencyContactPhone",
    "bloodType",
    "medicalCondition",
  ] as const;

  const patch: Partial<typeof clients.$inferInsert> = {};
  for (const field of fields) {
    const value = input[field];
    if (value !== undefined) patch[field] = value;
  }
  return patch;
}
