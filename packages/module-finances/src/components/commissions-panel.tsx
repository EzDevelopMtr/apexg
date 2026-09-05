"use client";

import { useCallback } from "react";
import type { Commission, Trainer } from "@apexg/core";
import { commissionTotal, formatCOP, unsettledCommissions } from "@apexg/core";
import { useCollection, useRepositories } from "@apexg/module-kit";
import { Card, Table, TableCell, TableEmpty, TableRow } from "@apexg/ui";
import type { TrainerId } from "@apexg/core";

const HEADERS = ["Entrenador", "Total generado", "Pendiente"] as const;

/** Trainer commissions, from the finance side (RF-23, §4.4). */
export default function CommissionsPanel() {
  const { trainers } = useRepositories();

  const loadTrainers = useCallback(() => trainers.list(), [trainers]);
  const loadCommissions = useCallback(
    () => trainers.listCommissions(),
    [trainers],
  );

  const trainerList = useCollection<Trainer>(loadTrainers);
  const commissionList = useCollection<Commission>(loadCommissions);

  return (
    <Card className="overflow-hidden">
      <Table headers={HEADERS}>
        {trainerList.items.length === 0 ? (
          <TableEmpty
            columns={HEADERS.length}
            message="No hay entrenadores registrados."
          />
        ) : (
          trainerList.items.map((trainer) => {
            const own = commissionList.items.filter(
              (commission) => commission.trainerId === trainer.id,
            );
            const pending = unsettledCommissions(
              commissionList.items,
              trainer.id as TrainerId,
            );

            return (
              <TableRow key={trainer.id}>
                <TableCell className="font-semibold">
                  {trainer.fullName}
                </TableCell>
                <TableCell>{formatCOP(commissionTotal(own))}</TableCell>
                <TableCell className="font-semibold text-orange-700">
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
