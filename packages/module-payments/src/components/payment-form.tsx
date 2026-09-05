"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { Client, Payment } from "@apexg/core";
import { Button, Select } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import { useRecordPayment } from "../hooks/use-record-payment";
import PaymentCycleSummary from "./payment-cycle-summary";
import PaymentFormFields from "./payment-form-fields";

export interface PaymentFormProps {
  clients: readonly Client[];
  payments: readonly Payment[];
  recordedBy: string;
  onRecord: (draft: Omit<Payment, "id">) => Promise<void>;
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
  onDone,
}: PaymentFormProps) {
  const form = useRecordPayment(clients, payments, recordedBy);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const draft = form.build();
    if (!draft) return;

    setSaving(true);
    try {
      await onRecord(draft);
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
        <p role="alert" className="text-sm text-red-600">
          {form.error}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !form.cycle}>
          <Save size={18} />
          {saving ? "Registrando..." : "Registrar pago"}
        </Button>
      </div>
    </form>
  );
}
