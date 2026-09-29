"use client";

import type {
  Client,
  DailyLogNote,
  DayPass,
  IsoDate,
  Payment,
  ProductSale,
} from "@apexg/core";
import { buildDailyLog } from "@apexg/core";
import { useMembershipTypeCatalog } from "@apexg/module-kit";
import DailyIncomeCard from "./daily-income-card";
import NewClientsCard from "./new-clients-card";
import NotesCard from "./notes-card";

export interface DailyLogPanelProps {
  payments: readonly Payment[];
  productSales: readonly ProductSale[];
  dayPasses: readonly DayPass[];
  clients: readonly Client[];
  notes: readonly DailyLogNote[];
  on: IsoDate;
  onAddNote: (text: string) => Promise<void>;
}

/**
 * The day's logbook: income, new clients and notes (RF-34).
 *
 * The figures come from `buildDailyLog` in the domain, so the same numbers
 * appear here and in any report that asks for the same day.
 */
export default function DailyLogPanel({
  payments,
  productSales,
  dayPasses,
  clients,
  notes,
  on,
  onAddNote,
}: DailyLogPanelProps) {
  const log = buildDailyLog(
    { payments, productSales, dayPasses, clients },
    notes,
    on,
  );
  const membershipTypes = useMembershipTypeCatalog();

  return (
    <div className="space-y-6">
      <DailyIncomeCard
        log={log}
        payments={payments}
        productSales={productSales}
        dayPasses={dayPasses}
        clients={clients}
        on={on}
      />
      <NewClientsCard
        clients={log.newClients}
        payments={payments}
        membershipTypes={membershipTypes.items}
        on={on}
      />
      <NotesCard notes={log.notes} onAddNote={onAddNote} />
    </div>
  );
}
