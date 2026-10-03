"use client";

import type { PlatformCompany } from "@apexg/core";
import { Button, Input } from "@apexg/ui";
import { useCompanyEditor } from "../hooks/use-company-editor";
import type { CompanyActions } from "../hooks/use-company-editor";
import CredentialNotice from "./credential-notice";

export interface CompanyEditorProps {
  company: PlatformCompany;
  actions: CompanyActions;
}

export default function CompanyEditor({ company, actions }: CompanyEditorProps) {
  const editor = useCompanyEditor(company, actions);
  const { fields, busy } = editor;
  const suspended = company.status === "suspended";

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <Input id="edit-company-name" label="Nombre" value={fields.name} onChange={(e) => fields.setName(e.target.value)} />
        <Input
          id="edit-company-slug"
          label="Identificador en el link"
          value={fields.slug}
          onChange={(e) => fields.setSlug(e.target.value)}
        />
        <div className="flex items-center gap-3 text-sm text-body-soft">
          Color de marca
          <input
            type="color"
            aria-label="Color de marca"
            value={fields.color}
            onChange={(e) => fields.setColor(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded border border-line bg-transparent"
          />
          <Button variant="ghost" size="sm" onClick={editor.resetColor} disabled={busy}>
            Usar colores por defecto
          </Button>
        </div>
        <Button onClick={editor.save} disabled={busy}>
          Guardar cambios
        </Button>
      </section>

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
        <Button variant={suspended ? "primary" : "danger"} onClick={editor.toggleStatus} disabled={busy}>
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
