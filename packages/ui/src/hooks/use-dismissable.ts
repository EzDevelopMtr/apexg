"use client";

import { useEffect, useRef } from "react";

/**
 * Focus and Escape for a modal surface: on open, focus moves to the first
 * field (or the close button) and Escape closes; on close, focus goes back
 * to whatever opened it, so a keyboard user is never left on a hidden node.
 */
export function useDismissable(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>("input, select, textarea, [data-autofocus]");
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
