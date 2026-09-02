import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esSeccionEntrenadores, seccionesEntrenadores, tituloSeccionEntrenadores } from "@apexg/core";
import { Entrenadores } from "@apexg/modulo-entrenadores";

interface PaginaProps {
  params: Promise<{ seccion: string }>;
}

export function generateStaticParams() {
  return seccionesEntrenadores.map((seccion) => ({ seccion: seccion.id }));
}

export async function generateMetadata({ params }: PaginaProps): Promise<Metadata> {
  const { seccion } = await params;
  return { title: `${tituloSeccionEntrenadores(seccion)} | APEX GYM` };
}

export default async function PaginaSeccionEntrenadores({ params }: PaginaProps) {
  const { seccion } = await params;
  if (!esSeccionEntrenadores(seccion)) notFound();
  return <Entrenadores activeSection={seccion} />;
}
