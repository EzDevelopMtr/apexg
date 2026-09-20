"use client";

import { LogOut } from "lucide-react";
import type { Attendance, ClientId } from "@apexg/core";
import { peopleInside } from "@apexg/core";
import { Badge, Button, Card, CardBody, CardHeader } from "@apexg/ui";
import VisitQuotaDots from "./visit-quota-dots";

export interface AttendanceListProps {
  entries: readonly Attendance[];
  onCheckOut: (clientId: ClientId) => void;
}

function Row({
  entry,
  onCheckOut,
}: {
  entry: Attendance;
  onCheckOut: () => void;
}) {
  const inside = entry.leftAt === "";

  return (
    <li className="flex items-center gap-3 px-2 py-3">
      <span className="w-12 shrink-0 text-sm text-body-soft">
        {entry.enteredAt}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-body">
          {entry.clientName}
        </span>
        <span className="block truncate text-sm text-body-soft">
          {entry.membershipName}
        </span>
      </span>

      {inside ? (
        <Badge tone="success">Dentro</Badge>
      ) : (
        <span className="text-sm text-body-faint">Salió {entry.leftAt}</span>
      )}

      <VisitQuotaDots
        weeklyVisits={entry.weeklyVisits}
        usedThisWeek={entry.usedThisWeek}
      />

      {inside && (
        <Button variant="ghost" size="sm" onClick={onCheckOut}>
          <LogOut size={16} />
          Salida
        </Button>
      )}
    </li>
  );
}

/**
 * The day's entries, most recent first, with the way out on each open one.
 *
 * One row per person per day: someone who leaves and comes back reopens their
 * own row rather than adding another, so the list stays a register of who came
 * today instead of a log of turnstile clicks.
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
        description={`${entries.length} personas ingresaron hoy`}
      />
      <CardBody padding="sm">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-body-faint">
            Todavía nadie ha ingresado hoy.
          </p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {entries.map((entry) => (
              <Row
                key={entry.id}
                entry={entry}
                onCheckOut={() => onCheckOut(entry.clientId)}
              />
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
