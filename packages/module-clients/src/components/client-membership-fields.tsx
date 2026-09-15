"use client";

import type { ClientStatus, MembershipTypeId } from "@apexg/core";
import { formatCOP, requiresTrainer } from "@apexg/core";
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

/** Plan, status, trainer and the dates derived from them (RF-06, RF-07). */
export default function ClientMembershipFields({
  values,
  errors,
  setValue,
  expirationPreview,
  membershipTypes,
  trainers,
}: Props) {
  // Plans come from the real catalogue (RF-13), never hardcoded `<option>`
  // markup — the administrator can add or retire one at any time (RF-12).
  const membershipOptions: readonly SelectOption[] = membershipTypes.items.map(
    (type) => ({
      value: type.id,
      label: `${type.name} — ${formatCOP(type.price)}`,
    }),
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
          aria-describedby="expiration-hint"
        />
      </div>

      <p id="expiration-hint" className="-mt-2 text-sm text-body-soft">
        El vencimiento se calcula automáticamente según el tipo de membresía.
      </p>
    </>
  );
}
