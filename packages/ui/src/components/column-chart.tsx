import type { ReactNode } from "react";
import { ChartLegend, ChartTable, SERIES_FILL } from "./chart-parts";

export interface ColumnSeries {
  /** Nombre de la serie, en español, para la leyenda. */
  readonly label: string;
}

export interface ColumnGroup {
  readonly key: string;
  /** Rótulo del eje, p. ej. "sep" o "15". */
  readonly label: string;
  /** Encabezado del detalle, si el rótulo corto no basta: "15 sep". */
  readonly title?: string;
  /** Un valor por serie, en el orden de `series`. */
  readonly values: readonly number[];
  /** Filas del detalle al pasar el mouse, ya formateadas. */
  readonly details: readonly { readonly label: string; readonly value: string }[];
  /** Resalta este grupo (el mes en curso) y le pone rótulos directos. */
  readonly current?: boolean;
}

export interface ColumnChartProps {
  /** Qué muestra, para lectores de pantalla y la tabla alternativa. */
  label: string;
  series: readonly ColumnSeries[];
  groups: readonly ColumnGroup[];
  /** Formato corto para el eje y los rótulos directos. */
  formatAxis: (value: number) => string;
  /** Pie opcional bajo el gráfico. */
  footer?: ReactNode;
}

/** Un máximo "redondo" para que las líneas guía caigan en cifras legibles. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}

const TICKS = 4;

/**
 * Cuántos rótulos del eje caben sin montarse. Con un mes día a día son 30
 * columnas: se rotula una de cada tres y el detalle dice el resto.
 */
const MAX_AXIS_LABELS = 10;

/** El detalle se abre hacia dentro en los extremos, para no salirse del gráfico. */
type Align = "start" | "center" | "end";

const TOOLTIP_ALIGN: Record<Align, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

/**
 * Desde cuántas columnas el gráfico se considera denso: un mes día a día.
 * Denso, las columnas se separan apenas y los rótulos directos se guardan
 * para pantallas anchas — en un teléfono, 30 columnas miden 7 px cada una.
 */
const DENSE_FROM = 13;

function alignFor(index: number, count: number): Align {
  if (count < 3) return "center";
  if (index < count / 3) return "start";
  if (index >= (count * 2) / 3) return "end";
  return "center";
}

/**
 * Las barras de un grupo y su detalle.
 *
 * Enfocable con el teclado, no solo con el mouse: el detalle es donde están
 * las cifras completas, y no puede quedar fuera del alcance de quien no usa
 * mouse. Los grupos que no son el actual van atenuados para que el mes en
 * curso se lea primero.
 */
function Column({
  group,
  max,
  formatAxis,
  align,
  dimmed,
  dense,
}: {
  group: ColumnGroup;
  max: number;
  formatAxis: (value: number) => string;
  align: Align;
  /** Atenuado para que el actual se lea primero; nunca si no hay actual. */
  dimmed: boolean;
  dense: boolean;
}) {
  return (
    <div
      tabIndex={0}
      aria-current={group.current ? "true" : undefined}
      className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-px rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {group.values.map((value, index) => (
        <div key={index} className="flex h-full w-full min-w-0 max-w-7 flex-col justify-end">
          <div
            className={`relative rounded-t-sm ${SERIES_FILL[index] ?? ""} ${
              dimmed ? "opacity-60 group-hover:opacity-100 group-focus:opacity-100" : ""
            }`}
            style={{ height: `${(value / max) * 100}%` }}
          >
            {/* Flota sobre la barra en vez de ocupar su ancho: si no, un
                "$ 700 mil" ensancha su columna y descuadra el eje. */}
            {group.current && value > 0 && (
              <span
                className={`absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-[0.65rem] font-semibold text-body ${
                  dense ? "hidden sm:block" : ""
                }`}
              >
                {formatAxis(value)}
              </span>
            )}
          </div>
        </div>
      ))}

      <div className={`pointer-events-none absolute bottom-full ${TOOLTIP_ALIGN[align]} z-10 mb-2 hidden w-56 rounded-xl border border-line bg-surface p-3 text-sm shadow-xl group-hover:block group-focus:block`}>
        <p className="mb-2 font-semibold text-body">{group.title ?? group.label}</p>
        {group.details.map((row) => (
          <p key={row.label} className="flex justify-between gap-3 text-body-soft">
            {row.label}
            <span className="font-semibold text-body">{row.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * Columnas agrupadas sobre un eje de categorías (meses).
 *
 * Un solo eje para todas las series: son la misma unidad. Detalle completo al
 * pasar el mouse o al enfocar con el teclado; rótulos directos solo en el
 * grupo actual, para no poner un número en cada barra.
 */
export default function ColumnChart({
  label,
  series,
  groups,
  formatAxis,
  footer,
}: ColumnChartProps) {
  const max = niceMax(Math.max(0, ...groups.flatMap((group) => group.values)));
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => (max / TICKS) * (TICKS - i));
  const hasCurrent = groups.some((group) => group.current);
  const dense = groups.length >= DENSE_FROM;
  // Mismo espacio en las barras y en los rótulos, para que cada uno caiga
  // bajo su columna.
  const gap = dense ? "gap-0.5" : "gap-2";
  const labelEvery = Math.ceil(groups.length / MAX_AXIS_LABELS);
  const currentIndex = groups.findIndex((group) => group.current);
  // El actual siempre lleva rótulo; sus vecinos lo ceden si están pegados.
  const showsLabel = (index: number) =>
    index === currentIndex ||
    (index % labelEvery === 0 &&
      (labelEvery === 1 || currentIndex < 0 || Math.abs(index - currentIndex) >= labelEvery));

  return (
    <figure aria-label={label}>
      <ChartLegend series={series} />

      <div className="flex gap-3" aria-hidden="true">
        <div className="flex h-56 w-14 shrink-0 flex-col justify-between text-right text-xs text-body-faint">
          {ticks.map((tick) => (
            <span key={tick} className="leading-none">
              {formatAxis(tick)}
            </span>
          ))}
        </div>

        <div className="relative h-56 flex-1">
          {ticks.map((tick) => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-line-soft"
              style={{ top: `${((max - tick) / max) * 100}%` }}
            />
          ))}
          <div className={`absolute inset-0 flex items-end ${gap}`}>
            {groups.map((group, index) => (
              <Column
                key={group.key}
                group={group}
                max={max}
                formatAxis={formatAxis}
                align={alignFor(index, groups.length)}
                dimmed={hasCurrent && !group.current}
                dense={dense}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Misma estructura que el gráfico —eje de 56 px y columnas flex-1 con
          el mismo espacio— para que cada mes caiga bajo sus barras. */}
      <div className="mt-2 flex gap-3 text-xs text-body-soft" aria-hidden="true">
        <span className="w-14 shrink-0" />
        <div className={`flex flex-1 ${gap}`}>
          {groups.map((group, index) => (
            <span
              key={group.key}
              className={`min-w-0 flex-1 whitespace-nowrap text-center ${group.current ? "font-semibold text-body" : ""}`}
            >
              {showsLabel(index) ? group.label : ""}
            </span>
          ))}
        </div>
      </div>

      {footer}
      <ChartTable label={label} groups={groups} />
    </figure>
  );
}
