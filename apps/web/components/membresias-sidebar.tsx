"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { seccionesMembresias } from "@apexg/core";
import { SidebarShell, clasesItemSidebar, EtiquetaSidebar, obtenerIcono } from "@apexg/ui";

export default function MembresiasSidebar() {
  const rutaActual = usePathname();

  return (
    <SidebarShell
      titulo="MEMBRESÍAS"
      subtitulo="APEX GYM"
      icono={obtenerIcono("tarjeta")}
      pie={<Link href="/modulos" className="flex h-12 w-full items-center rounded-xl px-3 text-slate-400 transition hover:bg-white/10 hover:text-white"><ArrowLeft size={21} className="shrink-0" /><EtiquetaSidebar>Cambiar módulo</EtiquetaSidebar></Link>}
    >
      {seccionesMembresias.map((seccion) => {
        const ruta = `/modulos/membresias/${seccion.id}`;
        const Icono = obtenerIcono(seccion.icono);
        const activa = rutaActual === ruta;
        return <Link key={seccion.id} href={ruta} aria-current={activa ? "page" : undefined} className={clasesItemSidebar(activa)}><Icono size={21} className="shrink-0" /><EtiquetaSidebar>{seccion.nombre}</EtiquetaSidebar></Link>;
      })}
    </SidebarShell>
  );
}
