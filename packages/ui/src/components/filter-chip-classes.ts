/** Clases de una opción de filtro. Aparte para que enlaces y botones coincidan. */
export function filterChipClasses(active: boolean): string {
  return `
    inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm
    font-medium transition
    ${
      active
        ? "border-brand bg-brand-soft text-brand-ink"
        : "border-line text-body-soft hover:border-brand hover:text-body"
    }
  `;
}
