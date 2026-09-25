"use client";

import type { Client, ClientDraft } from "@apexg/core";
import { Card, CardBody, PageHeader } from "@apexg/ui";
import ClientForm from "./client-form";

export interface ClientsFormViewProps {
  title: string;
  onSave: (
    draft: ClientDraft,
    existing?: Client,
    photo?: File,
  ) => Promise<void>;
  onDone: () => void;
}

export default function ClientsFormView({
  title,
  onSave,
  onDone,
}: ClientsFormViewProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Gestión de clientes"
        title={title}
        description="Registra un nuevo cliente en APEX GYM."
      />
      <Card>
        <CardBody>
          <ClientForm
            onSave={async (draft, existing, photo) => {
              await onSave(draft, existing, photo);
              onDone();
            }}
            onCancel={onDone}
          />
        </CardBody>
      </Card>
    </div>
  );
}
