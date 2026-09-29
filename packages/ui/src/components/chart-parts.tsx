import type { ColumnGroup, ColumnSeries } from "./column-chart";

/** Los colores de serie del tema, en orden fijo: nunca se reciclan. */
export const SERIES_FILL = ["bg-chart-1", "bg-chart-2"] as const;

export function ChartLegend({ series }: { series: readonly ColumnSeries[] }) {
  return (
    <ul
      className="mb-4 flex flex-wrap gap-4 text-sm text-body-soft"
      aria-hidden="true"
    >
      {series.map((one, index) => (
        <li key={one.label} className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-sm ${SERIES_FILL[index] ?? ""}`}
          />
          {one.label}
        </li>
      ))}
    </ul>
  );
}

/** La misma información como tabla, para quien no ve el gráfico. */
export function ChartTable({
  label,
  groups,
}: {
  label: string;
  groups: readonly ColumnGroup[];
}) {
  return (
    <div className="sr-only">
      <table>
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            {groups[0]?.details.map((row) => (
              <th key={row.label} scope="col">
                {row.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.key}>
              <th scope="row">{group.title ?? group.label}</th>
              {group.details.map((row) => (
                <td key={row.label}>{row.value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
