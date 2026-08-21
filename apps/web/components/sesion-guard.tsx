"use client";

/*
  =====================================================
  GUARDIA DE SESION
  =====================================================

  Reemplaza al "if (!isLoggedIn) return <Login />"
  que antes vivia en App.tsx.

  Envuelve a todas las rutas privadas: si no hay
  sesion, manda al login.

  RECORDATORIO: esta proteccion es solo de interfaz.
  La proteccion real debe hacerse en el servidor
  cuando exista el Backend.
*/

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import type { ReactNode } from "react";

import { useSesion } from "../lib/auth";


export default function SesionGuard({
  children,
}: {
  children: ReactNode;
}) {

  const { sesion, cargando } = useSesion();

  const router = useRouter();


  useEffect(() => {

    /*
      Mientras leemos sessionStorage no decidimos
      nada, para no expulsar a quien si tiene sesion.
    */

    if (!cargando && !sesion) {
      router.replace("/login");
    }

  }, [cargando, sesion, router]);


  /*
    Sin sesion no dibujamos el contenido privado.
  */

  if (cargando || !sesion) {
    return null;
  }


  return <>{children}</>;
}
