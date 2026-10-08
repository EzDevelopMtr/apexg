"use client";

import type {
  ClientStatus,
  MembershipType,
  MembershipTypeId,
} from "@apexg/core";
import { assignablePlans, formatCOP, requiresTrainer } from "@apexg/core";
import { Input, Select, type SelectOption } from "@apexg/ui";
import type { UseClientFormResult } from "../hooks/use-client-form";
import ClientTrainerField from "./client-trainer-field";
import { STATUS_LABELS } from "./client-status";

const STATUS_OPTIONS: readonly SelectOption[] = (
  Object.keys(STATUS_LABELS) as ClientStatus[]
).map((status) => ({ value: status, label: STATUS_LABELS[status] }));

type Props = Pick<
  UseClientFormResult,
  | "values"
  | "errors"
  | "setValue"
  | "expirationPreview"
  | "membershipTypes"
  | "trainers"
>;

// Plans come from the real catalogue (RF-13), never hardcoded `<option>`
// markup — the administrator can add or retire one at any time (RF-12).
// The day plan is left out (day passes); a plan already assigned stays.
const planOptions = (
  types: readonly MembershipType[],
  assigned: MembershipTypeId,
): readonly SelectOption[] =>
  assignablePlans(types, assigned || undefined).map((type) => ({
    value: type.id,
    label: `${type.name} — ${formatCOP(type.price)}`,
  }));

/** Plan, status, trainer and the dates derived from them (RF-06, RF-07). */
export default function ClientMembershipFields({
  values,
  errors,
  setValue,
  expirationPreview,
  membershipTypes,
  trainers,
}: Props) {
  const membershipOptions = planOptions(
    membershipTypes.items,
    values.membershipTypeId,
  );

  const selectedType = membershipTypes.items.find(
    (type) => type.id === values.membershipTypeId,
  );
  const needsTrainer = selectedType ? requiresTrainer(selectedType) : false;

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Select
          id="membershipTypeId"
          label="Tipo de membresía"
          value={values.membershipTypeId}
          error={errors.membershipTypeId ?? membershipTypes.error ?? undefined}
          options={membershipOptions}
          placeholder={
            membershipTypes.state === "loading"
              ? "Cargando planes…"
              : "Selecciona un tipo de membresía"
          }
          disabled={membershipTypes.state !== "ready"}
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

      {needsTrainer && (
        <ClientTrainerField
          trainerId={values.trainerId}
          error={errors.trainerId}
          trainers={trainers}
          onChange={(trainerId) => setValue("trainerId", trainerId)}
        />
      )}

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
        />
      </div>

    </>
  );
}
