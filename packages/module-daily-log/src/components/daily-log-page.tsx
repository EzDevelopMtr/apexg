"use client";

import { useState } from "react";
import type { ClientId, DailyLogSectionId } from "@apexg/core";
import { dailyLogSections, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Modal } from "@apexg/ui";
import { useDailyLog } from "../hooks/use-daily-log";
import { useProductSales } from "../hooks/use-product-sales";
import { useSaleCatalogs } from "../hooks/use-sale-catalogs";
import DailyLogHistory from "./daily-log-history";
import RegisterSaleForm from "./register-sale-form";
import TodayPanel from "./today-panel";

export interface DailyLogPageProps {
  sectionId: DailyLogSectionId;
  /** Stamped onto each note so the log says who wrote it. */
  recordedBy: string;
  onNavigate: (sectionId: string) => void;
  /**
   * Sends the receptionist to charge a client who has run out of days.
   *
   * The app owns routing, so the module asks rather than navigates — Payments
   * is a different module and this package must not know its URL.
   */
  onCharge: (clientId: ClientId) => void;
}

/**
 * Entry point of the Daily log module (RF-34).
 *
 * Its own module rather than a section of Finances: §2.2 grants the
 * receptionist the daily log while denying her Finances.
 *
 * Registering a sale opens as a dialog over "Hoy", like the day pass. Sales
 * come from the hook that records them, so the day's income moves at once.
 */
export default function DailyLogPage({
  sectionId,
  recordedBy,
  onNavigate,
  onCharge,
}: DailyLogPageProps) {
  const log = useDailyLog();
  const sales = useProductSales();
  const catalogs = useSaleCatalogs();
  const [referenceDate] = useState(today);
  const requested = dailyLogSections.getSection(sectionId);
  const section = dailyLogSections.sectionBehind(sectionId);
  const close = () => onNavigate(section.id);

  return (
    <>
    <CollectionGate
      collection={log.gate}
      loadingMessage="Cargando el apartado diario..."
      errorMessage="No pudimos cargar el apartado diario."
    >
      {section.id === "today" ? (
        <TodayPanel
          payments={log.payments}
          productSales={sales.items}
          clients={log.clients}
          notes={log.notes}
          on={referenceDate}
          onAddNote={(text) => log.addNote(text, recordedBy, referenceDate)}
          onCharge={onCharge}
          onNavigate={onNavigate}
        />
      ) : (
        <DailyLogHistory notes={log.notes} />
      )}
    </CollectionGate>

    <Modal open={requested.view.kind === "form"} title={requested.title} onClose={close}>
      <CollectionGate
        collection={catalogs.gate}
        loadingMessage="Cargando productos y clientes..."
        errorMessage="No pudimos cargar los productos disponibles."
      >
        <RegisterSaleForm
          items={catalogs.items}
          clients={catalogs.clients}
          onCreate={sales.create}
          onDone={close}
        />
      </CollectionGate>
    </Modal>
    </>
  );
}
