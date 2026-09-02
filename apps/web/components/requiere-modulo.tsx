"use client";

/*
  =====================================================
  GUARDIA DE MODULO POR ROL (RNF-03)
  =====================================================

  Cada modulo debe validar el rol del usuario
  autenticado antes de permitir el acceso, conforme
  a la matriz de permisos (numeral 2.2 del ERS).

  Si el rol de la sesion actual no tiene acceso al
  modulo, se envia de vuelta al selector de modulos.
*/

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { puedeAccederModulo } from "@apexg/core";

import { useSesion } from "../lib/auth";

export default function RequiereModulo({
  moduloId,
  children,
}: {
  moduloId: string;
  children: ReactNode;
}) {
  const { sesion, cargando } = useSesion();
  const router = useRouter();

  const autorizado = sesion ? puedeAccederModulo(sesion.rol, moduloId) : false;

  useEffect(() => {
    if (!cargando && sesion && !autorizado) {
      router.replace("/modulos");
    }
  }, [cargando, sesion, autorizado, router]);

  if (cargando || !sesion || !autorizado) {
    return null;
  }

  return <>{children}</>;
}
