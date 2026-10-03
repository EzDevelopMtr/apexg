"use client";

import { Button, Input } from "@apexg/ui";
import type { useCompanyEditor } from "../hooks/use-company-editor";

type Editor = ReturnType<typeof useCompanyEditor>;

/** Name, URL identifier and brand colour of a gym. */
export default function CompanyIdentitySection({ editor }: { editor: Editor }) {
  const { fields, busy } = editor;
  return (
    <section className="space-y-4">
      <Input
        id="edit-company-name"
        label="Nombre"
        value={fields.name}
        onChange={(e) => fields.setName(e.target.value)}
      />
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
  );
}
