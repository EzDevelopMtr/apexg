"use client";

import type { Trainer, TrainerId } from "@apexg/core";
import type { Collection } from "@apexg/module-kit";
import { Select, type SelectOption } from "@apexg/ui";

export interface ClientTrainerFieldProps {
  trainerId: TrainerId | "";
  error?: string;
  trainers: Collection<Trainer>;
  onChange: (trainerId: TrainerId) => void;
}

/** RF-24: trainer picker, shown only for the plans that require one. */
export default function ClientTrainerField({
  trainerId,
  error,
  trainers,
  onChange,
}: ClientTrainerFieldProps) {
  // RF-25: a trainer no longer on staff cannot take a new client.
  const options: readonly SelectOption[] = trainers.items
    .filter((trainer) => trainer.active)
    .map((trainer) => ({ value: trainer.id, label: trainer.fullName }));

  return (
    <Select
      id="trainerId"
      label="Entrenador"
      value={trainerId}
      error={error ?? trainers.error ?? undefined}
      options={options}
      placeholder={
        trainers.state === "loading"
          ? "Cargando entrenadores…"
          : "Selecciona un entrenador"
      }
      disabled={trainers.state !== "ready"}
      onChange={(event) => onChange(event.target.value as TrainerId)}
    />
  );
}
