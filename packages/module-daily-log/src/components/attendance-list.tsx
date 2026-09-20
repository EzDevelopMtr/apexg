"use client";

import { LogOut } from "lucide-react";
import type { Attendance, ClientId } from "@apexg/core";
import { peopleInside } from "@apexg/core";
import { Button, Card, CardBody, CardHeader } from "@apexg/ui";

export interface AttendanceListProps {
  entries: readonly Attendance[];
  onCheckOut: (clientId: ClientId) => void;
}

/**
 * The day's entries, most recent first, with the way out on each open one.
 *
 * Counts entries and people separately: they diverge as soon as someone leaves
 * and comes back, and both numbers are real — one is how busy the day was, the
 * other is how many are in the building right now.
 */
export default function AttendanceList({
  entries,
  onCheckOut,
}: AttendanceListProps) {
  const inside = peopleInside(entries);

  return (
    <Card>
      <CardHeader
        title={`Dentro ahora · ${inside.length}`}
        description={`${entries.length} ingresos hoy`}
      />
      <CardBody padding="sm">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-body-faint">
            Todavía nadie ha ingresado hoy.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-2 py-3">
                <span className="w-12 shrink-0 text-sm text-body-soft">
                  {entry.enteredAt}
                </span>
                <span className="min-w-0 flex-1 truncate text-body">
                  {entry.clientName}
                </span>
                {entry.leftAt ? (
                  <span className="text-sm text-body-faint">
                    Salió {entry.leftAt}
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCheckOut(entry.clientId)}
                  >
                    <LogOut size={16} />
                    Salida
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
