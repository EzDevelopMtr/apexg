import type { ReactNode } from "react";

import type { ComponenteIcono } from "../iconos";


/*
  =====================================================
  CASCARON DE LA SIDEBAR
  =====================================================

  Este archivo contiene SOLO la apariencia.

  No sabe nada de rutas ni de Next.js, por eso los
  elementos de navegacion se le pasan como children.

  Comportamiento (igual que antes):

    - Contraida mide w-20
    - Al pasar el mouse se expande a w-72
    - Los textos aparecen con opacidad
*/


/*
  -----------------------------------------------------
  PROPIEDADES
  -----------------------------------------------------
*/

interface SidebarShellProps {

  // Titulo del modulo. Por ejemplo: CLIENTES
  titulo: string;

  // Texto pequeno debajo del titulo.
  subtitulo: string;

  // Icono del encabezado.
  icono: ComponenteIcono;

  // Elementos de navegacion.
  children: ReactNode;

  // Zona inferior (por ejemplo "Cambiar modulo").
  pie: ReactNode;
}


/*
  -----------------------------------------------------
  SIDEBAR
  -----------------------------------------------------
*/

export function SidebarShell({
  titulo,
  subtitulo,
  icono: Icono,
  children,
  pie,
}: SidebarShellProps) {


  return (

    <aside
      className="
        group
        fixed
        left-0
        top-0
        z-40
        h-screen
        w-20
        overflow-hidden
        bg-slate-950
        text-white
        transition-all
        duration-300
        hover:w-72
      "
    >

      <div className="flex h-full flex-col">


        {/* =================================================
            ENCABEZADO
        ================================================= */}

        <div className="flex h-20 items-center border-b border-white/10 px-5">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-600
            "
          >

            <Icono size={22} />

          </div>


          <div
            className="
              ml-4
              min-w-max
              opacity-0
              transition-opacity
              duration-200
              group-hover:opacity-100
            "
          >

            <p className="font-bold">
              {titulo}
            </p>

            <p className="text-xs text-slate-400">
              {subtitulo}
            </p>

          </div>

        </div>


        {/* =================================================
            OPCIONES
        ================================================= */}

        <nav className="flex-1 px-3 py-6">

          {children}

        </nav>


        {/* =================================================
            PIE
        ================================================= */}

        <div className="border-t border-white/10 p-3">

          {pie}

        </div>

      </div>

    </aside>
  );
}


/*
  =====================================================
  ETIQUETA DE UN ELEMENTO
  =====================================================

  El texto que aparece cuando la sidebar
  se expande.
*/

export function EtiquetaSidebar({
  children,
}: {
  children: ReactNode;
}) {

  return (

    <span
      className="
        ml-4
        min-w-max
        text-sm
        font-medium
        opacity-0
        transition-opacity
        duration-200
        group-hover:opacity-100
      "
    >
      {children}
    </span>

  );
}
