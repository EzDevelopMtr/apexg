import type { Metadata } from "next";

import Dashboard from "../../../components/dashboard";


/*
  =====================================================
  RUTA  /dashboard
  =====================================================

  Esta pantalla ya existia en el proyecto pero no
  estaba conectada a ninguna parte del flujo.

  Le damos su propia ruta para que se pueda ver
  y seguir construyendo. Todavia no aparece en el
  selector de modulos.
*/

export const metadata: Metadata = {
  title: "Dashboard | APEX GYM",
};


export default function PaginaDashboard() {

  return <Dashboard />;
}
