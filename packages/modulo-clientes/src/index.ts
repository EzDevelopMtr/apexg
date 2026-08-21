/*
  =====================================================
  PUNTO DE ENTRADA DE @apexg/modulo-clientes
  =====================================================

  Cada modulo del negocio (clientes, membresias,
  pagos, ...) vive en su propio paquete.

  La aplicacion apps/web solo se encarga de las
  rutas y de montar el modulo que corresponda.
*/

export { default as Clientes } from "./clientes";

export { default as ClienteForm } from "./cliente-form";
