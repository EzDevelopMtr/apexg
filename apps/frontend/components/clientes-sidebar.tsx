"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { seccionesClientes } from "@apexg/core";

import {
  SidebarShell,
  clasesItemSidebar,
  EtiquetaSidebar,
  obtenerIcono,
} from "@apexg/ui";


/*
  =====================================================
  SIDEBAR DEL MODULO CLIENTES
  =====================================================

  Es la misma sidebar de antes, con dos cambios:

    1. Cada opcion es un enlace a su propia URL,
       en lugar de un boton que cambiaba un estado.

    2. La opcion activa se deduce de la direccion
       actual (usePathname), no de una propiedad
       activeSection que venia de App.tsx.
*/

export default function ClientesSidebar() {

  /*
    Direccion actual. Por ejemplo:

      /modulos/clientes/activos
  */

  const rutaActual = usePathname();


  return (

    <SidebarShell
      titulo="CLIENTES"
      subtitulo="APEX GYM"
      icono={obtenerIcono("usuarios")}

      /* =================================================
          VOLVER AL SELECTOR
      ================================================= */

      pie={
        <Link
          href="/modulos"
          className="
            flex
            h-12
            w-full
            items-center
            rounded-xl
            px-3
            text-slate-400
            transition
            hover:bg-white/10
            hover:text-white
          "
        >

          <ArrowLeft
            size={21}
            className="shrink-0"
          />

          <EtiquetaSidebar>
            Cambiar modulo
          </EtiquetaSidebar>

        </Link>
      }
    >

      {/* =================================================
          OPCIONES
      ================================================= */}

      {seccionesClientes.map((seccion) => {

        const Icono = obtenerIcono(seccion.icono);

        const ruta = `/modulos/clientes/${seccion.id}`;

        const activa = rutaActual === ruta;


        return (

          <Link
            key={seccion.id}
            href={ruta}
            aria-current={activa ? "page" : undefined}
            className={clasesItemSidebar(activa)}
          >

            <Icono
              size={21}
              className="shrink-0"
            />

            <EtiquetaSidebar>
              {seccion.nombre}
            </EtiquetaSidebar>

          </Link>

        );

      })}

    </SidebarShell>
  );
}
