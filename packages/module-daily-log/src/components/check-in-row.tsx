"use client";

import type { IsoDate } from "@apexg/core";
import {
  CHECK_IN_REFUSAL_LABELS,
  checkInRefusal,
  expiresWithin,
  noticeFor,
  today,
  visitQuota,
} from "@apexg/core";
import type { AttendanceCandidate } from "@apexg/data";
import { Avatar, Badge } from "@apexg/ui";
import CheckInActions from "./check-in-actions";
import VisitQuotaDots from "./visit-quota-dots";

export interface CheckInRowProps {
  candidate: AttendanceCandidate;
  onCheckIn: () => void;
  onCheckOut: () => void;
  /** Opens the payment form for this client, with their id carried over. */
  onCharge: () => void;
  /** Dónde está su foto. `undefined` si no tiene. */
  photoUrl?: string;
  onOpenPhoto: () => void;
}

/** One search result: who they are, their plan, their week, and the action. */
export default function CheckInRow({
  candidate,
  onCheckIn,
  onCheckOut,
  onCharge,
  photoUrl,
  onOpenPhoto,
}: CheckInRowProps) {
  const quota = visitQuota(candidate.weeklyVisits, candidate.usedThisWeek);
  const refusal = checkInRefusal(candidate.status, quota);
  // Le queda poco pero todavía entra: se avisa en ámbar sin bloquear nada.
  // El día que venza, `refusal` lo pinta en rojo y esto sobra.
  const soon =
    refusal === null &&
    candidate.expiresOn !== null &&
    expiresWithin(candidate.expiresOn as IsoDate, today());
  // Already inside is not a refusal: the useful action is the way out.
  const blocked = refusal !== null && !candidate.inside;
  const payable = refusal === "overdue" || refusal === "quotaSpent";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        blocked
          ? "border-danger-line bg-danger-soft"
          : soon
            ? "border-warn-line bg-warn-soft"
            : "border-line"
      }`}
    >
      {/* La foto es lo primero de la fila: la recepcionista confirma de un
          vistazo que quien está enfrente es quien dice ser. */}
      <Avatar
        name={candidate.clientName}
        photoUrl={photoUrl}
        onOpen={onOpenPhoto}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-body">
          {candidate.clientName}
        </p>
        <p className="truncate text-sm text-body-soft">
          {candidate.membershipName}
          {candidate.expiresOn && ` · vence ${candidate.expiresOn}`}
        </p>
        {soon && candidate.expiresOn && (
          <p className="mt-1 text-sm font-semibold text-warn-ink">
            {noticeFor(candidate.expiresOn as IsoDate, today())} · ofrécele
            renovar
          </p>
        )}
        {blocked && refusal && (
          <p className="mt-1 text-sm text-danger-ink">
            {CHECK_IN_REFUSAL_LABELS[refusal]}
          </p>
        )}
      </div>

      {candidate.inside && <Badge tone="success">Dentro</Badge>}

      {/* Sin membresia no hay cupo que mostrar: las barras dirian algo sobre
          un plan que no existe. */}
      {candidate.status !== null && (
        <VisitQuotaDots
          weeklyVisits={candidate.weeklyVisits}
          usedThisWeek={candidate.usedThisWeek}
        />
      )}

      <CheckInActions
        inside={candidate.inside}
        blocked={blocked}
        payable={payable}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
        onCharge={onCharge}
      />
    </div>
  );
}
