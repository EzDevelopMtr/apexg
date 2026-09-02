"use client";

/*
  RF-35 [PROPUESTA] es una funcionalidad orientada al
  Administrador (numeral 7.2 del ERS).
*/

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Dashboard from "./dashboard";
import { useSesion } from "../lib/auth";

export default function DashboardGuard() {
  const { sesion, cargando } = useSesion();
  const router = useRouter();

  const autorizado = sesion?.rol === "administrador";

  useEffect(() => {
    if (!cargando && sesion && !autorizado) {
      router.replace("/modulos");
    }
  }, [cargando, sesion, autorizado, router]);

  if (cargando || !sesion || !autorizado) {
    return null;
  }

  return <Dashboard />;
}
