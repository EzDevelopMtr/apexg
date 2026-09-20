"use client";

import { useState } from "react";
import type { FocusEvent } from "react";
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

/** Three rows, so the list suggests more below without burying the day's log. */
const THREE_ROWS = "max-h-60";

export default function CheckInPanel({ onCharge }: CheckInPanelProps) {
  const attendance = useAttendance();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  /**
   * Closes only when focus leaves the whole block, not the input.
   *
   * A plain `onBlur` on the field would fire before the click on a result
   * landed, so the list would vanish under the pointer and the button would
   * never be pressed. `relatedTarget` is where focus is going: while it stays
   * inside, the list belongs open.
   */
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Registrar ingreso"
          description="Busca por nombre, o elige de la lista."
        />
        <CardBody>
          <div onFocus={() => setOpen(true)} onBlur={handleBlur}>
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
              aria-expanded={open}
            />

            {open && (
              <div
                className={`mt-3 space-y-3 overflow-y-auto ${THREE_ROWS}`}
                role="listbox"
                aria-label="Clientes"
              >
                {attendance.matches.map((candidate) => (
                  <CheckInRow
                    key={candidate.clientId}
                    candidate={candidate}
                    onCheckIn={() => attendance.checkIn(candidate.clientId)}
                    onCheckOut={() => attendance.checkOut(candidate.clientId)}
                    onCharge={() => onCharge(candidate.clientId)}
                  />
                ))}

                {!attendance.searching && attendance.matches.length === 0 && (
                  <p className="py-2 text-sm text-body-faint">
                    {query.trim()
                      ? "Ningún cliente con ese nombre."
                      : "No hay clientes registrados."}
                  </p>
                )}
              </div>
            )}
          </div>

          {attendance.error && (
            <p role="alert" className="mt-3 text-sm text-danger-ink">
              {attendance.error}
            </p>
          )}
        </CardBody>
      </Card>

      <AttendanceList
        entries={attendance.today.items}
        onCheckOut={attendance.checkOut}
      />
    </div>
  );
}
