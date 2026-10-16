"use client";

import { useState } from "react";
import { Eye, HandCoins } from "lucide-react";
import type {
  Client,
  Commission,
  PaymentMethod,
  Trainer,
  TrainerId,
} from "@apexg/core";
import {
  commissionTotal,
  formatCOP,
  latestSettlementWithReceipt,
  unsettledCommissions,
} from "@apexg/core";
import {
  Button,
  Card,
  ReceiptPreview,
  Table,
  TableCell,
  TableEmpty,
  TableRow,
} from "@apexg/ui";
import SettleDialog from "./settle-dialog";

const HEADERS = [
  "Entrenador",
  "Comisiones",
  "Pendiente por pagar",
  "Acción",
] as const;

export interface CommissionPanelProps {
  trainers: readonly Trainer[];
  commissions: readonly Commission[];
  clients: readonly Client[];
  onSettle: (
    trainerId: TrainerId,
    method: PaymentMethod,
    receipt?: Blob,
  ) => Promise<void>;
  receiptUrl: (commission: Commission) => string;
}

interface TrainerCommissionRowProps {
  trainer: Trainer;
  commissions: readonly Commission[];
  onPay: (trainer: Trainer) => void;
  onViewReceipt: (commission: Commission) => void;
}

function TrainerCommissionRow({
  trainer,
  commissions,
  onPay,
  onViewReceipt,
}: TrainerCommissionRowProps) {
  const id = trainer.id as TrainerId;
  const own = commissions.filter((commission) => commission.trainerId === id);
  const pending = unsettledCommissions(commissions, id);
  const lastReceipt = latestSettlementWithReceipt(commissions, id);

  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-body">{trainer.fullName}</p>
        <p className="text-sm text-body-soft">
          {own.length} {own.length === 1 ? "registro" : "registros"}
        </p>
      </TableCell>
      <TableCell>{formatCOP(commissionTotal(own))}</TableCell>
      <TableCell className="font-semibold text-warn-ink">
        {formatCOP(commissionTotal(pending))}
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          {/* Sin pendiente no hay nada que pagar: el botón
              desaparece en vez de quedar apagado. */}
          {pending.length > 0 ? (
            <Button
              size="sm"
              onClick={() => onPay(trainer)}
              aria-label={`Pagar comisiones de ${trainer.fullName}`}
            >
              <HandCoins size={16} />
              Pagar
            </Button>
          ) : (
            <span className="text-sm text-body-faint">Al día</span>
          )}
          {lastReceipt && (
            <button
              type="button"
              onClick={() => onViewReceipt(lastReceipt)}
              aria-label={`Ver comprobante del último pago a ${trainer.fullName}`}
              className="inline-flex items-center gap-1 rounded-md p-1 text-sm text-body-soft hover:text-body"
            >
              <Eye size={16} />
              Comprobante
            </button>
          )}
        </span>
      </TableCell>
    </TableRow>
  );
}

/**
 * What each trainer has earned from personal-training payments (RF-23, §4.4).
 *
 * OPEN QUESTION: RF-22 also records a salary. Whether the commission is on top
 * of it or part of it is unresolved with the client, so both are shown and
 * neither is netted off the other.
 */
export default function CommissionPanel({
  trainers,
  commissions,
  clients,
  onSettle,
  receiptUrl,
}: CommissionPanelProps) {
  // Uno a la vez, y por eso vive aquí y no en la fila.
  const [paying, setPaying] = useState<Trainer | null>(null);
  const [viewing, setViewing] = useState<Commission | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <Table headers={HEADERS}>
          {trainers.length === 0 ? (
            <TableEmpty
              columns={HEADERS.length}
              message="No hay entrenadores registrados."
            />
          ) : (
            trainers.map((trainer) => (
              <TrainerCommissionRow
                key={trainer.id}
                trainer={trainer}
                commissions={commissions}
                onPay={setPaying}
                onViewReceipt={setViewing}
              />
            ))
          )}
        </Table>
      </Card>

      <SettleDialog
        trainer={paying}
        pending={
          paying
            ? unsettledCommissions(commissions, paying.id as TrainerId)
            : []
        }
        clients={clients}
        onClose={() => setPaying(null)}
        onConfirm={(method, receipt) =>
          paying
            ? onSettle(paying.id as TrainerId, method, receipt)
            : Promise.resolve()
        }
      />
      <ReceiptPreview
        receipt={
          viewing
            ? {
                url: receiptUrl(viewing),
                fileName: viewing.settlementReceiptPath,
                subject: "Pago de comisiones",
              }
            : null
        }
        onClose={() => setViewing(null)}
      />
    </>
  );
}
