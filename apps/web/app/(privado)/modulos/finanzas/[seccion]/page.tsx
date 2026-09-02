import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esSeccionFinanzas, seccionesFinanzas, tituloSeccionFinanzas } from "@apexg/core";

import FinanzasSeccion from "../../../../../components/finanzas-seccion";

interface PaginaProps {
  params: Promise<{ seccion: string }>;
}

export function generateStaticParams() {
  return seccionesFinanzas.map((seccion) => ({ seccion: seccion.value }));
}

export async function generateMetadata({ params }: PaginaProps): Promise<Metadata> {
  const { seccion } = await params;
  return { title: `${tituloSeccionFinanzas(seccion)} | APEX GYM` };
}

export default async function PaginaSeccionFinanzas({ params }: PaginaProps) {
  const { seccion } = await params;
  if (!esSeccionFinanzas(seccion)) notFound();
  return <FinanzasSeccion seccion={seccion} />;
}
