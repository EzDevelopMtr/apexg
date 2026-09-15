"use client";

import type { IsoDate } from "@apexg/core";
import { fromPesos, toPesos } from "@apexg/core";
import { Input, Textarea } from "@apexg/ui";
import type { TrainerDraft } from "./trainer-draft";

export interface TrainerFieldsProps {
  draft: TrainerDraft;
  update: <K extends keyof TrainerDraft>(
    field: K,
    value: TrainerDraft[K],
  ) => void;
}

/** A trainer's editable fields (RF-22). */
export default function TrainerFields({ draft, update }: TrainerFieldsProps) {
  return (
    <>
      <Input
        id="fullName"
        label="Nombre completo"
        value={draft.fullName}
        onChange={(event) => update("fullName", event.target.value)}
        placeholder="Ej. Andrés Quintero"
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="idNumber"
          label="Documento"
          value={draft.idNumber}
          onChange={(event) => update("idNumber", event.target.value)}
        />
        <Input
          id="phone"
          label="Teléfono"
          type="tel"
          value={draft.phone}
          onChange={(event) => update("phone", event.target.value)}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Input
          id="hiredOn"
          label="Fecha de contratación"
          type="date"
          value={draft.hiredOn}
          onChange={(event) => update("hiredOn", event.target.value as IsoDate)}
        />
        <Input
          id="salary"
          label="Sueldo (COP)"
          type="number"
          min={0}
          step={50000}
          value={toPesos(draft.salary)}
          onChange={(event) =>
            update("salary", fromPesos(Number(event.target.value)))
          }
        />
        <Input
          id="maxClients"
          label="Cupo máximo"
          type="number"
          min={1}
          value={draft.maxClients}
          onChange={(event) => update("maxClients", Number(event.target.value))}
        />
      </div>

      <Textarea
        id="certifications"
        label="Certificados"
        value={draft.certifications}
        onChange={(event) => update("certifications", event.target.value)}
        placeholder="N/A si no aplica"
      />
    </>
  );
}
