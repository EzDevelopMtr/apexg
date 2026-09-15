"use client";

import type { Client, InventoryItem, PaymentMethod } from "@apexg/core";
import { PAYMENT_METHOD_LABELS } from "@apexg/core";
import { Input, Select, Textarea } from "@apexg/ui";

export interface RegisterSaleValues {
  inventoryItemId: string;
  quantity: string;
  amountPesos: string;
  paymentMethod: PaymentMethod;
  clientId: string;
  notes: string;
}

export interface RegisterSaleFieldsProps {
  values: RegisterSaleValues;
  items: readonly InventoryItem[];
  clients: readonly Client[];
  setValue: <K extends keyof RegisterSaleValues>(
    field: K,
    value: RegisterSaleValues[K],
  ) => void;
}

const METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }));

/** What was sold, to whom and how it was paid. */
export default function RegisterSaleFields({
  values,
  items,
  clients,
  setValue,
}: RegisterSaleFieldsProps) {
  const itemOptions = items
    .filter((item) => item.active)
    .map((item) => ({
      value: item.id,
      label: `${item.name} — ${item.stock} disponibles`,
    }));

  const clientOptions = [
    { value: "", label: "Sin cliente (venta de mostrador)" },
    ...clients.map((client) => ({ value: client.id, label: client.fullName })),
  ];

  return (
    <>
      <Select
        id="inventoryItemId"
        label="Producto"
        value={values.inventoryItemId}
        options={itemOptions}
        placeholder="Selecciona un producto"
        onChange={(event) => setValue("inventoryItemId", event.target.value)}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          id="quantity"
          label="Cantidad"
          type="number"
          min={0}
          step="any"
          value={values.quantity}
          onChange={(event) => setValue("quantity", event.target.value)}
        />
        <Input
          id="amountPesos"
          label="Valor cobrado (COP)"
          type="number"
          min={0}
          step={500}
          value={values.amountPesos}
          onChange={(event) => setValue("amountPesos", event.target.value)}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Select
          id="paymentMethod"
          label="Forma de pago"
          value={values.paymentMethod}
          options={METHOD_OPTIONS}
          onChange={(event) =>
            setValue("paymentMethod", event.target.value as PaymentMethod)
          }
        />
        <Select
          id="clientId"
          label="Cliente"
          value={values.clientId}
          options={clientOptions}
          onChange={(event) => setValue("clientId", event.target.value)}
        />
      </div>

      <Textarea
        id="notes"
        label="Notas (opcional)"
        value={values.notes}
        onChange={(event) => setValue("notes", event.target.value)}
        placeholder="Ej. Se llevó dos unidades para un amigo"
      />
    </>
  );
}
