"use client";

import { visitQuota } from "@apexg/core";

export interface VisitQuotaDotsProps {
  /** Visits the plan grants per week, or null when uncapped. */
  weeklyVisits: number;
  usedThisWeek: number;
}

/**
 * The week at a glance: one bar per allowed visit, filled for each one spent.
 *
 * Bars rather than a bare "2/3" because the receptionist reads this across a
 * counter while someone waits — the shape answers before the number does.
 */
export default function VisitQuotaDots({
  weeklyVisits,
  usedThisWeek,
}: VisitQuotaDotsProps) {
  const quota = visitQuota(weeklyVisits, usedThisWeek);

  return (
    <div className="text-right">
      <div className="mb-1 flex justify-end gap-1">
        {Array.from({ length: quota.allowed }, (_, index) => (
          <span
            key={index}
            className={`h-2 w-5 rounded-full ${
              index < quota.used ? "bg-ok-ink" : "bg-line"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs ${quota.exhausted ? "text-danger-ink" : "text-body-soft"}`}
      >
        {quota.used} de {quota.allowed} esta semana
      </p>
    </div>
  );
}
