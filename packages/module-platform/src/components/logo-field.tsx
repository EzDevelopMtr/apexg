"use client";

import { Info, Sparkles, Upload } from "lucide-react";
import type { LogoPicker } from "../hooks/use-logo-picker";

const NOTE = "mt-1.5 flex items-start gap-1.5 text-xs";

function Notice({ picker }: { picker: LogoPicker }) {
  if (picker.notice === "cleared") {
    return (
      <p className={`${NOTE} text-body-soft`}>
        <Sparkles size={13} className="mt-px shrink-0 text-brand-ink" />
        <span>
          Le quitamos el fondo: la imagen no era transparente. Revisa la vista previa.{" "}
          {picker.restoreOriginal && (
            <button type="button" onClick={() => void picker.restoreOriginal?.()} className="font-semibold text-brand-ink transition-opacity active:opacity-60">
              Usar la original
            </button>
          )}
        </span>
      </p>
    );
  }
  if (picker.notice === "opaque") {
    return (
      <p className={`${NOTE} text-body-soft`}>
        <Info size={13} className="mt-px shrink-0" />
        Esta imagen no es transparente: se verá con su fondo. Si puedes, súbela en SVG o en PNG transparente.
      </p>
    );
  }
  return null;
}

/** Upload box for a gym's logo, and what the person should know about the one they picked. */
export default function LogoField({ picker, hasLogo }: { picker: LogoPicker; hasLogo: boolean }) {
  return (
    <>
      <label aria-busy={picker.working} className="mt-3.5 flex cursor-pointer items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-fill-3 p-3.5 text-[13px] text-body-soft transition-colors hover:border-brand hover:bg-fill-1">
        <Upload size={18} className="text-brand-ink" />
        <span>
          <b className="block font-semibold text-body">{picker.working ? "Preparando logo…" : hasLogo ? "Cambiar logo" : "Subir logo"}</b>
          SVG, PNG o WEBP · máximo 512 KB
        </span>
        <input type="file" accept="image/svg+xml,image/png,image/webp" disabled={picker.working} className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) void picker.pick(file); e.target.value = ""; }} />
      </label>
      {picker.problem && (
        <p role="alert" className={`${NOTE} text-danger-ink`}>
          <Info size={13} className="mt-px shrink-0" /> {picker.problem}
        </p>
      )}
      <Notice picker={picker} />
    </>
  );
}
