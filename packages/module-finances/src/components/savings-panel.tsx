"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { SavingsPocketId } from "@apexg/core";
import { ZERO, add, formatCOP } from "@apexg/core";
import { Button, Card, CardBody } from "@apexg/ui";
import { useSavings } from "../hooks/use-savings";
import PocketCard from "./pocket-card";
import { ContributeDialog, NewPocketDialog } from "./pocket-dialogs";

type Dialog =
  | { kind: "none" }
  | { kind: "newPocket" }
  | { kind: "contribute"; pocketId: SavingsPocketId; pocketName: string };

/**
 * Bolsillos de ahorro: apartar utilidad con un destino.
 *
 * Lo apartado baja la utilidad del balance, aparte de los egresos: un egreso
 * ya se gastó y esto sigue en caja, pero ninguno de los dos es ganancia
 * disponible.
 */
export default function SavingsPanel() {
  const savings = useSavings();
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });

  const close = () => {
    setDialog({ kind: "none" });
    savings.clearRefusal();
  };

  const totalSavedNow = savings.progress.reduce(
    (running, one) => add(running, one.saved),
    ZERO,
  );

  return (
    <div className="space-y-5">
      {/* Sin `CardHeader`: el encabezado del módulo ya dice "Bolsillos de
          ahorro" justo encima, y repetirlo desplazaba las tarjetas hacia
          abajo sin añadir nada. */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-body">
                {savings.progress.length === 0
                  ? "Todavía no hay bolsillos."
                  : `Apartado en total: ${formatCOP(totalSavedNow)}`}
              </p>
              <p className="mt-1 text-sm text-body-soft">
                Plata con un destino. Sale de la utilidad, no de los egresos.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialog({ kind: "newPocket" })}>
              <Plus size={16} />
              Nuevo bolsillo
            </Button>
          </div>
        </CardBody>
      </Card>

      {savings.error && (
        <p role="alert" className="text-sm text-danger-ink">
          {savings.error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {savings.progress.map((progress) => (
          <PocketCard
            key={progress.pocket.id}
            progress={progress}
            onContribute={() =>
              setDialog({
                kind: "contribute",
                pocketId: progress.pocket.id,
                pocketName: progress.pocket.name,
              })
            }
            onToggleClosed={() =>
              savings.close(progress.pocket.id, !progress.pocket.closed)
            }
          />
        ))}
      </div>

      <NewPocketDialog
        open={dialog.kind === "newPocket"}
        onClose={close}
        onCreate={savings.create}
      />

      <ContributeDialog
        open={dialog.kind === "contribute"}
        pocketName={dialog.kind === "contribute" ? dialog.pocketName : ""}
        refusal={savings.refusal}
        onClose={close}
        onContribute={(amount, notes) =>
          dialog.kind === "contribute"
            ? savings.contribute(dialog.pocketId, amount, notes)
            : Promise.resolve(false)
        }
      />
    </div>
  );
}
