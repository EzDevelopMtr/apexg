"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { Client, InventoryItem } from "@apexg/core";
import { fromPesos, toClientId, toInventoryItemId } from "@apexg/core";
import { Button } from "@apexg/ui";
import type { SaleDraft } from "../hooks/use-product-sales";
import RegisterSaleFields from "./register-sale-fields";
import type { RegisterSaleValues } from "./register-sale-fields";

export interface RegisterSaleFormProps {
  items: readonly InventoryItem[];
  clients: readonly Client[];
  onCreate: (draft: SaleDraft) => Promise<void>;
  onDone: () => void;
}

const INITIAL_VALUES: RegisterSaleValues = {
  inventoryItemId: "",
  quantity: "",
  amountPesos: "",
  paymentMethod: "cash",
  clientId: "",
  notes: "",
};

/** Mirrors what the API must also enforce (RNF-07). */
function validate(values: RegisterSaleValues): string | null {
  if (!values.inventoryItemId) return "Selecciona un producto.";
  if (Number(values.quantity) <= 0)
    return "La cantidad debe ser mayor que cero.";
  if (Number(values.amountPesos) <= 0)
    return "El valor debe ser mayor que cero.";
  return null;
}

export default function RegisterSaleForm({
  items,
  clients,
  onCreate,
  onDone,
}: RegisterSaleFormProps) {
  const [values, setValues] = useState<RegisterSaleValues>(INITIAL_VALUES);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const setValue = <K extends keyof RegisterSaleValues>(
    field: K,
    value: RegisterSaleValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFailure(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = validate(values);
    if (problem) return setFailure(problem);

    setSaving(true);
    try {
      await onCreate({
        inventoryItemId: toInventoryItemId(values.inventoryItemId),
        clientId: values.clientId ? toClientId(values.clientId) : undefined,
        quantity: Number(values.quantity),
        amount: fromPesos(Number(values.amountPesos)),
        paymentMethod: values.paymentMethod,
        notes: values.notes.trim(),
      });
      onDone();
    } catch (cause) {
      setFailure(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar la venta.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <RegisterSaleFields
        values={values}
        items={items}
        clients={clients}
        setValue={setValue}
      />

      {failure && (
        <p role="alert" className="text-sm text-danger-ink">
          {failure}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-line-soft pt-5">
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Registrando..." : "Registrar venta"}
        </Button>
      </div>
    </form>
  );
}
