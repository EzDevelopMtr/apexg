"use client";

import { useEffect, useRef } from "react";

/**
 * Focus and Escape for a modal surface: on open, focus moves to the element
 * marked `data-autofocus` (the close button) — inside the sheet, without
 * popping a phone's keyboard over half of it. Escape closes; on close, focus
 * goes back to whatever opened it, so a keyboard user is never left on a
 * hidden node.
 */
export function useDismissable(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>("[data-autofocus]");
      target?.focus({ preventScroll: true });
    }, 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  return panel;
}
