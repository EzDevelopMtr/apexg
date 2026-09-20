"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { ClientId } from "@apexg/core";
import { Card, CardBody, CardHeader, Input } from "@apexg/ui";
import { useAttendance } from "../hooks/use-attendance";
import AttendanceList from "./attendance-list";
import CheckInRow from "./check-in-row";

export interface CheckInPanelProps {
  /** Opens the payment form for a client who has run out of days. */
  onCharge: (clientId: ClientId) => void;
}

export default function CheckInPanel({ onCharge }: CheckInPanelProps) {
  const attendance = useAttendance();
  const [query, setQuery] = useState("");

  const entries = attendance.today.items;
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Registrar ingreso"
          description="Busca al cliente por su nombre."
        />
        <CardBody className="space-y-3">
          <Input
            id="attendance-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              attendance.search(event.target.value);
            }}
            icon={<Search size={20} />}
            placeholder="Nombre del cliente..."
            aria-label="Buscar cliente para registrar ingreso"
          />

          {attendance.error && (
            <p role="alert" className="text-sm text-danger-ink">
              {attendance.error}
            </p>
          )}

          {attendance.matches.map((candidate) => (
            <CheckInRow
              key={candidate.clientId}
              candidate={candidate}
              onCheckIn={() => attendance.checkIn(candidate.clientId)}
              onCheckOut={() => attendance.checkOut(candidate.clientId)}
              onCharge={() => onCharge(candidate.clientId)}
            />
          ))}

          {query.trim().length >= 2 &&
            !attendance.searching &&
            attendance.matches.length === 0 && (
              <p className="py-2 text-sm text-body-faint">
                Ningún cliente con ese nombre.
              </p>
            )}
        </CardBody>
      </Card>

      <AttendanceList entries={entries} onCheckOut={attendance.checkOut} />
    </div>
  );
}
