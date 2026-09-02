export type CategoriaProducto =
  | "suplementos"
  | "accesorios"
  | "ropa"
  | "belleza"
  | "otros";

export type UnidadMedida = "unidad" | "caja" | "kg" | "litro" | "paquete";

export const unidadesMedida: Array<{ value: UnidadMedida; label: string }> = [
  { value: "unidad", label: "Unidad" },
  { value: "caja", label: "Caja" },
  { value: "kg", label: "Kilogramo" },
  { value: "litro", label: "Litro" },
  { value: "paquete", label: "Paquete" },
];

export interface ProductoInventario {
  id: string;
  nombre: string;
  categoria: CategoriaProducto;
  sku: string;

  // RF-28: cantidad y unidad de medida.
  unidadMedida: UnidadMedida;

  precioCompra: number;
  precioVenta: number;
  stock: number;

  // RF-29: nivel minimo de existencias.
  stockMinimo: number;

  proveedor: string;
  activo: boolean;
  fechaIngreso: string;
}

export const productosIniciales: ProductoInventario[] = [
  {
    id: "prod-1",
    nombre: "Proteína Whey",
    categoria: "suplementos",
    sku: "SUP-001",
    unidadMedida: "unidad",
    precioCompra: 180000,
    precioVenta: 260000,
    stock: 18,
    stockMinimo: 10,
    proveedor: "Nutribalance",
    activo: true,
    fechaIngreso: "2026-08-05",
  },
  {
    id: "prod-2",
    nombre: "Mancuerna 10kg",
    categoria: "accesorios",
    sku: "ACC-024",
    unidadMedida: "unidad",
    precioCompra: 220000,
    precioVenta: 310000,
    stock: 6,
    stockMinimo: 8,
    proveedor: "PowerFit",
    activo: true,
    fechaIngreso: "2026-08-10",
  },
  {
    id: "prod-3",
    nombre: "Camiseta DryFit",
    categoria: "ropa",
    sku: "ROP-112",
    unidadMedida: "unidad",
    precioCompra: 45000,
    precioVenta: 76000,
    stock: 0,
    stockMinimo: 5,
    proveedor: "Athletic Wear",
    activo: true,
    fechaIngreso: "2026-08-11",
  },
  {
    id: "prod-4",
    nombre: "Gel hidratante",
    categoria: "belleza",
    sku: "BEL-009",
    unidadMedida: "litro",
    precioCompra: 21000,
    precioVenta: 42000,
    stock: 14,
    stockMinimo: 12,
    proveedor: "VitalCare",
    activo: true,
    fechaIngreso: "2026-08-12",
  },
];

export const categoriasProducto: Array<{ value: CategoriaProducto; label: string }> = [
  { value: "suplementos", label: "Suplementos" },
  { value: "accesorios", label: "Accesorios" },
  { value: "ropa", label: "Ropa" },
  { value: "belleza", label: "Belleza" },
  { value: "otros", label: "Otros" },
];

export function validarProductoInventario(producto: ProductoInventario): string[] {
  const errores: string[] = [];

  if (!producto.nombre.trim()) {
    errores.push("El nombre del producto es obligatorio.");
  }

  if (!producto.sku.trim()) {
    errores.push("El SKU es obligatorio.");
  }

  if (producto.precioCompra <= 0) {
    errores.push("El precio de compra debe ser mayor que cero.");
  }

  if (producto.precioVenta <= 0) {
    errores.push("El precio de venta debe ser mayor que cero.");
  }

  if (producto.stock < 0) {
    errores.push("El stock no puede ser negativo.");
  }

  if (producto.stockMinimo < 0) {
    errores.push("El stock mínimo no puede ser negativo.");
  }

  if (!producto.proveedor.trim()) {
    errores.push("El proveedor es obligatorio.");
  }

  return errores;
}

import type { NombreIcono } from "./modulos";

export interface SeccionInventario {
  id: string;
  nombre: string;
  titulo: string;
  icono: NombreIcono;
}

export const seccionesInventario: SeccionInventario[] = [
  {
    id: "todos",
    nombre: "Todos los productos",
    titulo: "Todos los productos",
    icono: "lista",
  },
  {
    id: "bajo-stock",
    nombre: "Bajo stock",
    titulo: "Productos con bajo stock",
    icono: "reloj",
  },
  {
    id: "agotados",
    nombre: "Agotados",
    titulo: "Productos agotados",
    icono: "usuario-x",
  },
];

export const seccionInventarioPorDefecto = "todos";

export function esSeccionInventario(valor: string): boolean {
  return seccionesInventario.some((seccion) => seccion.id === valor);
}

export function tituloSeccionInventario(id: string): string {
  const seccion = seccionesInventario.find((item) => item.id === id);
  return seccion?.titulo ?? "Inventario";
}
