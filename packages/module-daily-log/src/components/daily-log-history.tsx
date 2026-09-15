"use client";

import type { DailyLogNote } from "@apexg/core";
import { Card, Table, TableCell, TableEmpty, TableRow } from "@apexg/ui";

const HEADERS = ["Fecha", "Novedad", "Registró"] as const;

/** Past entries of the logbook. */
export default function DailyLogHistory({
  notes,
}: {
  notes: readonly DailyLogNote[];
}) {
  const ordered = [...notes].sort((a, b) => b.on.localeCompare(a.on));

  return (
    <Card className="overflow-hidden">
      <Table headers={HEADERS}>
        {ordered.length === 0 ? (
          <TableEmpty
            columns={HEADERS.length}
            message="Todavía no hay novedades registradas."
          />
        ) : (
          ordered.map((note) => (
            <TableRow key={note.id}>
              <TableCell className="text-sm">{note.on}</TableCell>
              <TableCell>{note.text}</TableCell>
              <TableCell className="text-sm">{note.recordedBy}</TableCell>
            </TableRow>
          ))
        )}
      </Table>
    </Card>
  );
}
