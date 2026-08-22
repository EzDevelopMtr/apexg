import type { ReactNode } from "react";

import SesionGuard from "../../components/sesion-guard";


/*
  =====================================================
  LAYOUT DE LAS RUTAS PRIVADAS
  =====================================================

  El nombre de la carpeta va entre parentesis:

    (privado)

  Eso significa que NO aparece en la URL. Solo
  sirve para agrupar rutas que comparten algo.

  Aqui lo que comparten es que exigen sesion.
*/

export default function LayoutPrivado({
  children,
}: {
  children: ReactNode;
}) {

  return (

    <SesionGuard>
      {children}
    </SesionGuard>

  );
}
