"use client";

import { LogIn, LogOut } from "lucide-react";
import {
  CHECK_IN_REFUSAL_LABELS,
  checkInRefusal,
  visitQuota,
} from "@apexg/core";
import type { AttendanceCandidate } from "@apexg/data";
import { Badge, Button } from "@apexg/ui";
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
  const refusal = checkInRefusal(candidate.status, quota);
  // Already inside is not a refusal: the useful action is the way out.
  const blocked = refusal !== null && !candidate.inside;
  const payable = refusal === "overdue" || refusal === "quotaSpent";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        blocked ? "border-danger-line bg-danger-soft" : "border-line"
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
        {blocked && refusal && (
          <p className="mt-1 text-sm text-danger-ink">
            {CHECK_IN_REFUSAL_LABELS[refusal]}
          </p>
        )}
      </div>

      {candidate.inside && <Badge tone="success">Dentro</Badge>}

      <VisitQuotaDots
        weeklyVisits={candidate.weeklyVisits}
        usedThisWeek={candidate.usedThisWeek}
      />

      {/* Already inside offers the exit, never a second entry.

          A blocked client gets the charge button instead of a greyed-out one:
          the person is at the counter, and the useful next step is taking
          their money. Retired or without a membership has nothing to charge
          here, so that case offers nothing at all. */}
      {candidate.inside ? (
        <Button variant="secondary" size="sm" onClick={onCheckOut}>
          <LogOut size={16} />
          Registrar salida
        </Button>
      ) : payable ? (
        <Button size="sm" onClick={onCharge}>
          Renovar o pagar día
        </Button>
      ) : blocked ? null : (
        <Button variant="secondary" size="sm" onClick={onCheckIn}>
          <LogIn size={16} />
          Registrar ingreso
        </Button>
      )}
    </div>
  );
}
