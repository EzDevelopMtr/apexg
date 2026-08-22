import { redirect } from "next/navigation";

import { seccionClientesPorDefecto } from "@apexg/core";


/*
  =====================================================
  RUTA  /modulos/clientes
  =====================================================

  Sin seccion no hay nada que mostrar, asi que
  enviamos a la seccion por defecto ("todos"),
  igual que hacia antes App.tsx.
*/

export default function PaginaClientes() {

  redirect(
    `/modulos/clientes/${seccionClientesPorDefecto}`
  );
}
