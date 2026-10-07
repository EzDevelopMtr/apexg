"use client";

import { Check, Copy } from "lucide-react";
import { useCopy } from "../hooks/use-copy";

export interface CopyButtonProps {
  readonly value: string;
  /** What gets copied, in Spanish: "Copiar contraseña". */
  readonly label: string;
}

/** Copies on click and confirms in place, so nothing else needs to move. */
export default function CopyButton({ value, label }: CopyButtonProps) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={copied ? "Copiado" : label}
      title={copied ? "Copiado" : label}
      className="grid size-[30px] shrink-0 place-items-center rounded-lg text-brand-ink transition-[transform,background-color] duration-100 ease-out hover:bg-fill-2 active:scale-90"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}
