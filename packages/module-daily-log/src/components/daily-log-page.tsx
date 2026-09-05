"use client";

import { useState } from "react";
import type { DailyLogSectionId } from "@apexg/core";
import { today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { useDailyLog } from "../hooks/use-daily-log";
import DailyLogHistory from "./daily-log-history";
import DailyLogPanel from "./daily-log-panel";

export interface DailyLogPageProps {
  sectionId: DailyLogSectionId;
  /** Stamped onto each note so the log says who wrote it. */
  recordedBy: string;
}

/**
 * Entry point of the Daily log module (RF-34).
 *
 * Its own module rather than a section of Finances: §2.2 grants the
 * receptionist the daily log while denying her Finances.
 */
export default function DailyLogPage({
  sectionId,
  recordedBy,
}: DailyLogPageProps) {
  const log = useDailyLog();
  const [referenceDate] = useState(today);

  return (
    <CollectionGate
      collection={log.gate}
      loadingMessage="Cargando el apartado diario..."
      errorMessage="No pudimos cargar el apartado diario."
    >
      {sectionId === "today" ? (
        <DailyLogPanel
          payments={log.payments}
          clients={log.clients}
          notes={log.notes}
          on={referenceDate}
          onAddNote={(text) => log.addNote(text, recordedBy, referenceDate)}
        />
      ) : (
        <DailyLogHistory notes={log.notes} />
      )}
    </CollectionGate>
  );
}
