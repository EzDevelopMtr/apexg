/** Shared border, spacing and focus treatment for every form control. */
export function controlClasses(invalid: boolean, extra = ""): string {
  return [
    "w-full rounded-xl border bg-white py-3 text-slate-900 outline-none",
    "transition placeholder:text-slate-400",
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
    "disabled:cursor-not-allowed disabled:bg-slate-50",
    invalid ? "border-red-300" : "border-slate-200",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
