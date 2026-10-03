import type { IssuedCredential } from "@apexg/core";

export interface CredentialNoticeProps {
  credential: IssuedCredential;
  /** Where these credentials are used, e.g. "/apex-gym". */
  entrance: string;
}

/** Shown once: the server keeps only the hash. */
export default function CredentialNotice({ credential, entrance }: CredentialNoticeProps) {
  return (
    <div role="status" className="rounded-lg border border-brand/40 bg-brand-soft p-4 text-sm text-body">
      <p className="font-semibold">Entrégale estos datos al administrador del gimnasio.</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-body-soft">Entrada</dt>
        <dd className="font-mono">{entrance}</dd>
        <dt className="text-body-soft">Usuario</dt>
        <dd className="font-mono">{credential.username}</dd>
        <dt className="text-body-soft">Contraseña</dt>
        <dd className="select-all font-mono">{credential.password}</dd>
      </dl>
      <p className="mt-3 text-body-soft">
        La contraseña no se vuelve a mostrar. Si se pierde, restablécela desde el gimnasio.
      </p>
    </div>
  );
}
