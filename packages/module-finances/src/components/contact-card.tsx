"use client";

import type { ReactNode } from "react";
import { formatCOP, formatDayMonth } from "@apexg/core";
import { Card, CardBody, CardHeader } from "@apexg/ui";
import type { FinanceOverview } from "../hooks/use-finance-overview";

/** Cuántas personas se listan por columna antes de resumir el resto. */
const VISIBLE = 5;

interface Row {
  readonly key: string;
  readonly name: string;
  readonly detail: string;
}

function Column({
  title,
  headline,
  caption,
  rows,
  empty,
}: {
  title: string;
  headline: ReactNode;
  caption: string;
  rows: readonly Row[];
  empty: string;
}) {
  const hidden = rows.length - VISIBLE;
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold text-body">{title}</h3>
      <p className="mt-1 text-2xl font-bold text-body">{headline}</p>
      <p className="text-sm text-body-soft">{caption}</p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-body-faint">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line-soft">
          {rows.slice(0, VISIBLE).map((row) => (
            <li key={row.key} className="flex justify-between gap-3 py-2 text-sm">
              <span className="truncate text-body">{row.name}</span>
              <span className="shrink-0 text-body-soft">{row.detail}</span>
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && (
        <p className="mt-2 text-xs text-body-faint">y {hidden} más</p>
      )}
    </section>
  );
}

/**
 * A quién llamar: la plata que está a una conversación de entrar.
 *
 * Tres grupos con un mismo propósito. Los saldos de abonos son plata ya
 * acordada; los que vencen pronto, renovaciones que se cierran si alguien les
 * avisa a tiempo; los que están en mora, ingreso que se pierde cada día.
 * Cada columna lleva su valor en pesos para decidir por dónde empezar.
 */
export default function ContactCard({ overview }: { overview: FinanceOverview }) {
  const { owed, owedTotal, outlook, clientName } = overview;

  return (
    <Card>
      <CardHeader
        title="Plata por recuperar"
        description={`${outlook.activeCount} clientes activos. Estos son los que conviene contactar.`}
      />
      <CardBody>
        <div className="grid gap-8 md:grid-cols-3">
          <Column
            title="Saldos de abonos"
            headline={formatCOP(owedTotal)}
            caption={`${owed.length} ${owed.length === 1 ? "cliente debe" : "clientes deben"} parte de su plan`}
            empty="Nadie tiene abonos sin completar."
            rows={owed.map((one) => ({
              key: one.clientId,
              name: clientName(one.clientId),
              detail: formatCOP(one.amount),
            }))}
          />
          <Column
            title="Vencen en 30 días"
            headline={formatCOP(outlook.expiring.value)}
            caption={`${outlook.expiring.clients.length} renovaciones por cerrar`}
            empty="Nadie vence en los próximos 30 días."
            rows={outlook.expiring.clients.map((client) => ({
              key: client.id,
              name: client.fullName,
              detail: `vence ${formatDayMonth(client.expirationDate)}`,
            }))}
          />
          <Column
            title="En mora"
            headline={formatCOP(outlook.overdue.value)}
            caption={`${outlook.overdue.clients.length} con la membresía vencida`}
            empty="No hay clientes en mora."
            rows={outlook.overdue.clients.map((client) => ({
              key: client.id,
              name: client.fullName,
              detail: `venció ${formatDayMonth(client.expirationDate)}`,
            }))}
          />
        </div>
      </CardBody>
    </Card>
  );
}
