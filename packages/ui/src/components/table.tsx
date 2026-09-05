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
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="transition hover:bg-slate-50">{children}</tr>;
}

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-6 py-4 text-slate-700 ${className}`}>{children}</td>
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
      <td colSpan={columns} className="px-6 py-12 text-center text-slate-400">
        {message}
      </td>
    </tr>
  );
}
