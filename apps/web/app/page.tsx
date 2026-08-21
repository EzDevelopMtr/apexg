import { redirect } from "next/navigation";


/*
  =====================================================
  RAIZ DEL SITIO  ( / )
  =====================================================

  La raiz no tiene pantalla propia: enviamos al
  selector de modulos.

  Si no hay sesion, el guardia de las rutas privadas
  redirigira al login.
*/

export default function Inicio() {

  redirect("/modulos");
}
