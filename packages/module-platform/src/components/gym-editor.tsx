"use client";

import type { PlatformCompany } from "@apexg/core";
import { materialButton } from "@apexg/ui";
import type { CompanyActions } from "../hooks/use-company-editor";
import { useCompanyEditor } from "../hooks/use-company-editor";
import type { Notify } from "../hooks/use-toast";
import { addressPrefix } from "../gym-rules";
import { usePlatformLinks } from "../platform-context";
import BrandFields from "./brand-fields";
import GymIdentityHeader from "./gym-identity-header";
import GymStatusSection from "./gym-status-section";
import Section from "./section";
import TextField from "./text-field";
import UsersSection from "./users-section";

export interface GymEditorProps {
  readonly company: PlatformCompany;
  readonly takenSlugs: readonly string[];
  readonly logoSrc?: string;
  readonly actions: CompanyActions & { readonly reload: () => void };
  readonly notify: Notify;
  readonly onClose: () => void;
}

/** Everything about one gym, in one sheet: identity, brand, people and status. */
export default function GymEditor({ company, takenSlugs, logoSrc, actions, notify, onClose }: GymEditorProps) {
  const editor = useCompanyEditor(company, takenSlugs, actions, notify);
  const { gymLink } = usePlatformLinks();
  const done = (ok: boolean) => ok && onClose();

  return (
    <>
      <GymIdentityHeader company={company} link={gymLink(company.slug)} logoSrc={logoSrc} />

      <Section title="Identidad">
        <TextField id="gym-name" label="Nombre" value={editor.fields.name} onChange={editor.fields.setName} />
        <TextField
          id="gym-slug"
          label="Dirección de entrada"
          value={editor.fields.slug}
          onChange={editor.fields.setSlug}
          prefix={addressPrefix(gymLink(""))}
          mono
          error={editor.slugProblem}
          hint={gymLink(editor.fields.slug)}
          confirmed
        />
      </Section>

      <Section title="Marca">
        <BrandFields
          name={editor.fields.name}
          color={editor.fields.color}
          onPick={editor.fields.pickColor}
          problem={editor.colorProblem}
          logoSrc={logoSrc}
          onLogo={(file) => void editor.uploadLogo(file)}
          logoProblem={editor.logoProblem}
        />
      </Section>

      <UsersSection company={company} notify={notify} onChanged={actions.reload} />

      <GymStatusSection status={company.status} busy={editor.busy} onToggle={() => void editor.toggleStatus().then(done)} />

      {editor.error && (
        <p role="alert" className="mt-4 text-sm text-danger-ink">
          {editor.error}
        </p>
      )}

      <div className="sticky -bottom-[22px] -mx-[22px] mt-6 flex justify-end gap-2.5 bg-gradient-to-t from-panel from-60% to-transparent px-[22px] pb-[18px] pt-6">
        <button type="button" onClick={onClose} className={materialButton("tinted")}>
          Cancelar
        </button>
        <button type="button" disabled={editor.busy || Boolean(editor.slugProblem)} onClick={() => void editor.save().then(done)} className={materialButton("primary")}>
          Guardar cambios
        </button>
      </div>
    </>
  );
}
