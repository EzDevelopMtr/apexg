import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esSeccionInventario, seccionesInventario, tituloSeccionInventario } from "@apexg/core";
import { Inventario } from "@apexg/modulo-inventario";

interface PaginaProps {
  params: Promise<{ seccion: string }>;
}

export function generateStaticParams() {
  return seccionesInventario.map((seccion) => ({ seccion: seccion.id }));
}

export async function generateMetadata({ params }: PaginaProps): Promise<Metadata> {
  const { seccion } = await params;
  return { title: `${tituloSeccionInventario(seccion)} | APEX GYM` };
}

export default async function PaginaSeccionInventario({ params }: PaginaProps) {
  const { seccion } = await params;
  if (!esSeccionInventario(seccion)) notFound();
  return <Inventario activeSection={seccion} />;
}
