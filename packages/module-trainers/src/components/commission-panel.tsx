"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import type { Client, Commission, Trainer, TrainerId } from "@apexg/core";
import { commissionTotal, formatCOP, unsettledCommissions } from "@apexg/core";
import { Button, Card, Table, TableCell, TableEmpty, TableRow } from "@apexg/ui";
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
  onSettle: (trainerId: TrainerId) => Promise<void>;
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
}: CommissionPanelProps) {
  // Uno a la vez, y por eso vive aquí y no en la fila.
  const [paying, setPaying] = useState<Trainer | null>(null);

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
            trainers.map((trainer) => {
              const own = commissions.filter(
                (commission) => commission.trainerId === trainer.id,
              );
              const pending = unsettledCommissions(
                commissions,
                trainer.id as TrainerId,
              );

              return (
                <TableRow key={trainer.id}>
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
                    {/* Sin pendiente no hay nada que pagar: el botón
                        desaparece en vez de quedar apagado. */}
                    {pending.length > 0 ? (
                      <Button
                        size="sm"
                        onClick={() => setPaying(trainer)}
                        aria-label={`Pagar comisiones de ${trainer.fullName}`}
                      >
                        <HandCoins size={16} />
                        Pagar
                      </Button>
                    ) : (
                      <span className="text-sm text-body-faint">Al día</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </Table>
      </Card>

      <SettleDialog
        trainer={paying}
        pending={
          paying ? unsettledCommissions(commissions, paying.id as TrainerId) : []
        }
        clients={clients}
        onClose={() => setPaying(null)}
        onConfirm={() =>
          paying ? onSettle(paying.id as TrainerId) : Promise.resolve()
        }
      />
    </>
  );
}
