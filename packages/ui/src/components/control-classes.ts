/** Shared border, spacing and focus treatment for every form control. */
export function controlClasses(invalid: boolean, extra = ""): string {
  return [
    // `surface` rather than `panel`: a control sits INSIDE a panel, so it has
    // to be a step lighter than the card it lives on to read as recessed.
    "w-full rounded-xl border bg-surface py-3 text-body outline-none",
    "transition placeholder:text-body-faint",
    "focus:border-brand focus:ring-2 focus:ring-brand-soft",
    "disabled:cursor-not-allowed disabled:bg-panel disabled:text-body-faint",
    invalid ? "border-danger-line" : "border-line",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Id of a control's error message, or nothing when there is no error to point at. */
export function errorId(
  id: string | undefined,
  error: string | undefined,
): string | undefined {
  return id && error ? `${id}-error` : undefined;
}

/**
 * Joins the error message onto whatever the caller already described the
 * control with, rather than replacing it — a field can carry both a standing
 * hint and a validation message, and overwriting would silence the hint.
 */
export function describedBy(
  ownErrorId: string | undefined,
  callerValue: string | undefined,
): string | undefined {
  return [callerValue, ownErrorId].filter(Boolean).join(" ") || undefined;
}
