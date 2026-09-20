import type { membershipTypes } from "../database/schema/schema.js";

import type { UpdateMembershipTypeDto } from "./update-membership-type.dto.js";
import type {
  MembershipTypeResult,
  MembershipTypeState,
} from "./membership-types.types.js";

type MembershipTypeRow = typeof membershipTypes.$inferSelect;

/** Devuelve el valor del patch solo si vino; si no, el que ya estaba. */
function patched<T>(value: T | undefined, current: T): T {
  return value !== undefined ? value : current;
}

/**
 * Fusiona el patch sobre la fila existente; los campos ausentes no cambian.
 *
 * Compara contra `undefined` y no con `??` a propósito: un `null` explícito
 * significa "quitar este valor" —el tope semanal, el abono mínimo—, y `??`
 * devolvería el valor viejo justo cuando se pide borrarlo.
 */
export function mergePatch(
  existing: MembershipTypeRow,
  patch: UpdateMembershipTypeDto,
): MembershipTypeRow {
  return {
    ...existing,
    name: patched(patch.name, existing.name),
    price: patched(patch.price, existing.price),
    description: patched(patch.description, existing.description),
    durationValue: patched(patch.durationValue, existing.durationValue),
    durationUnit: patched(patch.durationUnit, existing.durationUnit),
    minimumPayment: patched(patch.minimumPayment, existing.minimumPayment),
    trainerShare: patched(patch.trainerShare, existing.trainerShare),
    businessShare: patched(patch.businessShare, existing.businessShare),
    allowsPartialPayment: patched(
      patch.allowsPartialPayment,
      existing.allowsPartialPayment,
    ),
    isPromotional: patched(patch.isPromotional, existing.isPromotional),
    weeklyVisits: patched(patch.weeklyVisits, existing.weeklyVisits),
    state: patched(patch.state, existing.state),
  };
}

/** La fila tal como la expone la API. */
export function toResult(row: MembershipTypeRow): MembershipTypeResult {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    durationValue: row.durationValue,
    durationUnit: row.durationUnit as MembershipTypeResult["durationUnit"],
    minimumPayment: row.minimumPayment,
    trainerShare: row.trainerShare,
    businessShare: row.businessShare,
    allowsPartialPayment: row.allowsPartialPayment,
    isPromotional: row.isPromotional,
    weeklyVisits: row.weeklyVisits,
    state: row.state as MembershipTypeState,
  };
}
