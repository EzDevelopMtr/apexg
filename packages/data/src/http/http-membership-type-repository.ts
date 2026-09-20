import type { MembershipType, MembershipTypeId, TermUnit } from "@apexg/core";
import { fromApiString, toApiString, toMembershipTypeId } from "@apexg/core";
import type { MembershipTypeRepository } from "../repositories";
import { ApiError, apiFetch } from "./http-client";

type ApiDurationUnit = "day" | "week" | "month";

interface MembershipTypeApiResult {
  id: string;
  name: string;
  price: string;
  description: string | null;
  durationValue: number;
  durationUnit: ApiDurationUnit;
  minimumPayment: string | null;
  trainerShare: string | null;
  businessShare: string | null;
  allowsPartialPayment: boolean;
  weeklyVisits: number | null;
  isPromotional: boolean;
  state: 1 | 2;
}

/**
 * The backend allows `"week"` as a duration unit; `TermUnit` only knows
 * `"day"`/`"month"` — SRS §4.1 never names a week as its own unit (the seed
 * "Semana" plan is 7 *days*). A week is exactly 7 days, so this converts
 * instead of failing on a unit the catalogue does not otherwise use.
 */
function toTerm(
  durationValue: number,
  durationUnit: ApiDurationUnit,
): { unit: TermUnit; amount: number } {
  if (durationUnit === "week") {
    return { unit: "day", amount: durationValue * 7 };
  }
  return { unit: durationUnit, amount: durationValue };
}

function fromResult(row: MembershipTypeApiResult): MembershipType {
  const hasSplit = row.trainerShare !== null && row.businessShare !== null;
  return {
    id: toMembershipTypeId(row.id),
    name: row.name,
    price: fromApiString(row.price),
    term: toTerm(row.durationValue, row.durationUnit),
    minimumInstallment:
      row.minimumPayment === null ? null : fromApiString(row.minimumPayment),
    isPromotional: row.isPromotional,
    weeklyVisits: row.weeklyVisits ?? null,
    trainerSplit: hasSplit
      ? {
          trainer: fromApiString(row.trainerShare as string),
          business: fromApiString(row.businessShare as string),
        }
      : null,
    // "conditions" and the backend's "description" are the same free-text
    // field under two names — see @apexg/core's own comment on the seed
    // catalogue vs. the real, editable one.
    conditions: row.description ?? "",
  };
}

/**
 * `allowsPartialPayment` is derived from whether a minimum installment is
 * set — the frontend tracks only one concept (SRS §4.3), the backend two
 * related fields. The backend rejects a promotional plan that also allows
 * partial payment (SRS §4.1) — that rejection is left to surface as-is
 * rather than second-guessed here.
 */
function toRequestBody(type: MembershipType): Record<string, unknown> {
  return {
    name: type.name,
    price: toApiString(type.price),
    description: type.conditions || null,
    durationValue: type.term.amount,
    durationUnit: type.term.unit,
    minimumPayment:
      type.minimumInstallment === null
        ? null
        : toApiString(type.minimumInstallment),
    trainerShare:
      type.trainerSplit === null
        ? null
        : toApiString(type.trainerSplit.trainer),
    businessShare:
      type.trainerSplit === null
        ? null
        : toApiString(type.trainerSplit.business),
    allowsPartialPayment: type.minimumInstallment !== null,
    isPromotional: type.isPromotional,
    weeklyVisits: type.weeklyVisits,
  };
}

/** `emptyMembershipType()` (RF-12 "create" flow) sets this empty id. */
const NEW_TYPE_ID = "";

export class HttpMembershipTypeRepository implements MembershipTypeRepository {
  async list(): Promise<readonly MembershipType[]> {
    // Active only: a plan the administrator deactivated (the alternative to
    // deleting one that already has clients — see the backend's own 409
    // message) must not come back as a selectable option. `MembershipType`
    // has no `state` field at all, so this is the only place to draw the line.
    const rows = await apiFetch<MembershipTypeApiResult[]>(
      "/membership-types",
      {
        searchParams: { state: "1" },
      },
    );
    return rows.map(fromResult);
  }

  async findById(id: MembershipTypeId): Promise<MembershipType | undefined> {
    try {
      const row = await apiFetch<MembershipTypeApiResult>(
        `/membership-types/${id}`,
      );
      return fromResult(row);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  async save(type: MembershipType): Promise<MembershipType> {
    const body = toRequestBody(type);
    const row =
      type.id === NEW_TYPE_ID
        ? await apiFetch<MembershipTypeApiResult>("/membership-types", {
            method: "POST",
            body,
          })
        : await apiFetch<MembershipTypeApiResult>(
            `/membership-types/${type.id}`,
            {
              method: "PATCH",
              body,
            },
          );
    return fromResult(row);
  }

  async remove(id: MembershipTypeId): Promise<void> {
    await apiFetch<void>(`/membership-types/${id}`, { method: "DELETE" });
  }
}
