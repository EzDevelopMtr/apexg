"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { InventoryItem } from "@apexg/core";
import { Button } from "@apexg/ui";
import type { InventoryDraft } from "./inventory-draft";
import { initialDraft, validateDraft } from "./inventory-draft";
import InventoryFields from "./inventory-fields";

export interface InventoryFormProps {
  item?: InventoryItem;
  onSave: (draft: InventoryDraft, existing?: InventoryItem) => Promise<void>;
  onCancel: () => void;
}

export default function InventoryForm({
  item,
  onSave,
  onCancel,
}: InventoryFormProps) {
  const [draft, setDraft] = useState<InventoryDraft>(() => initialDraft(item));
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const update = <K extends keyof InventoryDraft>(
    field: K,
    value: InventoryDraft[K],
  ) => setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = validateDraft(draft);
    if (problem) return setFailure(problem);

    setSaving(true);
    setFailure(null);
    try {
      await onSave(draft, item);
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "No se pudo guardar el ítem.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InventoryFields draft={draft} update={update} />

      {failure && (
        <p role="alert" className="text-sm text-red-600">
          {failure}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Guardando..." : "Guardar ítem"}
        </Button>
      </div>
    </form>
  );
}
