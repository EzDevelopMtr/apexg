"use client";

import { useMemo, useState } from "react";
import type { PaymentSectionId } from "@apexg/core";
import {
  cyclesWithBalance,
  ledgerOf,
  paymentSections,
  settlementDates,
  today,
} from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Modal } from "@apexg/ui";
import {
  useClientDirectory,
  useDayPassHistory,
  usePayments,
} from "../hooks/use-payments";
import PaymentForm from "./payment-form";
import { usePaymentFilter } from "../hooks/use-payment-filter";
import PaymentFilters from "./payment-filters";
import PaymentList from "./payment-list";

export interface PaymentsPageProps {
  sectionId: PaymentSectionId;
  /** Stamped onto each record so the log says who took the money (RNF-07). */
  recordedBy: string;
  onNavigate: (sectionId: string) => void;
  /**
   * Pre-selects a client on the form. Empty when nobody was named.
   *
   * Arrives from the check-in panel, where the receptionist already has the
   * person in front of her and searching again would be asking twice.
   */
  initialClientId?: string;
}

/**
 * Entry point of the Payments module.
 *
 * Dispatches on the section's view kind rather than comparing URL strings.
 * Recording a payment opens as a dialog over the list, which stays on screen.
 */
export default function PaymentsPage({
  sectionId,
  recordedBy,
  onNavigate,
  initialClientId = "",
}: PaymentsPageProps) {
  const requested = paymentSections.getSection(sectionId);
  const section = paymentSections.sectionBehind(sectionId);
  const close = () => onNavigate(section.id);
  const payments = usePayments();
  const clients = useClientDirectory();
  const passes = useDayPassHistory();
  const [referenceDate] = useState(today);

  const visible = useMemo(() => {
    if (section.view.kind !== "list") return [];

    const scoped =
      section.id === "outstanding"
        ? cyclesWithBalance(payments.items)
        : payments.items;

    const { includes } = section.view;
    return [...ledgerOf(scoped, passes.items)]
      .filter((entry) => includes(entry, referenceDate))
      .sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  }, [payments.items, passes.items, section, referenceDate]);

  // Sobre lo que ya dejó pasar la sección ("Con saldo pendiente"), no sobre
  // todo lo cobrado: los filtros de columna afinan la vista, no la reemplazan.
  const filters = usePaymentFilter(visible, clients.items);
  const settlements = useMemo(
    () => settlementDates(payments.items),
    [payments.items],
  );

  return (
    <CollectionGate
      collection={payments}
      loadingMessage="Cargando pagos..."
      errorMessage="No pudimos cargar los pagos."
    >
      <CollectionGate
        collection={passes}
        loadingMessage="Cargando pagos..."
        errorMessage="No pudimos cargar los pases de día."
      >
        <PaymentFilters filters={filters} />
        <PaymentList
          entries={filters.visible}
          clients={clients.items}
          receiptUrl={payments.receiptUrl}
          passReceiptUrl={passes.receiptUrl}
          settlements={settlements}
        />
      </CollectionGate>

      <Modal open={requested.view.kind === "form"} title={requested.title} onClose={close}>
        <CollectionGate
          collection={clients}
          loadingMessage="Cargando clientes..."
          errorMessage="No pudimos cargar los clientes."
        >
          <PaymentForm
            clients={clients.items}
            payments={payments.items}
            recordedBy={recordedBy}
            initialClientId={initialClientId}
            onRenew={clients.renew}
            onRecord={async (draft, receipt) => {
              await payments.record(draft, receipt);
            }}
            onDone={close}
          />
        </CollectionGate>
      </Modal>
    </CollectionGate>
  );
}
