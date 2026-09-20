/** Classes for a sidebar navigation item. Extracted so links and buttons match. */
export function sidebarItemClasses(active: boolean): string {
  // The active item takes the BRAND, not the module accent: on this rail the
  // accent already says which module you are in, so reusing it here would stop
  // "current section" from reading as a separate fact.
  return `
    mb-2 flex h-12 w-full items-center rounded-xl px-3 transition
    ${
      active
        ? "bg-brand text-brand-contrast"
        : "text-shell-muted hover:bg-panel/10 hover:text-body"
    }
  `;
}
