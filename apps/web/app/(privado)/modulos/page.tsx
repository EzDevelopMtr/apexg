import type { Metadata } from "next";

import ModuleGrid from "../../../components/module-grid";


/*
  =====================================================
  RUTA  /modulos
  =====================================================

  Selector de modulos.
*/

export const metadata: Metadata = {
  title: "Modulos | APEX GYM",
};


export default function PaginaModulos() {

  return <ModuleGrid />;
}
