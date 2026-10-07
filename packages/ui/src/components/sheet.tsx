"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useDismissable } from "../hooks/use-dismissable";
import { materialButton } from "./material-button-classes";

export interface SheetProps {
  readonly open: boolean;
  /** User-facing title, in Spanish. */
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

/*
  Enters and leaves along the same path: from the right on a wide screen,
  from the bottom on a narrow one. The transition is CSS, so closing it
  halfway simply reverses from where it is.
*/
const PANEL = [
  "fixed z-50 flex flex-col bg-panel/85 shadow-sheet backdrop-blur-[40px] backdrop-saturate-[1.6]",
  "transition-transform duration-600 ease-spring",
  "md:bottom-3 md:right-3 md:top-3 md:w-[min(480px,calc(100vw-24px))] md:rounded-[22px]",
  "max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[92vh] max-md:rounded-t-[22px]",
  "transparency-reduce:bg-panel transparency-reduce:backdrop-blur-none contrast-more:border contrast-more:border-body-faint",
  "motion-reduce:transition-opacity motion-reduce:duration-200",
].join(" ");

const CLOSED = "md:translate-x-[calc(100%+28px)] max-md:translate-y-full motion-reduce:translate-none motion-reduce:opacity-0";

/** A modal side sheet: the page behind dims and steps back (see `pushedBack`). */
export default function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  const panel = useDismissable(open, onClose);

  return (
    <>
      <div
        aria-hidden
        onPointerDown={onClose}
        className={`fixed inset-0 z-40 bg-scrim transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        inert={!open}
        className={`${PANEL} ${open ? "" : CLOSED}`}
      >
        <header className="flex items-center justify-between gap-3 pb-2.5 pl-[22px] pr-[18px] pt-[18px]">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" data-autofocus className={`${materialButton("tinted", "icon")} text-body-soft`}>
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-[22px] pb-[22px] pt-1.5">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2.5 bg-gradient-to-t from-panel from-60% to-transparent px-[22px] pb-[18px] pt-3.5">
            {footer}
          </footer>
        )}
      </aside>
    </>
  );
}
