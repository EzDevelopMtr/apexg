"use client";

import { useState } from "react";
import type { Client, Commission, Trainer } from "@apexg/core";
import { commissionTotal, formatCOP } from "@apexg/core";
import { Button, Modal } from "@apexg/ui";

export interface SettleDialogProps {
  /** Null mientras no se está liquidando a nadie. */
  trainer: Trainer | null;
  pending: readonly Commission[];
  clients: readonly Client[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * Lo que se va a marcar como pagado, antes de marcarlo.
 *
 * Una liquidación no se deshace (RNF-07), así que se muestra de qué pagos
 * sale cada peso: la recepcionista confirma contra lo que le va a entregar
 * al entrenador, no contra un total suelto.
 */
export default function SettleDialog({
  trainer,
  pending,
  clients,
  onClose,
  onConfirm,
}: SettleDialogProps) {
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const nameOf = (commission: Commission) =>
    clients.find((client) => client.id === commission.clientId)?.fullName ??
    "Cliente";

  const confirm = async () => {
    setSaving(true);
    setFailure(null);
    try {
      await onConfirm();
      onClose();
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "No se pudo registrar el pago.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={trainer !== null}
      title="Pagar comisiones"
      description={trainer?.fullName}
      onClose={onClose}
    >
      <ul className="divide-y divide-line-soft rounded-xl border border-line">
        {pending.map((commission) => (
          <li
            key={commission.id}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="text-body">
              {nameOf(commission)}
              <span className="text-body-soft"> · {commission.earnedOn}</span>
            </span>
            <span className="font-semibold text-body">
              {formatCOP(commission.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-body-soft">Total a entregar</span>
        <span className="text-xl font-bold text-body">
          {formatCOP(commissionTotal(pending))}
        </span>
      </div>

      <p className="mt-2 text-sm text-body-soft">
        Queda registrado como pagado y no se puede deshacer.
      </p>

      {failure && (
        <p role="alert" className="mt-3 text-sm text-danger-ink">
          {failure}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={confirm} disabled={saving}>
          {saving ? "Registrando..." : "Confirmar pago"}
        </Button>
      </div>
    </Modal>
  );
}
