"use client";

import type { ClientDraft } from "@apexg/core";
import { Card, CardBody } from "@apexg/ui";
import ClientForm from "./client-form";
import PageHeader from "./page-header";

export interface ClientsFormViewProps {
  title: string;
  onSave: (draft: ClientDraft) => Promise<void>;
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
            onSave={async (draft) => {
              await onSave(draft);
              onDone();
            }}
            onCancel={onDone}
          />
        </CardBody>
      </Card>
    </div>
  );
}
