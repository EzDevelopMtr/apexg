"use client";

import type { Commission, Trainer, TrainerId } from "@apexg/core";
import { commissionTotal, formatCOP, unsettledCommissions } from "@apexg/core";
import { Card, Table, TableCell, TableEmpty, TableRow } from "@apexg/ui";

const HEADERS = ["Entrenador", "Comisiones", "Pendiente por pagar"] as const;

export interface CommissionPanelProps {
  trainers: readonly Trainer[];
  commissions: readonly Commission[];
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
}: CommissionPanelProps) {
  return (
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
              </TableRow>
            );
          })
        )}
      </Table>
    </Card>
  );
}
