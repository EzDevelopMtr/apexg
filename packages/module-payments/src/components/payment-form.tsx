"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { Client, ClientId, Payment } from "@apexg/core";
import { Button, Select } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import { useRecordPayment } from "../hooks/use-record-payment";
import PaymentCycleSummary from "./payment-cycle-summary";
import PaymentFormFields from "./payment-form-fields";

export interface PaymentFormProps {
  clients: readonly Client[];
  payments: readonly Payment[];
  recordedBy: string;
  onRecord: (draft: Omit<Payment, "id">, receipt?: Blob) => Promise<void>;
  /** Opens a new period on the same plan, for a client whose one expired. */
  onRenew: (clientId: ClientId) => Promise<void>;
  /** Client to start on, or empty to let the receptionist pick. */
  initialClientId?: string;
  onDone: () => void;
}

/** Retired clients cannot take on a new payment (SRS §4.5). */
function payableClients(clients: readonly Client[]): readonly SelectOption[] {
  return clients
    .filter((client) => client.status !== "inactive")
    .map((client) => ({
      value: client.id,
      label: `${client.fullName} — ${client.idNumber}`,
    }));
}

export default function PaymentForm({
  clients,
  payments,
  recordedBy,
  onRecord,
  onRenew,
  onDone,
  initialClientId = "",
}: PaymentFormProps) {
  const form = useRecordPayment(clients, payments, recordedBy, initialClientId);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const draft = form.build();
    if (!draft) return;

    setSaving(true);
    try {
      // Renovar primero: el pago se cuelga de la membresía vigente, así que
      // registrarlo antes lo ataría al periodo viejo, que ya está saldado.
      //
      // Si el pago fallara después, el cliente queda con periodo nuevo y saldo
      // pendiente — el mismo estado de quien paga por abonos, no algo roto.
      if (form.cycle?.renews) {
        await onRenew(draft.clientId);
      }
      await onRecord(draft, form.values.receipt ?? undefined);
      form.reset();
      onDone();
    } catch (cause) {
      form.setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar el pago.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Select
        id="clientId"
        label="Cliente"
        value={form.values.clientId}
        options={payableClients(clients)}
        placeholder="Selecciona un cliente"
        onChange={(event) => form.setValue("clientId", event.target.value)}
      />

      {form.cycle && <PaymentCycleSummary cycle={form.cycle} />}

      <PaymentFormFields values={form.values} setValue={form.setValue} />

      {form.error && (
        <p role="alert" className="text-sm text-danger-ink">
          {form.error}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-line-soft pt-5">
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !form.cycle}>
          <Save size={18} />
          {saving
            ? "Registrando..."
            : form.cycle?.renews
              ? "Renovar y registrar pago"
              : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
}
