import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esSeccionPagos, seccionesPagos, tituloSeccionPagos } from "@apexg/core";
import { Pagos } from "@apexg/modulo-pagos";

interface PaginaProps {
  params: Promise<{ seccion: string }>;
}

export function generateStaticParams() {
  return seccionesPagos.map((seccion) => ({ seccion: seccion.id }));
}

export async function generateMetadata({ params }: PaginaProps): Promise<Metadata> {
  const { seccion } = await params;
  return { title: `${tituloSeccionPagos(seccion)} | APEX GYM` };
}

export default async function PaginaSeccionPagos({ params }: PaginaProps) {
  const { seccion } = await params;
  if (!esSeccionPagos(seccion)) notFound();
  return <Pagos activeSection={seccion} />;
}
