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

      {/* Vigencia y cupo responden preguntas distintas: la vigencia es cuánto
          dura el plan, esto es cuántos de esos días puede venir. Vacío no es
          cero, es "sin tope" — por eso el texto de ayuda lo dice, en vez de
          dejar que un campo numérico vacío se lea como ninguno. */}
      <Input
        id="weeklyVisits"
        label="Días por semana"
        type="number"
        min={1}
        max={7}
        value={draft.weeklyVisits ?? ""}
        onChange={(event) =>
          update(
            "weeklyVisits",
            event.target.value === "" ? null : Number(event.target.value),
          )
        }
        placeholder="Sin límite"
        aria-describedby="weeklyVisits-hint"
      />
      <p id="weeklyVisits-hint" className="-mt-3 text-sm text-body-soft">
        Déjalo vacío si el plan no limita los días. Ej. 3 para un plan de tres
        veces por semana, 6 para uno de lunes a sábado.
      </p>

      <Textarea
        id="conditions"
        label="Condiciones"
        value={draft.conditions}
        onChange={(event) => update("conditions", event.target.value)}
      />
    </>
  );
}
