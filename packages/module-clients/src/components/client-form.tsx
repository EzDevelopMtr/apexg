"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import type { Client, ClientDraft } from "@apexg/core";
import { Button, useFirstInvalidFocus } from "@apexg/ui";
import { useClientForm } from "../hooks/use-client-form";
import ClientFormFields from "./client-form-fields";

export interface ClientFormProps {
  /** Present when editing, absent when creating. */
  client?: Client;
  onSave: (draft: ClientDraft, existing?: Client) => Promise<void>;
  onCancel: () => void;
}

export default function ClientForm({
  client,
  onSave,
  onCancel,
}: ClientFormProps) {
  const form = useClientForm(client);
  const { formRef, reportInvalid } = useFirstInvalidFocus();
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const draft = form.submit();
    if (!draft) {
      // Fourteen fields, and in the edit modal most of them are scrolled out
      // of view: without this the button would just appear not to work.
      reportInvalid();
      return;
    }

    setSaving(true);
    setFailure(null);
    try {
      await onSave(draft, client);
    } catch (cause) {
      setFailure(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <ClientFormFields {...form} />

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
          {saving ? "Guardando..." : "Guardar cliente"}
        </Button>
      </div>
    </form>
  );
}
