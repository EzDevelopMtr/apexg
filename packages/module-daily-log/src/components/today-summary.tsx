import type { DailyLog } from "@apexg/core";
import { formatCOP } from "@apexg/core";
import { Card, CardBody } from "@apexg/ui";

const LABEL = "text-xs font-semibold uppercase tracking-wider text-body-faint";
const VALUE = "mt-1 text-3xl font-bold tabular-nums text-body";

/** Share of the day's income, for the bar. Zero income leaves it empty. */
const share = (part: number, total: number) => (total > 0 ? `${(part / total) * 100}%` : "0%");

/**
 * The whole day in one row: income and where it came from, how many came in,
 * who signed up. It replaces three cards stacked down the page.
 */
export default function TodaySummary({ log, checkIns }: { log: DailyLog; checkIns: number }) {
  const sources = [
    { label: "Pagos", amount: log.incomeFromPayments, fill: "bg-brand" },
    { label: "Ventas", amount: log.incomeFromSales, fill: "bg-brand-ink" },
    { label: "Pases", amount: log.incomeFromDayPasses, fill: "bg-body-faint" },
  ];
  const names = log.newClients.slice(0, 2).map((client) => client.fullName.split(" ")[0]);

  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
      <Card>
        <CardBody>
          <p className={LABEL}>Ingresos del día</p>
          <p className={VALUE}>{formatCOP(log.income)}</p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
            {sources.map((source) => (
              <span key={source.label} className={source.fill} style={{ width: share(source.amount, log.income) }} />
            ))}
          </div>
          <p className="mt-2 text-sm text-body-soft">
            {sources.map((source) => `${source.label} ${formatCOP(source.amount)}`).join(" · ")}
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <p className={LABEL}>Ingresos al gym</p>
          <p className={VALUE}>{checkIns}</p>
          <p className="mt-1 text-sm text-body-soft">{checkIns === 1 ? "persona hoy" : "personas hoy"}</p>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <p className={LABEL}>Clientes nuevos</p>
          <p className={VALUE}>{log.newClients.length}</p>
          <p className="mt-1 truncate text-sm text-body-soft">
            {names.length ? names.join(", ") + (log.newClients.length > 2 ? "…" : "") : "Ninguno todavía"}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
