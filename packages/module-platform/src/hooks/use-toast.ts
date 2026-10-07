"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Reports what just happened; with `undo`, the toast offers to revert it. */
export type Notify = (message: string, undo?: () => unknown) => void;

interface ToastState {
  readonly visible: boolean;
  readonly message: string;
  readonly undo?: () => unknown;
}

/** One toast at a time; a new one replaces the last. Undo stays up longer. */
export function useToast() {
  const [state, setState] = useState<ToastState>({ visible: false, message: "" });
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hide = useCallback(() => setState((current) => ({ ...current, visible: false })), []);

  const notify = useCallback<Notify>(
    (message, undo) => {
      setState({ visible: true, message, undo });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(hide, undo ? 5000 : 1800);
    },
    [hide],
  );

  // An undo can fail (another gym took the address meanwhile, the last admin
  // rule…): then the toast says why instead of failing silently.
  const undo = state.undo;
  const onUndo = undo
    ? () => {
        hide();
        void Promise.resolve()
          .then(undo)
          .catch((cause: unknown) => notify(cause instanceof Error ? cause.message : "No se pudo deshacer."));
      }
    : undefined;

  return { toast: { visible: state.visible, message: state.message, onUndo }, notify };
}
