"use client";

import type { ClientStatus, MembershipTypeId } from "@apexg/core";
import { DEFAULT_MEMBERSHIP_TYPES, formatCOP } from "@apexg/core";
import { Input, Select, type SelectOption } from "@apexg/ui";
import type { UseClientFormResult } from "../hooks/use-client-form";
import { STATUS_LABELS } from "./client-status";

/**
 * Plans come from the catalogue in `@apexg/core` (RF-13), never from hardcoded
 * `<option>` markup — the administrator will be able to edit them (RF-12).
 */
const MEMBERSHIP_OPTIONS: readonly SelectOption[] =
  DEFAULT_MEMBERSHIP_TYPES.map((type) => ({
    value: type.id,
    label: `${type.name} — ${formatCOP(type.price)}`,
  }));

const STATUS_OPTIONS: readonly SelectOption[] = (
  Object.keys(STATUS_LABELS) as ClientStatus[]
).map((status) => ({ value: status, label: STATUS_LABELS[status] }));

type Props = Pick<
  UseClientFormResult,
  "values" | "errors" | "setValue" | "expirationPreview"
>;

/** Plan, status and the dates derived from them (RF-06, RF-07). */
export default function ClientMembershipFields({
  values,
  errors,
  setValue,
  expirationPreview,
}: Props) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Select
          id="membershipTypeId"
          label="Tipo de membresía"
          value={values.membershipTypeId}
          error={errors.membershipTypeId}
          options={MEMBERSHIP_OPTIONS}
          onChange={(event) =>
            setValue("membershipTypeId", event.target.value as MembershipTypeId)
          }
        />
        <Select
          id="status"
          label="Estado"
          value={values.status}
          error={errors.status}
          options={STATUS_OPTIONS}
          onChange={(event) =>
            setValue("status", event.target.value as ClientStatus)
          }
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="startDate"
          label="Fecha de inicio"
          type="date"
          value={values.startDate}
          error={errors.startDate}
          onChange={(event) => setValue("startDate", event.target.value)}
        />
        <Input
          id="expirationDate"
          label="Fecha de vencimiento"
          value={expirationPreview ?? "—"}
          readOnly
          disabled
          // RF-07: derived from the start date and the plan's term, so it is
          // shown rather than typed. The old form let staff enter any date.
          aria-describedby="expiration-hint"
        />
      </div>

      <p id="expiration-hint" className="-mt-2 text-sm text-body-soft">
        El vencimiento se calcula automáticamente según el tipo de membresía.
      </p>
    </>
  );
}
