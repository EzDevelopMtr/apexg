/*
  =====================================================
  CLASES DE UN ELEMENTO DE LA SIDEBAR
  =====================================================

  Vive en su propio archivo (y no junto a los
  componentes) porque mezclar componentes con
  funciones en un mismo modulo rompe el refresco
  automatico durante el desarrollo.

  Devolvemos las clases como texto para que la
  aplicacion pueda aplicarlas tanto a un <button>
  como a un enlace <Link> de Next.js.
*/

export function clasesItemSidebar(
  activo: boolean
): string {

  return `
    mb-2
    flex
    h-12
    w-full
    items-center
    rounded-xl
    px-3
    transition

    ${
      activo
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-white/10 hover:text-white"
    }
  `;
}
