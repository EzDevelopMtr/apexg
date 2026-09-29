export interface BarListItem {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  /** El valor ya formateado, al final de la barra. */
  readonly valueLabel: string;
  /** Una línea tenue debajo, p. ej. la comparación con el mes anterior. */
  readonly note?: string;
}

export interface BarListProps {
  /** Qué muestra, para lectores de pantalla. */
  label: string;
  items: readonly BarListItem[];
  /** Qué decir cuando no hay nada que mostrar. */
  emptyMessage: string;
}

/**
 * Barras horizontales, una sola serie, de mayor a menor.
 *
 * Horizontales porque los rótulos son nombres largos ("Mensualidad (lunes a
 * sábado)") que en un eje vertical habría que partir o girar. Un solo color
 * para todas: las barras no son series distintas, son rubros de la misma, y
 * el largo ya dice cuál pesa más — pintarlas por tamaño repetiría el dato.
 */
export default function BarList({ label, items, emptyMessage }: BarListProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-body-faint">{emptyMessage}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((running, item) => running + item.value, 0);

  return (
    <ul aria-label={label} className="space-y-3">
      {items.map((item) => {
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-body">{item.label}</span>
              <span className="shrink-0 font-semibold text-body">
                {item.valueLabel}
                <span className="ml-2 font-normal text-body-faint">{share}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            {item.note && <p className="mt-1 text-xs text-body-faint">{item.note}</p>}
          </li>
        );
      })}
    </ul>
  );
}
