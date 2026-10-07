import type { IssuedCredential } from "@apexg/core";
import { CopyButton } from "@apexg/ui";

export interface CredentialCardProps {
  readonly credential: IssuedCredential;
  /** The gym's full public address, where these credentials are used. */
  readonly link: string;
  /** Who receives them, in Spanish: "al administrador", "a Ana Ruiz". */
  readonly recipient: string;
}

/** Shown once: the server keeps only the hash. Each value copies on its own. */
export default function CredentialCard({ credential, link, recipient }: CredentialCardProps) {
  const lines: readonly [string, string][] = [
    ["Entrada", link],
    ["Usuario", credential.username],
    ["Contraseña", credential.password],
  ];
  return (
    <div className="mt-3 animate-materialize rounded-[14px] bg-brand-soft p-3.5 motion-reduce:animate-none">
      <p className="mb-2.5 text-[13px] text-body-muted">
        Entrégale estos datos {recipient}. La contraseña <b className="text-body">no se vuelve a mostrar</b>.
      </p>
      {lines.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[10px] bg-shell/40 px-2.5 py-2 [&+&]:mt-1.5">
          <span className="text-xs text-body-soft">{label}</span>
          <code className="select-all break-all font-mono text-sm text-body">{value}</code>
          <CopyButton value={value} label={`Copiar ${label.toLowerCase()}`} />
        </div>
      ))}
    </div>
  );
}
