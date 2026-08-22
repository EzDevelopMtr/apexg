import type { ReactNode } from "react";

import { ModuleLayout } from "@apexg/ui";

import ClientesSidebar from "../../../../components/clientes-sidebar";


/*
  =====================================================
  LAYOUT DEL MODULO CLIENTES
  =====================================================

  Todo lo que este bajo /modulos/clientes comparte
  esta sidebar.

  Ventaja frente al App.tsx anterior: al cambiar de
  seccion la sidebar NO se vuelve a montar, solo
  cambia el contenido.
*/

export default function LayoutClientes({
  children,
}: {
  children: ReactNode;
}) {

  return (

    <ModuleLayout sidebar={<ClientesSidebar />}>
      {children}
    </ModuleLayout>

  );
}
