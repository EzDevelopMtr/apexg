/*
  =====================================================
  MATRIZ DE PERMISOS (ERS numeral 2.2)
  =====================================================

  Dos roles:

    administrador  → acceso total
    recepcionista  → gestion operativa diaria

  Este archivo NO depende de React: la matriz vive
  aqui para que tanto la sidebar, el selector de
  modulos y las rutas de Next.js validen exactamente
  las mismas reglas.
*/

export type Rol = "administrador" | "recepcionista";

/*
  -----------------------------------------------------
  MODULOS ACCESIBLES POR ROL
  -----------------------------------------------------

  Coincide con la matriz del numeral 2.2:

    Clientes                → ambos
    Membresias (ver planes) → ambos (crear/editar/eliminar solo admin)
    Pagos                   → ambos
    Finanzas (apartado diario) → ambos, el resto solo admin
    Entrenadores            → solo admin
    Inventario              → solo admin
*/

export const modulosPorRol: Record<Rol, string[]> = {
  administrador: [
    "clientes",
    "membresias",
    "pagos",
    "inventario",
    "finanzas",
    "entrenadores",
  ],
  recepcionista: [
    "clientes",
    "membresias",
    "pagos",
    "finanzas",
  ],
};

export function puedeAccederModulo(rol: Rol, moduloId: string): boolean {
  return modulosPorRol[rol]?.includes(moduloId) ?? false;
}

/*
  -----------------------------------------------------
  ACCIONES RESTRINGIDAS DENTRO DE UN MODULO
  -----------------------------------------------------

  Algunos modulos son visibles para ambos roles pero
  con funcionalidad recortada para Recepcionista.
*/

// Crear, editar y eliminar tipos de membresia: solo Administrador (RF-12).
export function puedeGestionarMembresias(rol: Rol): boolean {
  return rol === "administrador";
}

// Secciones de Finanzas visibles por rol.
// Recepcionista solo puede diligenciar el apartado diario (numeral 2.2).
export const seccionesFinanzasPorRol: Record<Rol, string[]> = {
  administrador: [
    "dashboard",
    "balance-mensual",
    "apartado-diario",
    "egresos",
    "inventario",
    "comisiones-entrenadores",
  ],
  recepcionista: ["apartado-diario"],
};

export function puedeVerSeccionFinanzas(rol: Rol, seccion: string): boolean {
  return seccionesFinanzasPorRol[rol]?.includes(seccion) ?? false;
}

export function seccionFinanzasPorDefectoParaRol(rol: Rol): string {
  return seccionesFinanzasPorRol[rol][0] ?? "apartado-diario";
}
