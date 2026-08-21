import type { Metadata } from "next";

import LoginForm from "../../components/login-form";


/*
  =====================================================
  RUTA  /login
  =====================================================
*/

export const metadata: Metadata = {
  title: "Iniciar sesion | APEX GYM",
};


export default function PaginaLogin() {

  return <LoginForm />;
}
