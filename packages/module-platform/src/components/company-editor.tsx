"use client";

import type { PlatformCompany } from "@apexg/core";
import { Button } from "@apexg/ui";
import { useCompanyEditor } from "../hooks/use-company-editor";
import type { CompanyActions } from "../hooks/use-company-editor";
import CompanyIdentitySection from "./company-identity-section";
import CredentialNotice from "./credential-notice";

export interface CompanyEditorProps {
  company: PlatformCompany;
  actions: CompanyActions;
}

export default function CompanyEditor({ company, actions }: CompanyEditorProps) {
  const editor = useCompanyEditor(company, actions);
  const { busy } = editor;
  const suspended = company.status === "suspended";

  return (
    <div className="space-y-6">
      <CompanyIdentitySection editor={editor} />

      <section className="space-y-2 border-t border-line pt-4">
        <p className="text-sm text-body-soft">Logo (SVG, PNG o WEBP, máximo 512 KB)</p>
        <input
          type="file"
          aria-label="Logo"
          accept="image/svg+xml,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void editor.uploadLogo(file);
          }}
          className="text-sm text-body-soft"
        />
      </section>

      <section className="flex flex-wrap gap-3 border-t border-line pt-4">
        <Button variant="secondary" onClick={editor.resetPassword} disabled={busy}>
          Restablecer contraseña del administrador
        </Button>
        <Button
          variant={suspended ? "primary" : "danger"}
          onClick={editor.toggleStatus}
          disabled={busy}
        >
          {suspended ? "Reactivar gimnasio" : "Suspender gimnasio"}
        </Button>
      </section>

      {editor.credential && (
        <CredentialNotice credential={editor.credential} entrance={`/${company.slug}`} />
      )}
      {editor.error && (
        <p role="alert" className="text-sm text-danger-ink">
          {editor.error}
        </p>
      )}
      {editor.notice && <p className="text-sm text-body-soft">{editor.notice}</p>}
    </div>
  );
}
