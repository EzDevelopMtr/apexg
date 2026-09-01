/*
  =====================================================
  PUNTO DE ENTRADA DE @apexg/core
  =====================================================

  Este paquete NO depende de React ni de Next.js.

  Solamente contiene:

    - Tipos del dominio (Cliente, Modulo, ...)
    - Datos de prueba
    - Catalogo de modulos y secciones

  Cualquier aplicacion del monorepo puede
  importarlo sin arrastrar dependencias de UI.
*/

export * from "./clientes";
export * from "./membresias";
export * from "./pagos";
export * from "./inventario";
export * from "./modulos";
