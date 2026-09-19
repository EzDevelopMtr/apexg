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
