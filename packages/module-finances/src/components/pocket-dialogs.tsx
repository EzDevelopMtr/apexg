"use client";

import { useState } from "react";
import type { Money } from "@apexg/core";
import { fromPesos } from "@apexg/core";
import { Button, Input, Modal } from "@apexg/ui";

export interface NewPocketDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, goal: Money) => Promise<void>;
}

/** Crear un bolsillo: a qué se destina y cuánto necesita. */
export function NewPocketDialog({
  open,
  onClose,
  onCreate,
}: NewPocketDialogProps) {
  const [name, setName] = useState("");
  const [goalPesos, setGoalPesos] = useState("");

  const close = () => {
    setName("");
    setGoalPesos("");
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Nuevo bolsillo"
      description="¿Para qué estás ahorrando y cuánto necesitas?"
      onClose={close}
    >
      <div className="space-y-4">
        <Input
          id="pocketName"
          label="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Máquina de remo"
        />
        <Input
          id="pocketGoal"
          label="Meta (COP)"
          type="number"
          min={0}
          step={10000}
          value={goalPesos}
          onChange={(event) => setGoalPesos(event.target.value)}
          placeholder="0"
        />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button
            disabled={!name.trim() || !goalPesos}
            onClick={async () => {
              await onCreate(name.trim(), fromPesos(Number(goalPesos)));
              close();
            }}
          >
            Crear bolsillo
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export interface ContributeDialogProps {
  open: boolean;
  pocketName: string;
  /** Motivo del rechazo del dominio, o null. */
  refusal: string | null;
  onClose: () => void;
  /** `false` si fue rechazado: el diálogo entonces no se cierra. */
  onContribute: (amount: Money, notes: string) => Promise<boolean>;
}

/** Abonar a un bolsillo. */
export function ContributeDialog({
  open,
  pocketName,
  refusal,
  onClose,
  onContribute,
}: ContributeDialogProps) {
  const [amountPesos, setAmountPesos] = useState("");
  const [notes, setNotes] = useState("");

  const close = () => {
    setAmountPesos("");
    setNotes("");
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Abonar al bolsillo"
      description={pocketName}
      onClose={close}
    >
      <div className="space-y-4">
        <Input
          id="contributionAmount"
          label="Monto (COP)"
          type="number"
          min={0}
          step={10000}
          value={amountPesos}
          onChange={(event) => setAmountPesos(event.target.value)}
          placeholder="0"
        />
        <Input
          id="contributionNotes"
          label="Nota (opcional)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ej. Excedente de la semana"
        />

        {refusal && (
          <p role="alert" className="text-sm text-danger-ink">
            {refusal}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button
            disabled={!amountPesos}
            onClick={async () => {
              const ok = await onContribute(
                fromPesos(Number(amountPesos)),
                notes.trim(),
              );
              // Rechazado: el diálogo se queda abierto con el motivo a la
              // vista, en vez de cerrarse como si hubiera funcionado.
              if (ok) close();
            }}
          >
            Abonar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
