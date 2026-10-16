"use client";

import type {
  Client,
  Commission,
  CommissionSettlementProblem,
  PaymentMethod,
  Trainer,
} from "@apexg/core";
import {
  PAYMENT_METHOD_LABELS,
  commissionTotal,
  formatCOP,
  requiresReceipt,
} from "@apexg/core";
import { Button, FileInput, Modal, Select } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import { useSettlement } from "../hooks/use-settlement";
import type { UseSettlementResult } from "../hooks/use-settlement";

const METHOD_OPTIONS: readonly SelectOption[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

const PROBLEM_TEXT: Record<CommissionSettlementProblem, string> = {
  nothingToSettle: "No hay comisiones pendientes por pagar.",
  receiptRequired: "Adjunta la foto del comprobante de la transferencia.",
};

export interface SettleDialogProps {
  /** Null mientras no se está liquidando a nadie. */
  trainer: Trainer | null;
  pending: readonly Commission[];
  clients: readonly Client[];
  onClose: () => void;
  onConfirm: (method: PaymentMethod, receipt?: Blob) => Promise<void>;
}

function PayoutFields({ settlement }: { settlement: UseSettlementResult }) {
  const { method, receipt, problems } = settlement;
  return (
    <div className="mt-4 space-y-4">
      <Select
        id="settlementMethod"
        label="Forma de pago"
        options={METHOD_OPTIONS}
        value={method}
        onChange={(event) =>
          settlement.setMethod(event.target.value as PaymentMethod)
        }
      />
      {requiresReceipt(method) && (
        <FileInput
          id="settlementReceipt"
          label="Comprobante"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          file={receipt}
          onChange={settlement.setReceipt}
          error={
            problems.includes("receiptRequired")
              ? PROBLEM_TEXT.receiptRequired
              : undefined
          }
        />
      )}
      {problems.includes("nothingToSettle") && (
        <p role="alert" className="text-sm text-danger-ink">
          {PROBLEM_TEXT.nothingToSettle}
        </p>
      )}
    </div>
  );
}

function PendingList({
  pending,
  clients,
}: Pick<SettleDialogProps, "pending" | "clients">) {
  const nameOf = (commission: Commission) =>
    clients.find((client) => client.id === commission.clientId)?.fullName ??
    "Cliente";
  return (
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
  );
}

/**
 * Lo que se va a marcar como pagado, antes de marcarlo.
 *
 * Una liquidación no se deshace (RNF-07), así que se muestra de qué pagos
 * sale cada peso: la recepcionista confirma contra lo que le va a entregar
 * al entrenador, no contra un total suelto. Una transferencia exige su
 * comprobante, igual que un cobro.
 */
export default function SettleDialog({
  trainer,
  pending,
  clients,
  onClose,
  onConfirm,
}: SettleDialogProps) {
  const settlement = useSettlement(pending, onConfirm);

  const close = () => {
    settlement.reset();
    onClose();
  };

  return (
    <Modal
      open={trainer !== null}
      title="Pagar comisiones"
      description={trainer?.fullName}
      onClose={close}
    >
      <PendingList pending={pending} clients={clients} />

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-body-soft">Total a entregar</span>
        <span className="text-xl font-bold text-body">
          {formatCOP(commissionTotal(pending))}
        </span>
      </div>

      <PayoutFields settlement={settlement} />

      <p className="mt-2 text-sm text-body-soft">
        Queda registrado como pagado y no se puede deshacer.
      </p>

      {settlement.failure && (
        <p role="alert" className="mt-3 text-sm text-danger-ink">
          {settlement.failure}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={close} disabled={settlement.saving}>
          Cancelar
        </Button>
        <Button
          onClick={async () => {
            if (await settlement.confirm()) onClose();
          }}
          disabled={settlement.saving}
        >
          {settlement.saving ? "Registrando..." : "Confirmar pago"}
        </Button>
      </div>
    </Modal>
  );
}
