"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { seccionesFinanzas, seccionesFinanzasPorRol } from "@apexg/core";
import { SidebarShell, clasesItemSidebar, EtiquetaSidebar, obtenerIcono } from "@apexg/ui";

import { useSesion } from "../lib/auth";

export default function FinanzasSidebar() {
  const rutaActual = usePathname();
  const { sesion } = useSesion();

  const permitidas = sesion ? seccionesFinanzasPorRol[sesion.rol] : [];
  const secciones = seccionesFinanzas.filter((seccion) => permitidas.includes(seccion.value));

  return (
    <SidebarShell
      titulo="FINANZAS"
      subtitulo="APEX GYM"
      icono={obtenerIcono("grafico")}
      pie={
        <Link
          href="/modulos"
          className="flex h-12 w-full items-center rounded-xl px-3 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={21} className="shrink-0" />
          <EtiquetaSidebar>Cambiar módulo</EtiquetaSidebar>
        </Link>
      }
    >
      {secciones.map((seccion) => {
        const ruta = `/modulos/finanzas/${seccion.value}`;
        const Icono = obtenerIcono(seccion.icono);
        const activa = rutaActual === ruta;

        return (
          <Link
            key={seccion.value}
            href={ruta}
            aria-current={activa ? "page" : undefined}
            className={clasesItemSidebar(activa)}
          >
            <Icono size={21} className="shrink-0" />
            <EtiquetaSidebar>{seccion.label}</EtiquetaSidebar>
          </Link>
        );
      })}
    </SidebarShell>
  );
}
