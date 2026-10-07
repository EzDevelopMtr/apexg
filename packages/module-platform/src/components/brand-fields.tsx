"use client";

import { Info, Upload } from "lucide-react";
import { deriveBrandPalette, isHexColor } from "@apexg/core";
import GymAvatar from "./gym-avatar";

/** Presets in the cool half of the wheel: red, amber and green belong to the client states. */
const SWATCHES = [
  ["#306e9d", "Azul"],
  ["#3987e5", "Océano"],
  ["#0e9aa7", "Turquesa"],
  ["#4f46e5", "Índigo"],
  ["#7c3aed", "Violeta"],
  ["#c026d3", "Magenta"],
  ["#6b7280", "Grafito"],
] as const;

/** "Otro color": a wheel made of the presets themselves. */
const WHEEL = { background: `conic-gradient(${[...SWATCHES.map(([hex]) => hex), SWATCHES[0][0]].join(", ")})` };

export interface BrandFieldsProps {
  readonly name: string;
  readonly color: string | null;
  readonly onPick: (color: string | null) => void;
  readonly problem: string | null;
  readonly logoSrc?: string;
  readonly onLogo: (file: File) => void;
  readonly logoProblem?: string | null;
}

const RING = "shadow-[0_0_0_2px_var(--color-panel),0_0_0_4px_var(--color-body)]";
const SWATCH = "size-[30px] rounded-full shadow-tile transition-[transform,box-shadow] duration-100 ease-out active:scale-90";

/** Colour and logo, with a live sample of the gym's own sign-in button. */
export default function BrandFields({ name, color, onPick, problem, logoSrc, onLogo, logoProblem }: BrandFieldsProps) {
  const palette = color && isHexColor(color) ? deriveBrandPalette(color) : undefined;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Color de marca">
        {SWATCHES.map(([hex, label]) => (
          <button key={hex} type="button" title={label} aria-label={label} aria-pressed={color === hex} onClick={() => onPick(hex)} style={{ background: hex }} className={`${SWATCH} ${color === hex ? RING : ""}`} />
        ))}
        <label title="Otro color" style={WHEEL} className={`${SWATCH} relative cursor-pointer`}>
          <input type="color" aria-label="Otro color" value={color ?? "#306e9d"} onChange={(e) => onPick(e.target.value.toLowerCase())} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <button type="button" aria-pressed={color === null} onClick={() => onPick(null)} className={`h-[30px] rounded-full bg-fill-2 px-2.5 text-xs font-semibold transition-transform duration-100 active:scale-95 ${color === null ? "text-body shadow-[inset_0_0_0_1px_var(--color-body)]" : "text-body-soft"}`}>
          Por defecto
        </button>
      </div>
      {problem && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-danger-ink">
          <Info size={13} /> {problem}
        </p>
      )}

      <div className="mt-3.5 flex items-center gap-3 rounded-xl bg-canvas p-3" aria-label="Así se ve el ingreso del gimnasio">
        <GymAvatar name={name || "?"} color={color} logoSrc={logoSrc} size="sm" />
        <span style={palette ? { background: palette["--color-brand"], color: palette["--color-brand-contrast"] } : undefined} className={`grid h-9 flex-1 place-items-center rounded-[10px] text-[13px] font-semibold transition-colors duration-200 ${palette ? "" : "bg-brand text-brand-contrast"}`}>
          Ingresar
        </span>
        <span style={palette ? { color: palette["--color-brand-ink"] } : undefined} className={`text-[13px] font-semibold ${palette ? "" : "text-brand-ink"}`}>
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <label className="mt-3.5 flex cursor-pointer items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-fill-3 p-3.5 text-[13px] text-body-soft transition-colors hover:border-brand hover:bg-fill-1">
        <Upload size={18} className="text-brand-ink" />
        <span>
          <b className="block font-semibold text-body">{logoSrc ? "Cambiar logo" : "Subir logo"}</b>
          SVG, PNG o WEBP · máximo 512 KB
        </span>
        <input type="file" accept="image/svg+xml,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) onLogo(file); e.target.value = ""; }} />
      </label>
      {logoProblem && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-danger-ink">
          <Info size={13} /> {logoProblem}
        </p>
      )}
    </>
  );
}
