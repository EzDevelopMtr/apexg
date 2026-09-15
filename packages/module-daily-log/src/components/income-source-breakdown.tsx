"use client";

import type { Money } from "@apexg/core";
import { formatCOP } from "@apexg/core";

export interface IncomeSourceRow {
  readonly key: string;
  readonly label: string;
  readonly amount: Money;
}

export interface IncomeSourceBreakdownProps {
  title: string;
  total: Money;
  rows: readonly IncomeSourceRow[];
  emptyMessage: string;
}

/** One income source's total and its line items — shared by every source shown in {@link DailyIncomeCard}. */
export default function IncomeSourceBreakdown({
  title,
  total,
  rows,
  emptyMessage,
}: IncomeSourceBreakdownProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-body">{title}</span>
        <span className="font-semibold text-body">{formatCOP(total)}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-body-faint">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line-soft">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-body-soft">{row.label}</span>
              <span className="text-body">{formatCOP(row.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
