"use client";

import { useState } from "react";
import type { FinanceSectionId } from "@apexg/core";
import { today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { useFinancialRecords } from "../hooks/use-financial-records";
import BalancePanel from "./balance-panel";
import CommissionsPanel from "./commissions-panel";
import DashboardPanel from "./dashboard-panel";
import SavingsPanel from "./savings-panel";

export interface FinancesPageProps {
  sectionId: FinanceSectionId;
}

/**
 * Entry point of the Finances module (RF-31 to RF-35).
 *
 * Admin-only: §2.2 denies consolidated reports to the receptionist, and the
 * route guard enforces it.
 */
export default function FinancesPage({ sectionId }: FinancesPageProps) {
  const { records, gate } = useFinancialRecords();
  const [referenceDate] = useState(today);

  return (
    <CollectionGate
      collection={gate}
      loadingMessage="Cargando información financiera..."
      errorMessage="No pudimos cargar la información financiera."
    >
      {sectionId === "dashboard" && (
        <DashboardPanel records={records} on={referenceDate} />
      )}
      {sectionId === "monthlyBalance" && (
        <BalancePanel records={records} on={referenceDate} />
      )}
      {sectionId === "savings" && <SavingsPanel />}
      {sectionId === "commissions" && <CommissionsPanel />}
    </CollectionGate>
  );
}
