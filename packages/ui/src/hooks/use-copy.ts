"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Clipboard write plus a short "copied" flag for the button that did it. */
export function useCopy(resetAfterMs = 1400) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    (value: string) => {
      void navigator.clipboard?.writeText(value).catch(() => undefined);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { copied, copy };
}
