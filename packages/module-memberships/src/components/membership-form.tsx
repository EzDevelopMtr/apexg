"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { MembershipType } from "@apexg/core";
import { Button } from "@apexg/ui";
import MembershipFields from "./membership-fields";

export interface MembershipFormProps {
  type: MembershipType;
  onSave: (type: MembershipType) => Promise<void>;
  onCancel: () => void;
}

/** Validation mirrors what the API must also enforce (RNF-07). */
function validate(draft: MembershipType): string | null {
  if (!draft.name.trim()) return "El nombre es obligatorio.";
  if (draft.price <= 0) return "El valor debe ser mayor que cero.";
  if (draft.term.amount <= 0) return "La vigencia debe ser mayor que cero.";
  if (draft.minimumInstallment && draft.minimumInstallment > draft.price) {
    return "El abono mínimo no puede superar el valor del plan.";
  }
  return null;
}

export default function MembershipForm({
  type,
  onSave,
  onCancel,
}: MembershipFormProps) {
  const [draft, setDraft] = useState(type);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const update = <K extends keyof MembershipType>(
    field: K,
    value: MembershipType[K],
  ) => setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = validate(draft);
    if (problem) return setFailure(problem);

    setSaving(true);
    setFailure(null);
    try {
      await onSave(draft);
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "No se pudo guardar el plan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <MembershipFields draft={draft} update={update} />

      {failure && (
        <p role="alert" className="text-sm text-danger-ink">
          {failure}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-line-soft pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Guardando..." : "Guardar plan"}
        </Button>
      </div>
    </form>
  );
}
