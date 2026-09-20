"use client";

import { formatCOP } from "@apexg/core";
import { Card, CardBody } from "@apexg/ui";
import type { CycleSummary } from "../hooks/use-record-payment";

/**
 * What the client owes before this payment (RF-18).
 *
 * Shown rather than typed: the balance comes from the recorded payments, so
 * the receptionist cannot contradict it.
 */
export default function PaymentCycleSummary({
  cycle,
}: {
  cycle: CycleSummary;
}) {
  const settled = cycle.balanceBefore <= 0;

  return (
    <Card
      className={cycle.renews ? "border-warn-line bg-surface" : "bg-surface"}
    >
      {/* Lo primero que se lee cuando toca renovar: sin esto el resumen decía
          "Al día" —cierto del mes pasado— y el formulario rechazaba el cobro
          sin explicar que el periodo que se paga es otro. */}
      {cycle.renews && (
        <p className="border-b border-warn-line px-6 py-3 text-sm text-warn-ink">
          Membresía vencida el {cycle.client.expirationDate}. Este cobro renueva
          el mismo plan a partir de hoy.
        </p>
      )}
      <CardBody className="grid gap-4 sm:grid-cols-3">
        <Figure label="Plan" value={cycle.planName} />
        <Figure label="Valor del plan" value={formatCOP(cycle.agreedPrice)} />
        <Figure
          label={cycle.renews ? "Valor a cobrar" : "Saldo pendiente"}
          value={settled ? "Al día" : formatCOP(cycle.balanceBefore)}
          tone={settled ? "text-ok-ink" : "text-warn-ink"}
        />
      </CardBody>
    </Card>
  );
}

function Figure({
  label,
  value,
  tone = "text-body",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-body-soft">
        {label}
      </p>
      <p className={`mt-1 font-bold ${tone}`}>{value}</p>
    </div>
  );
}
