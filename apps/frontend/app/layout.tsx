import type { Metadata } from "next";

import type { ReactNode } from "react";

import { ProveedorSesion } from "../lib/auth";

import "./globals.css";


/*
  =====================================================
  LAYOUT RAIZ
  =====================================================

  Envuelve TODAS las paginas.

  Aqui vivia antes el <html> de index.html y el
  montaje de React de main.tsx. Next.js se encarga
  de ambas cosas.
*/

export const metadata: Metadata = {
  title: "APEX GYM",
  description: "Sistema de gestion para gimnasio",
  icons: {
    icon: "/favicon.svg",
  },
};


export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (

    <html lang="es">

      <body>

        {/*
          La sesion debe estar disponible tanto en
          el login como en las rutas privadas, por
          eso el proveedor se coloca aqui arriba.
        */}

        <ProveedorSesion>
          {children}
        </ProveedorSesion>

      </body>

    </html>

  );
}
