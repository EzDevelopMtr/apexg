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
        <thead className="bg-surface">
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

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="transition hover:bg-surface">{children}</tr>;
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
