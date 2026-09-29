"use client";

import type { Client, ClientDraft } from "@apexg/core";
import { Card, CardBody } from "@apexg/ui";
import ClientForm from "./client-form";

export interface ClientsFormViewProps {
  onSave: (
    draft: ClientDraft,
    existing?: Client,
    photo?: File,
  ) => Promise<void>;
  onDone: () => void;
}

export default function ClientsFormView({
  onSave,
  onDone,
}: ClientsFormViewProps) {
  return (
    <div className="max-w-5xl">
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
