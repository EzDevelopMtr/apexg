/** Classes for a sidebar navigation item. Extracted so links and buttons match. */
export function sidebarItemClasses(active: boolean): string {
  return `
    mb-2 flex h-12 w-full items-center rounded-xl px-3 transition
    ${
      active
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-white/10 hover:text-white"
    }
  `;
}
