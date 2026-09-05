"use client";

import type { Client, Trainer, TrainerId } from "@apexg/core";
import { assignedClientCount } from "@apexg/core";
import { Card, Table, TableEmpty } from "@apexg/ui";
import TrainerRow from "./trainer-row";

const HEADERS = [
  "Entrenador",
  "Teléfono",
  "Contratación",
  "Sueldo",
  "Clientes",
  "Disponibilidad",
  "Acción",
] as const;

export interface TrainerListProps {
  trainers: readonly Trainer[];
  clients: readonly Client[];
  onEdit: (trainer: Trainer) => void;
}

export default function TrainerList({
  trainers,
  clients,
  onEdit,
}: TrainerListProps) {
  return (
    <Card className="overflow-hidden">
      <Table headers={HEADERS}>
        {trainers.length === 0 ? (
          <TableEmpty
            columns={HEADERS.length}
            message="No hay entrenadores que mostrar."
          />
        ) : (
          trainers.map((trainer) => (
            <TrainerRow
              key={trainer.id}
              trainer={trainer}
              assigned={assignedClientCount(clients, trainer.id as TrainerId)}
              onEdit={onEdit}
            />
          ))
        )}
      </Table>
    </Card>
  );
}
