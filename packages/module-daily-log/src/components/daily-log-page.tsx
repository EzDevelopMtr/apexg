"use client";

import { useState } from "react";
import type { DailyLogSectionId } from "@apexg/core";
import { today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { useDailyLog } from "../hooks/use-daily-log";
import { useProductSales } from "../hooks/use-product-sales";
import { useSaleCatalogs } from "../hooks/use-sale-catalogs";
import DailyLogHistory from "./daily-log-history";
import DailyLogPanel from "./daily-log-panel";
import RegisterSaleForm from "./register-sale-form";

export interface DailyLogPageProps {
  sectionId: DailyLogSectionId;
  /** Stamped onto each note so the log says who wrote it. */
  recordedBy: string;
  onNavigate: (sectionId: string) => void;
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
  onNavigate,
}: DailyLogPageProps) {
  const log = useDailyLog();
  const sales = useProductSales();
  const catalogs = useSaleCatalogs();
  const [referenceDate] = useState(today);

  if (sectionId === "sell") {
    return (
      <CollectionGate
        collection={catalogs.gate}
        loadingMessage="Cargando productos y clientes..."
        errorMessage="No pudimos cargar los productos disponibles."
      >
        <RegisterSaleForm
          items={catalogs.items}
          clients={catalogs.clients}
          onCreate={sales.create}
          onDone={() => onNavigate("today")}
        />
      </CollectionGate>
    );
  }

  return (
    <CollectionGate
      collection={log.gate}
      loadingMessage="Cargando el apartado diario..."
      errorMessage="No pudimos cargar el apartado diario."
    >
      {sectionId === "today" ? (
        <DailyLogPanel
          payments={log.payments}
          productSales={log.productSales}
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
