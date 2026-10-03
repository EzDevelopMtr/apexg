"use client";

import { useState } from "react";
import type { IssuedCredential, NewCompany } from "@apexg/core";
import { Button, Input } from "@apexg/ui";
import { useCompanyForm } from "../hooks/use-company-form";
import CredentialNotice from "./credential-notice";

export interface CompanyFormProps {
  create: (company: NewCompany) => Promise<IssuedCredential>;
}

/** New gym: its identity, its colour and its first administrator. */
export default function CompanyForm({ create }: CompanyFormProps) {
  const [issued, setIssued] = useState<{ credential: IssuedCredential; slug: string } | null>(null);
  const form = useCompanyForm(create, (credential, slug) => setIssued({ credential, slug }));

  if (issued) {
    return (
      <div className="space-y-4">
        <CredentialNotice credential={issued.credential} entrance={`/${issued.slug}`} />
        <Button variant="secondary" onClick={() => setIssued(null)}>
          Crear otro gimnasio
        </Button>
      </div>
    );
  }

  const { values, set, setSlug, error, submitting, submit } = form;
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input id="company-name" label="Nombre del gimnasio" value={values.name} onChange={(e) => set("name", e.target.value)} />
      <Input
        id="company-slug"
        label="Identificador en el link"
        value={values.slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="gimnasio-x"
      />
      <label className="flex items-center gap-3 text-sm text-body-soft">
        Color de marca
        <input
          type="color"
          aria-label="Color de marca"
          value={values.brandColor}
          onChange={(e) => set("brandColor", e.target.value)}
          className="h-9 w-14 cursor-pointer rounded border border-line bg-transparent"
        />
      </label>
      <Input
        id="company-admin-username"
        label="Usuario del administrador"
        value={values.adminUsername}
        onChange={(e) => set("adminUsername", e.target.value)}
      />
      <Input
        id="company-admin-name"
        label="Nombre del administrador"
        value={values.adminFullName}
        onChange={(e) => set("adminFullName", e.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-danger-ink">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creando…" : "Crear gimnasio"}
      </Button>
    </form>
  );
}
