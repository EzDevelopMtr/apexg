import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esSeccionMembresias, seccionesMembresias, tituloSeccionMembresias } from "@apexg/core";
import { Membresias } from "@apexg/modulo-membresias";

interface PaginaProps {
  params: Promise<{ seccion: string }>;
}

export function generateStaticParams() {
  return seccionesMembresias.map((seccion) => ({ seccion: seccion.id }));
}

export async function generateMetadata({ params }: PaginaProps): Promise<Metadata> {
  const { seccion } = await params;
  return { title: `${tituloSeccionMembresias(seccion)} | APEX GYM` };
}

export default async function PaginaSeccionMembresias({ params }: PaginaProps) {
  const { seccion } = await params;
  if (!esSeccionMembresias(seccion)) notFound();
  return <Membresias activeSection={seccion} />;
}
