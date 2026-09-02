"use client";

/*
  =====================================================
  SECCION DE FINANZAS SEGUN ROL
  =====================================================

  Recepcionista solo puede ver "Apartado diario"
  (numeral 2.2 del ERS); el resto de secciones de
  Finanzas son exclusivas de Administrador.
*/

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { puedeVerSeccionFinanzas, seccionFinanzasPorDefectoParaRol } from "@apexg/core";
import { Finanzas } from "@apexg/modulo-finanzas";

import { useSesion } from "../lib/auth";

export default function FinanzasSeccion({ seccion }: { seccion: string }) {
  const { sesion, cargando } = useSesion();
  const router = useRouter();

  const autorizado = sesion ? puedeVerSeccionFinanzas(sesion.rol, seccion) : false;

  useEffect(() => {
    if (!cargando && sesion && !autorizado) {
      router.replace(`/modulos/finanzas/${seccionFinanzasPorDefectoParaRol(sesion.rol)}`);
    }
  }, [cargando, sesion, autorizado, router]);

  if (cargando || !sesion || !autorizado) {
    return null;
  }

  return <Finanzas activeSection={seccion} />;
}
