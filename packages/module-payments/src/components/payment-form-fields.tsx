"use client";

import type { PaymentMethod } from "@apexg/core";
import { PAYMENT_METHOD_LABELS } from "@apexg/core";
import { FileInput, Input, Select, Textarea } from "@apexg/ui";
import type { SelectOption } from "@apexg/ui";
import type { RecordPaymentValues } from "../hooks/use-record-payment";

const METHOD_OPTIONS: readonly SelectOption[] = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

export interface PaymentFormFieldsProps {
  values: RecordPaymentValues;
  setValue: <K extends keyof RecordPaymentValues>(
    field: K,
    value: RecordPaymentValues[K],
  ) => void;
}

/** Amount, method, reference, receipt and notes for a payment (RF-17). */
export default function PaymentFormFields({
  values,
  setValue,
}: PaymentFormFieldsProps) {
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="amountPesos"
          label="Monto (COP)"
          type="number"
          min={0}
          step={1000}
          value={values.amountPesos}
          onChange={(event) => setValue("amountPesos", event.target.value)}
          placeholder="0"
        />
        <Select
          id="method"
          label="Método de pago"
          value={values.method}
          options={METHOD_OPTIONS}
          onChange={(event) =>
            setValue("method", event.target.value as PaymentMethod)
          }
        />
      </div>

      <Input
        id="reference"
        label="Referencia"
        value={values.reference}
        onChange={(event) => setValue("reference", event.target.value)}
        placeholder="Ej. TRX-20260905-001"
      />

      <FileInput
        id="receipt"
        label="Comprobante"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        hint="Obligatorio en todo pago. JPG, PNG, WEBP o PDF, hasta 5 MB."
        file={values.receipt}
        onChange={(file) => setValue("receipt", file)}
      />

      <Textarea
        id="notes"
        label="Observaciones"
        value={values.notes}
        onChange={(event) => setValue("notes", event.target.value)}
      />
    </>
  );
}
