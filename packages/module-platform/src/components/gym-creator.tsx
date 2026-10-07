"use client";

import { Check, Info, KeyRound } from "lucide-react";
import { materialButton } from "@apexg/ui";
import { addressPrefix } from "../gym-rules";
import { useCompanyForm } from "../hooks/use-company-form";
import type { CreatedGym, CreatorActions } from "../hooks/use-company-form";
import { usePlatformLinks } from "../platform-context";
import BrandFields from "./brand-fields";
import CredentialCard from "./credential-card";
import GymAvatar from "./gym-avatar";
import Section from "./section";
import TextField from "./text-field";

export interface GymCreatorProps {
  readonly actions: CreatorActions;
  readonly takenSlugs: readonly string[];
  readonly onClose: () => void;
  readonly onAnother: () => void;
}

function Created({ gym, onClose, onAnother }: { gym: CreatedGym; onClose: () => void; onAnother: () => void }) {
  const link = usePlatformLinks().gymLink(gym.slug);
  return (
    <>
      <div className="mb-3 mt-1.5 grid size-14 animate-materialize place-items-center rounded-full bg-brand-soft text-brand-ink motion-reduce:animate-none">
        <Check size={26} />
      </div>
      <div className="flex items-center gap-4">
        <GymAvatar name={gym.name} color={gym.color} logoSrc={gym.logoSrc} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-[22px] font-bold leading-tight tracking-[-0.015em]">{gym.name} ya existe</div>
          <span className="font-mono text-xs text-body-faint">/{gym.slug}</span>
        </div>
      </div>
      {gym.logoFailed && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 text-xs text-danger-ink">
          <Info size={13} className="mt-px shrink-0" /> El gimnasio quedó creado, pero el logo no se subió: {gym.logoFailed} Súbelo desde Editar → Marca.
        </p>
      )}
      <CredentialCard credential={gym.credential} link={link} recipient="al administrador" />
      <div className="mt-6 flex justify-end gap-2.5">
        <button type="button" onClick={onAnother} className={materialButton("tinted")}>Crear otro</button>
        <button type="button" onClick={onClose} className={materialButton("primary")}>Listo</button>
      </div>
    </>
  );
}

/** New gym: name and address, colour and logo, and its first administrator. */
export default function GymCreator({ actions, takenSlugs, onClose, onAnother }: GymCreatorProps) {
  const form = useCompanyForm(actions, takenSlugs);
  const { gymLink } = usePlatformLinks();
  if (form.created) return <Created gym={form.created} onClose={onClose} onAnother={onAnother} />;

  return (
    <>
      <Section title="Gimnasio">
        <TextField id="new-gym-name" label="Nombre" value={form.values.name} onChange={(v) => form.set("name", v)} placeholder="Ej. Ñandú Fit Centro" />
        <TextField id="new-gym-slug" label="Dirección de entrada" value={form.values.slug} onChange={form.setSlug} prefix={addressPrefix(gymLink(""))} mono placeholder="nandu-fit-centro" error={form.slugProblem} hint={form.values.slug ? gymLink(form.values.slug) : undefined} confirmed />
      </Section>
      <Section title="Marca">
        <BrandFields name={form.values.name} color={form.color} onPick={form.pickColor} problem={form.colorProblem} logoSrc={form.logo.preview} logo={form.logo.picker} />
      </Section>
      <Section title="Primer administrador" help="Después puedes agregar más usuarios desde Editar → Usuarios.">
        <TextField id="new-gym-admin" label="Usuario" value={form.values.adminUsername} onChange={(v) => form.set("adminUsername", v)} prefix="@" mono placeholder="admin" />
        <TextField id="new-gym-admin-name" label="Nombre completo" value={form.values.adminFullName} onChange={(v) => form.set("adminFullName", v)} placeholder="Nombre y apellido" />
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-body-faint">
          <KeyRound size={13} /> La contraseña se genera al crear el gimnasio.
        </p>
      </Section>
      <p className="mt-3.5 text-xs text-body-faint">Arranca con los 9 planes base como plantilla; el gimnasio los edita después.</p>
      {form.error && <p role="alert" className="mt-3 text-sm text-danger-ink">{form.error}</p>}
      <div className="sticky -bottom-[22px] -mx-[22px] mt-6 flex justify-end gap-2.5 bg-gradient-to-t from-panel from-60% to-transparent px-[22px] pb-[18px] pt-6">
        <button type="button" onClick={onClose} className={materialButton("tinted")}>Cancelar</button>
        <button type="button" disabled={form.submitting || form.logo.picker.working} onClick={() => void form.submit()} className={materialButton("primary")}>
          {form.submitting ? "Creando…" : "Crear gimnasio"}
        </button>
      </div>
    </>
  );
}
