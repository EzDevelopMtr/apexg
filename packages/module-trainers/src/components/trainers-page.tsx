"use client";

import { useState } from "react";
import type { Trainer, TrainerSectionId } from "@apexg/core";
import { today, trainerSections } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Modal } from "@apexg/ui";
import { useVisibleTrainers } from "../hooks/use-available-trainers";
import {
  useAssignedClients,
  useCommissions,
  useTrainers,
} from "../hooks/use-trainers";
import CommissionPanel from "./commission-panel";
import TrainerForm from "./trainer-form";
import TrainerList from "./trainer-list";

export interface TrainersPageProps {
  sectionId: TrainerSectionId;
  onNavigate: (sectionId: string) => void;
}

/**
 * Entry point of the Trainers module (RF-22 to RF-25).
 *
 * Dispatches on the section's view kind rather than comparing URL strings.
 * Adding a trainer opens as a dialog over the list, like editing one.
 */
export default function TrainersPage({
  sectionId,
  onNavigate,
}: TrainersPageProps) {
  const requested = trainerSections.getSection(sectionId);
  const section = trainerSections.sectionBehind(sectionId);
  const close = () => onNavigate(section.id);
  const trainers = useTrainers();
  const clients = useAssignedClients();
  const commissions = useCommissions();
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [referenceDate] = useState(today);

  const visible = useVisibleTrainers(
    trainers.items,
    clients.items,
    section,
    referenceDate,
  );

  if (section.view.kind === "panel") {
    return (
      <CollectionGate
        collection={commissions}
        loadingMessage="Cargando comisiones..."
        errorMessage="No pudimos cargar las comisiones."
      >
        <CommissionPanel
          trainers={trainers.items}
          commissions={commissions.items}
          clients={clients.items}
          onSettle={commissions.settleAll}
          receiptUrl={commissions.receiptUrl}
        />
      </CollectionGate>
    );
  }

  return (
    <CollectionGate
      collection={trainers}
      loadingMessage="Cargando entrenadores..."
      errorMessage="No pudimos cargar los entrenadores."
    >
      <TrainerList
        trainers={visible}
        clients={clients.items}
        onEdit={setEditing}
      />

      <Modal open={requested.view.kind === "form"} title={requested.title} onClose={close}>
        <TrainerForm
          onSave={async (draft) => {
            await trainers.save(draft);
            close();
          }}
          onCancel={close}
        />
      </Modal>

      <Modal
        open={editing !== null}
        title="Editar entrenador"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <TrainerForm
            trainer={editing}
            onSave={async (draft, existing) => {
              await trainers.save(draft, existing);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </CollectionGate>
  );
}
