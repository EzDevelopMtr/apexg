/** Shared border, spacing and focus treatment for every form control. */
export function controlClasses(invalid: boolean, extra = ""): string {
  return [
    "w-full rounded-xl border bg-panel py-3 text-body outline-none",
    "transition placeholder:text-body-faint",
    "focus:border-brand focus:ring-2 focus:ring-brand-soft",
    "disabled:cursor-not-allowed disabled:bg-surface",
    invalid ? "border-danger-line" : "border-line",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
