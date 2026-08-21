import { notFound } from "next/navigation";

import type { Metadata } from "next";

import {
  esSeccionClientes,
  seccionesClientes,
  tituloSeccionClientes,
} from "@apexg/core";

import { Clientes } from "@apexg/modulo-clientes";


/*
  =====================================================
  RUTA  /modulos/clientes/[seccion]
  =====================================================

  Secciones validas:

    todos
    agregar
    activos
    por-vencer
    vencidos

  Antes esto era el estado "activeSection".
  Ahora es un segmento de la URL, asi que cada
  seccion se puede compartir y recargar.
*/


/*
  -----------------------------------------------------
  PROPIEDADES DE LA PAGINA
  -----------------------------------------------------

  En Next.js los parametros de la ruta llegan
  como una promesa.
*/

interface PaginaProps {
  params: Promise<{ seccion: string }>;
}


/*
  -----------------------------------------------------
  SECCIONES CONOCIDAS
  -----------------------------------------------------

  Le decimos a Next.js cuales existen para que
  pueda prepararlas de antemano.
*/

export function generateStaticParams() {

  return seccionesClientes.map((seccion) => ({
    seccion: seccion.id,
  }));
}


/*
  -----------------------------------------------------
  TITULO DE LA PESTANA
  -----------------------------------------------------
*/

export async function generateMetadata({
  params,
}: PaginaProps): Promise<Metadata> {

  const { seccion } = await params;

  if (!esSeccionClientes(seccion)) {
    return { title: "Clientes | APEX GYM" };
  }

  return {
    title: `${tituloSeccionClientes(seccion)} | APEX GYM`,
  };
}


/*
  -----------------------------------------------------
  PAGINA
  -----------------------------------------------------
*/

export default async function PaginaSeccionClientes({
  params,
}: PaginaProps) {

  const { seccion } = await params;


  /*
    Si alguien escribe una seccion inventada
    en la URL, mostramos 404.
  */

  if (!esSeccionClientes(seccion)) {
    notFound();
  }


  return <Clientes activeSection={seccion} />;
}
