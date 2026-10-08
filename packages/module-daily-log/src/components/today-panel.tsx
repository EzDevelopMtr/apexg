"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import type { Client, ClientId, DailyLogNote, IsoDate, Payment, ProductSale } from "@apexg/core";
import { buildDailyLog, panelActionsFor } from "@apexg/core";
import { useMembershipTypeCatalog } from "@apexg/module-kit";
import { Button, Icon } from "@apexg/ui";
import { useAttendance } from "../hooks/use-attendance";
import { useDayPasses } from "../hooks/use-day-passes";
import AttendanceList from "./attendance-list";
import CheckInCard from "./check-in-card";
import DailyIncomeCard from "./daily-income-card";
import DayPassDialog from "./day-pass-dialog";
import DayPassList from "./day-pass-list";
import NewClientsCard from "./new-clients-card";
import NotesCard from "./notes-card";
import TodaySummary from "./today-summary";

export interface TodayPanelProps {
  payments: readonly Payment[];
  productSales: readonly ProductSale[];
  clients: readonly Client[];
  notes: readonly DailyLogNote[];
  on: IsoDate;
  onAddNote: (text: string) => Promise<void>;
  onCharge: (clientId: ClientId) => void;
  /** Opens a task of this module that has its own screen — the sale form. */
  onNavigate: (sectionId: string) => void;
}

/**
 * "Hoy" (RF-34): who arrives first, then the day in one row, then the detail.
 *
 * The day passes come from the hook that sells them, not from the logbook's
 * own copy: selling one here updates the day's income at once.
 */
export default function TodayPanel({ payments, productSales, clients, notes, on, onAddNote, onCharge, onNavigate }: TodayPanelProps) {
  const attendance = useAttendance();
  const passes = useDayPasses();
  const membershipTypes = useMembershipTypeCatalog();
  const [sellingPass, setSellingPass] = useState(false);
  const dayPasses = passes.today;
  const log = buildDailyLog({ payments, productSales, dayPasses, clients }, notes, on);

  const actions = (
    <>
      {/* Para quien viene un solo día: se le cobra sin abrirle ficha. */}
      <Button variant="secondary" size="sm" onClick={() => setSellingPass(true)}>
        <Ticket size={16} />
        Pase de día
      </Button>
      {panelActionsFor("dailyLog").map((action) => (
        <Button key={action.id} variant="secondary" size="sm" onClick={() => onNavigate(action.id)}>
          <Icon name={action.icon} size={16} />
          {action.label}
        </Button>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <CheckInCard attendance={attendance} onCharge={onCharge} actions={actions} />
      <TodaySummary log={log} checkIns={attendance.today.items.length} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <DailyIncomeCard log={log} payments={payments} productSales={productSales} dayPasses={dayPasses} clients={clients} on={on} />
          <AttendanceList entries={attendance.today.items} onCheckOut={attendance.checkOut} />
          <DayPassList passes={dayPasses} receiptUrl={passes.receiptUrl} />
        </div>
        <div className="space-y-6">
          <NotesCard notes={log.notes} onAddNote={onAddNote} />
          <NewClientsCard clients={log.newClients} payments={payments} membershipTypes={membershipTypes.items} on={on} />
        </div>
      </div>
      <DayPassDialog open={sellingPass} onClose={() => setSellingPass(false)} pass={passes} />
    </div>
  );
}
