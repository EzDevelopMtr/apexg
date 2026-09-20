"use client";

import { LogIn, LogOut } from "lucide-react";
import { visitQuota } from "@apexg/core";
import type { AttendanceCandidate } from "@apexg/data";
import { Button } from "@apexg/ui";
import VisitQuotaDots from "./visit-quota-dots";

export interface CheckInRowProps {
  candidate: AttendanceCandidate;
  onCheckIn: () => void;
  onCheckOut: () => void;
  /** Opens the payment form for this client, with their id carried over. */
  onCharge: () => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

/** One search result: who they are, their plan, their week, and the action. */
export default function CheckInRow({
  candidate,
  onCheckIn,
  onCheckOut,
  onCharge,
}: CheckInRowProps) {
  const quota = visitQuota(candidate.weeklyVisits, candidate.usedThisWeek);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        quota.exhausted ? "border-danger-line bg-danger-soft" : "border-line"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-ink">
        {initials(candidate.clientName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-body">
          {candidate.clientName}
        </p>
        <p className="truncate text-sm text-body-soft">
          {candidate.membershipName}
          {candidate.expiresOn && ` · vence ${candidate.expiresOn}`}
        </p>
      </div>

      <VisitQuotaDots
        weeklyVisits={candidate.weeklyVisits}
        usedThisWeek={candidate.usedThisWeek}
      />

      {/* Already inside offers the exit, never a second entry: entering twice
          would spend another day of the allowance by accident.

          Exhausted swaps the action rather than disabling it — the person is
          at the counter, and the useful next step is taking their money, not
          a greyed-out button that explains nothing. */}
      {candidate.inside ? (
        <Button variant="secondary" size="sm" onClick={onCheckOut}>
          <LogOut size={16} />
          Registrar salida
        </Button>
      ) : quota.exhausted ? (
        <Button size="sm" onClick={onCharge}>
          Renovar o pagar día
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={onCheckIn}>
          <LogIn size={16} />
          Registrar ingreso
        </Button>
      )}
    </div>
  );
}
