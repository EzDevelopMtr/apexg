"use client";

import type { MembershipType, TermUnit } from "@apexg/core";
import { Input, Select, Textarea } from "@apexg/ui";
import MembershipPricingFields from "./membership-pricing-fields";

const TERM_UNITS = [
  { value: "month", label: "Meses" },
  { value: "day", label: "Días" },
] as const;

export interface MembershipFieldsProps {
  draft: MembershipType;
  update: <K extends keyof MembershipType>(
    field: K,
    value: MembershipType[K],
  ) => void;
}

/** The plan's editable fields (RF-12). */
export default function MembershipFields({
  draft,
  update,
}: MembershipFieldsProps) {
  return (
    <>
      <Input
        id="name"
        label="Nombre del plan"
        value={draft.name}
        onChange={(event) => update("name", event.target.value)}
        placeholder="Ej. Mensualidad (lunes a sábado)"
      />

      <MembershipPricingFields draft={draft} update={update} />

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="termAmount"
          label="Vigencia"
          type="number"
          min={1}
          value={draft.term.amount}
          onChange={(event) =>
            update("term", {
              ...draft.term,
              amount: Number(event.target.value),
            })
          }
        />
        <Select
          id="termUnit"
          label="Unidad"
          value={draft.term.unit}
          options={TERM_UNITS}
          onChange={(event) =>
            update("term", {
              ...draft.term,
              unit: event.target.value as TermUnit,
            })
          }
        />
      </div>

      <Textarea
        id="conditions"
        label="Condiciones"
        value={draft.conditions}
        onChange={(event) => update("conditions", event.target.value)}
      />
    </>
  );
}
