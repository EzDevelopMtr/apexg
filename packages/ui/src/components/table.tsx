import type { ReactNode } from "react";

export interface TableProps {
  /** Column headings, in Spanish. */
  headers: readonly string[];
  children: ReactNode;
}

export default function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        {/* A rule and small caps carry the header, no fill. It used to take
            `bg-surface` — the same value the row hover below uses — so running
            the pointer down the table made every row look like a header. */}
        <thead className="border-b border-line">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-body-soft"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">{children}</tbody>
      </table>
    </div>
  );
}

/** True when the click landed on a control inside the row, which acts on its own. */
const onControl = (target: EventTarget) => target instanceof Element && target.closest("button, a, input, select, textarea") !== null;

/**
 * A row. With `onActivate` the whole row is the way into the record — click
 * or Enter — so a table needs no "Acción" column of identical buttons.
 * Controls inside it (a photo, a link) keep their own click.
 */
export function TableRow({ children, onActivate, label }: { children: ReactNode; onActivate?: () => void; label?: string }) {
  if (!onActivate) return <tr className="transition hover:bg-surface">{children}</tr>;
  return (
    <tr
      tabIndex={0}
      aria-label={label}
      onClick={(event) => !onControl(event.target) && onActivate()}
      onKeyDown={(event) => event.key === "Enter" && event.target === event.currentTarget && onActivate()}
      className="cursor-pointer transition hover:bg-surface focus:outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-6 py-4 text-body-muted ${className}`}>{children}</td>
  );
}

export function TableEmpty({
  columns,
  message,
}: {
  columns: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={columns} className="px-6 py-12 text-center text-body-faint">
        {message}
      </td>
    </tr>
  );
}
