/** Clases de una pestaña. Aparte para que enlaces y botones coincidan. */
export function topBarTabClasses(active: boolean): string {
  // La activa toma el color de MARCA, no el acento del módulo: aquí "en qué
  // sección estás" tiene que leerse como un dato aparte del módulo.
  return `
    flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3
    text-sm font-medium transition
    ${
      active
        ? "bg-brand text-brand-contrast"
        : "text-shell-muted hover:bg-panel/10 hover:text-body"
    }
  `;
}
