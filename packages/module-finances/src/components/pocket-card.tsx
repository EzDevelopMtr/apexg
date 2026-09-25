"use client";

import { Archive, ArchiveRestore, PiggyBank } from "lucide-react";
import type { PocketProgress } from "@apexg/core";
import { formatCOP } from "@apexg/core";
import { Badge, Button, Card, CardBody } from "@apexg/ui";

export interface PocketCardProps {
  progress: PocketProgress;
  onContribute: () => void;
  onToggleClosed: () => void;
}

/** Un bolsillo: a qué se destina, cuánto lleva y cuánto falta. */
export default function PocketCard({
  progress,
  onContribute,
  onToggleClosed,
}: PocketCardProps) {
  const { pocket, saved, remaining, percent, reached } = progress;

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
            <PiggyBank size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-body">{pocket.name}</p>
              {pocket.closed && <Badge tone="neutral">Cerrado</Badge>}
              {reached && !pocket.closed && <Badge tone="success">Meta lista</Badge>}
            </div>
            <p className="mt-1 text-sm text-body-soft">
              {formatCOP(saved)} de {formatCOP(pocket.goal)}
            </p>
          </div>
        </div>

        {/* La barra es decorativa: la cifra de al lado ya dice lo mismo, y un
            lector de pantalla no necesita oírlo dos veces. */}
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-surface"
          aria-hidden="true"
        >
          <div
            className={`h-full rounded-full ${reached ? "bg-ok" : "bg-brand"}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-body">{percent}%</span>
          <span className="text-sm text-body-soft">
            {reached ? "Meta alcanzada" : `Faltan ${formatCOP(remaining)}`}
          </span>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onToggleClosed}>
            {pocket.closed ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {pocket.closed ? "Reabrir" : "Cerrar"}
          </Button>
          {/* Un bolsillo cerrado conserva su historial, pero no admite más
              aportes: por eso el botón desaparece en vez de quedar apagado. */}
          {!pocket.closed && (
            <Button size="sm" onClick={onContribute}>
              Abonar
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
