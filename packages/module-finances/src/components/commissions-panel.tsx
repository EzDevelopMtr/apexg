"use client";

import { CollectionGate, CommissionPanel } from "@apexg/module-kit";
import { useCommissionPayouts } from "../hooks/use-commission-payouts";
import type { FinanceOverview } from "../hooks/use-finance-overview";

/** Trainer commissions, from the finance side (RF-23, §4.4), payable here too. */
export default function CommissionsPanel({
  overview,
}: {
  overview: FinanceOverview;
}) {
  const payouts = useCommissionPayouts(overview);

  return (
    <CollectionGate
      collection={payouts.trainers}
      loadingMessage="Cargando entrenadores..."
      errorMessage="No pudimos cargar los entrenadores."
    >
      <CommissionPanel
        trainers={payouts.trainers.items}
        commissions={overview.commissions}
        clients={overview.clients}
        onSettle={payouts.settleAll}
        receiptUrl={payouts.receiptUrl}
      />
    </CollectionGate>
  );
}
