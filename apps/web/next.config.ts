import type { NextConfig } from "next";

/*
  =====================================================
  CONFIGURACION DE NEXT.JS
  =====================================================
*/

const nextConfig: NextConfig = {

  /*
    Los paquetes internos del monorepo se publican
    como TypeScript sin compilar, asi que le pedimos
    a Next.js que los transpile el mismo.

    Ventaja: al editar un paquete el cambio se ve
    de inmediato, sin pasos de build intermedios.
  */

  transpilePackages: [
    "@apexg/core",
    "@apexg/ui",
    "@apexg/modulo-clientes",
    "@apexg/modulo-membresias",
    "@apexg/modulo-pagos",
    "@apexg/modulo-inventario",
  ],
};

export default nextConfig;
