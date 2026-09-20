"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Moves focus to the first control a failed submit marked invalid.
 *
 * Without it, submitting a long form inside a modal looks like nothing
 * happened: the messages render beside fields that are scrolled out of sight,
 * and the button gives no other answer.
 *
 * The control is found by `aria-invalid` in DOM order, not by reading the
 * error object. So "first" means first on screen rather than first inserted,
 * and no convention tying field names to element ids has to be kept in step.
 */
export function useFirstInvalidFocus() {
  const formRef = useRef<HTMLFormElement>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0) return;

    // An effect rather than a call inside the handler: this runs after the
    // commit that rendered the messages, so the flags read here are current.
    const invalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    );
    invalid?.focus();
    invalid?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [attempt]);

  return {
    formRef,
    /** Call when a submit was rejected by validation. */
    reportInvalid: () => setAttempt((count) => count + 1),
  };
}
