"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { ClientId } from "@apexg/core";
import type { AttendanceCandidate } from "@apexg/data";
import { useRepositories } from "@apexg/module-kit";
import { Card, CardBody, CardHeader, PhotoViewer } from "@apexg/ui";
import type { UseAttendanceResult } from "../hooks/use-attendance";
import CheckInRow from "./check-in-row";
import CheckInSearch from "./check-in-search";

export interface CheckInCardProps {
  attendance: UseAttendanceResult;
  /** Opens the payment form for a client who has run out of days. */
  onCharge: (clientId: ClientId) => void;
  /** The day's other frequent tasks, beside the title: day pass, sale. */
  actions: ReactNode;
}

/**
 * Registering who arrives — the most frequent thing reception does — at the
 * top of "Hoy" instead of a tab of its own.
 */
export default function CheckInCard({ attendance, onCharge, actions }: CheckInCardProps) {
  const { clients } = useRepositories();
  const [query, setQuery] = useState("");
  // Una sola foto abierta a la vez; si cada fila tuviera la suya, dos se
  // podrían apilar una encima de otra.
  const [viewing, setViewing] = useState<AttendanceCandidate | null>(null);

  const search = (value: string) => {
    setQuery(value);
    attendance.search(value);
  };

  return (
    <Card>
      <CardHeader title="Registrar ingreso" action={<div className="flex flex-wrap gap-2">{actions}</div>} />
      <CardBody>
        <CheckInSearch value={query} onChange={search}>
          {attendance.matches.map((candidate) => (
            <CheckInRow
              key={candidate.clientId}
              candidate={candidate}
              onCheckIn={() => attendance.checkIn(candidate.clientId)}
              onCheckOut={() => attendance.checkOut(candidate.clientId)}
              onCharge={() => onCharge(candidate.clientId)}
              photoUrl={candidate.hasPhoto ? clients.photoUrl(candidate.clientId) : undefined}
              onOpenPhoto={() => setViewing(candidate)}
            />
          ))}
          {!attendance.searching && attendance.matches.length === 0 && (
            <p className="py-2 text-sm text-body-faint">
              {query.trim() ? "Ningún cliente con ese nombre." : "No hay clientes registrados."}
            </p>
          )}
        </CheckInSearch>

        {attendance.error && (
          <p role="alert" className="mt-3 text-sm text-danger-ink">
            {attendance.error}
          </p>
        )}
      </CardBody>
      <PhotoViewer
        photo={viewing ? { url: clients.photoUrl(viewing.clientId), name: viewing.clientName } : null}
        onClose={() => setViewing(null)}
      />
    </Card>
  );
}
