/*
  =====================================================
  CLAVES DE ALMACENAMIENTO LOCAL
  =====================================================

  Mientras no exista Backend, los distintos modulos
  comparten datos (por ejemplo Entrenadores necesita
  leer los Clientes, y Finanzas necesita leer Pagos,
  Egresos y Clientes) a traves de localStorage.

  Centralizar las claves aqui evita typos entre
  paquetes distintos.
*/

export const CLAVES_ALMACENAMIENTO = {
  clientes: "apexg:clientes",
  pagos: "apexg:pagos",
  planesMembresia: "apexg:planes-membresia",
  entrenadores: "apexg:entrenadores",
  comisiones: "apexg:comisiones",
  egresos: "apexg:egresos",
  categoriasEgreso: "apexg:categorias-egreso",
  inventario: "apexg:inventario",
  novedadesDiarias: "apexg:novedades-diarias",
  observacionesCierre: "apexg:observaciones-cierre",
} as const;
