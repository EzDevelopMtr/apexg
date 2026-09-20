"use client";

import { useMemo, useState } from "react";
import type { Payment, PaymentSectionId } from "@apexg/core";
import { cyclesWithBalance, paymentSections, today } from "@apexg/core";
import { CollectionGate } from "@apexg/module-kit";
import { Card, CardBody } from "@apexg/ui";
import { useClientDirectory, usePayments } from "../hooks/use-payments";
import PaymentForm from "./payment-form";
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
 */
export default function PaymentsPage({
  sectionId,
  recordedBy,
  onNavigate,
  initialClientId = "",
}: PaymentsPageProps) {
  const section = paymentSections.getSection(sectionId);
  const payments = usePayments();
  const clients = useClientDirectory();
  const [referenceDate] = useState(today);

  const visible = useMemo(() => {
    if (section.view.kind !== "list") return [];

    const scoped =
      sectionId === "outstanding"
        ? cyclesWithBalance(payments.items)
        : payments.items;

    const { includes } = section.view;
    return [...scoped]
      .filter((payment: Payment) => includes(payment, referenceDate))
      .sort((a, b) => b.paidOn.localeCompare(a.paidOn));
  }, [payments.items, section, sectionId, referenceDate]);

  if (section.view.kind === "form") {
    return (
      <CollectionGate
        collection={clients}
        loadingMessage="Cargando clientes..."
        errorMessage="No pudimos cargar los clientes."
      >
        <Card>
          <CardBody>
            <PaymentForm
              clients={clients.items}
              payments={payments.items}
              recordedBy={recordedBy}
              initialClientId={initialClientId}
              onRenew={clients.renew}
              onRecord={async (draft, receipt) => {
                await payments.record(draft, receipt);
              }}
              onDone={() => onNavigate("all")}
            />
          </CardBody>
        </Card>
      </CollectionGate>
    );
  }

  return (
    <CollectionGate
      collection={payments}
      loadingMessage="Cargando pagos..."
      errorMessage="No pudimos cargar los pagos."
    >
      <PaymentList
        payments={visible}
        clients={clients.items}
        receiptUrl={payments.receiptUrl}
      />
    </CollectionGate>
  );
}
