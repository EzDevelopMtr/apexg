"use client";

import type { MembershipType, TermUnit } from "@apexg/core";
import { Input, Select, Textarea } from "@apexg/ui";
import MembershipPricingFields from "./membership-pricing-fields";

const TERM_UNITS = [
  { value: "month", label: "Meses" },
  { value: "day", label: "Días" },
] as const;

/**
 * Hasta 6, no 7: el gimnasio no abre los domingos, así que una semana completa
 * son seis días de acceso y un séptimo no significaría nada.
 *
 * Sin opción de "sin límite": quien crea un plan no distingue a simple vista
 * entre "no tiene tope" y "todavía no lo he puesto", y ese vacío era justo el
 * estado que dejaba entrar los siete días. Seis es el acceso completo, así que
 * no se pierde nada al exigir siempre un número.
 */
const WEEKLY_VISITS = Array.from({ length: 6 }, (_, index) => ({
  value: String(index + 1),
  label: index === 0 ? "1 día por semana" : `${index + 1} días por semana`,
}));

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
          dura el plan, esto es cuántos de esos días puede venir.

          Una lista y no un campo numérico: así no existe la entrada inválida.
          Un número libre admitía 0, 30 o letras, y cada uno habría necesitado
          su propio mensaje de error. */}
      {/* Un plan viejo sin tope se muestra como 6 — acceso completo, que es lo
          que de hecho tenía. La migración 012 ya los movió; esto cubre una
          fila escrita fuera de la app. */}
      <Select
        id="weeklyVisits"
        label="Días por semana"
        value={String(draft.weeklyVisits ?? 6)}
        options={WEEKLY_VISITS}
        onChange={(event) => update("weeklyVisits", Number(event.target.value))}
      />

      <Textarea
        id="conditions"
        label="Condiciones"
        value={draft.conditions}
        onChange={(event) => update("conditions", event.target.value)}
      />
    </>
  );
}
