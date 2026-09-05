"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { Trainer } from "@apexg/core";
import { Button } from "@apexg/ui";
import type { TrainerDraft } from "./trainer-draft";
import { initialDraft, validateDraft } from "./trainer-draft";
import TrainerFields from "./trainer-fields";

export interface TrainerFormProps {
  trainer?: Trainer;
  onSave: (draft: TrainerDraft, existing?: Trainer) => Promise<void>;
  onCancel: () => void;
}

export default function TrainerForm({
  trainer,
  onSave,
  onCancel,
}: TrainerFormProps) {
  const [draft, setDraft] = useState<TrainerDraft>(() => initialDraft(trainer));
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const update = <K extends keyof TrainerDraft>(
    field: K,
    value: TrainerDraft[K],
  ) => setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const problem = validateDraft(draft);
    if (problem) return setFailure(problem);

    setSaving(true);
    setFailure(null);
    try {
      await onSave(draft, trainer);
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "No se pudo guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TrainerFields draft={draft} update={update} />

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
          {saving ? "Guardando..." : "Guardar entrenador"}
        </Button>
      </div>
    </form>
  );
}
