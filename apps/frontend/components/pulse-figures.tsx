import type { ModulePulse } from "@apexg/core";
import { formatCOP } from "@apexg/core";

interface Figure {
  readonly value: string;
  readonly label: string;
  /** Client states only: amber and red mean "por vencer" and "en mora", nothing else. */
  readonly tone?: "warn" | "danger";
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * What each daily card says about its module right now. A record per module:
 * a new daily module adds its figures here, the card does not change.
 */
const FIGURES: Partial<Record<string, (pulse: ModulePulse) => readonly Figure[]>> = {
  dailyLog: ({ dailyLog }) => [
    { value: formatCOP(dailyLog.income), label: "ingresos del día" },
    { value: String(dailyLog.checkIns), label: "ingresos al gym" },
    { value: String(dailyLog.newClients), label: plural(dailyLog.newClients, "cliente nuevo", "clientes nuevos") },
  ],
  clients: ({ clients }) => [
    { value: String(clients.expiring), label: "por vencer", tone: clients.expiring ? "warn" : undefined },
    { value: String(clients.overdue), label: "en mora", tone: clients.overdue ? "danger" : undefined },
    { value: String(clients.total), label: "en total" },
  ],
  payments: ({ payments }) => [
    { value: formatCOP(payments.collectedToday), label: "cobrado hoy" },
    { value: String(payments.paymentsToday), label: plural(payments.paymentsToday, "pago hoy", "pagos hoy") },
  ],
};

const TONE = { warn: "text-warn-ink", danger: "text-danger-ink" } as const;

/** The live figures of one daily module, or a quiet placeholder while they load. */
export default function PulseFigures({ moduleId, pulse }: { moduleId: string; pulse: ModulePulse | null }) {
  const figures = pulse ? FIGURES[moduleId]?.(pulse) : undefined;
  if (!figures) {
    return <p className="text-sm text-body-faint">{pulse ? "" : "Cargando…"}</p>;
  }
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-3">
      {figures.map((figure) => (
        <div key={figure.label}>
          <dd className={`text-xl font-bold tabular-nums ${figure.tone ? TONE[figure.tone] : "text-body"}`}>{figure.value}</dd>
          <dt className="text-xs text-body-faint">{figure.label}</dt>
        </div>
      ))}
    </dl>
  );
}
