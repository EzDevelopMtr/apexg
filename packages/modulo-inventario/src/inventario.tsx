"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  categoriasProducto,
  productosIniciales,
  unidadesMedida,
  validarProductoInventario,
  type ProductoInventario,
} from "@apexg/core";
import { Button, Input, Modal } from "@apexg/ui";

const CLAVE_INVENTARIO = "apexg:inventario";
const coloresCategoria: Record<ProductoInventario["categoria"], string> = {
  suplementos: "#f59e0b",
  accesorios: "#3b82f6",
  ropa: "#8b5cf6",
  belleza: "#10b981",
  otros: "#f97316",
};

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function obtenerEstado(producto: ProductoInventario): "Activo" | "Bajo stock" | "Agotado" {
  if (producto.stock === 0) return "Agotado";
  if (producto.stock <= producto.stockMinimo) return "Bajo stock";
  return "Activo";
}

function formularioVacio(): ProductoInventario {
  return {
    id: "",
    nombre: "",
    categoria: "suplementos",
    sku: "",
    unidadMedida: "unidad",
    precioCompra: 0,
    precioVenta: 0,
    stock: 0,
    stockMinimo: 0,
    proveedor: "",
    activo: true,
    fechaIngreso: new Date().toISOString().slice(0, 10),
  };
}

interface InventarioProps {
  activeSection: string;
}

export default function Inventario({ activeSection }: InventarioProps) {
  const [productos, setProductos] = useState<ProductoInventario[]>(productosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<ProductoInventario | null>(null);
  const [pendienteEliminar, setPendienteEliminar] = useState<ProductoInventario | null>(null);
  const [formulario, setFormulario] = useState<ProductoInventario>(formularioVacio);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    const guardados = window.localStorage.getItem(CLAVE_INVENTARIO);
    if (!guardados) return;

    try {
      // oxlint-disable-next-line react/set-state-in-effect
      setProductos(JSON.parse(guardados) as ProductoInventario[]);
    } catch {
      window.localStorage.removeItem(CLAVE_INVENTARIO);
    }
  }, []);

  const guardarProductos = (nuevos: ProductoInventario[]) => {
    setProductos(nuevos);
    window.localStorage.setItem(CLAVE_INVENTARIO, JSON.stringify(nuevos));
  };

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    let resultado = [...productos];

    if (activeSection === "bajo-stock") {
      resultado = resultado.filter((producto) => producto.stock <= producto.stockMinimo);
    }

    if (activeSection === "agotados") {
      resultado = resultado.filter((producto) => producto.stock === 0);
    }

    if (categoriaFiltro !== "Todas") {
      resultado = resultado.filter((producto) => producto.categoria === categoriaFiltro);
    }

    if (estadoFiltro !== "Todos") {
      resultado = resultado.filter((producto) => {
        const estado = obtenerEstado(producto);
        return estadoFiltro === estado;
      });
    }

    if (!termino) return resultado;

    return resultado.filter((producto) =>
      `${producto.nombre} ${producto.sku} ${producto.proveedor}`.toLowerCase().includes(termino)
    );
  }, [activeSection, busqueda, categoriaFiltro, estadoFiltro, productos]);

  const requiereAtencion = productos
    .filter((producto) => producto.stock <= producto.stockMinimo)
    .slice(0, 3);

  const totalProductos = productos.length;
  const bajoStock = productos.filter((producto) => producto.stock <= producto.stockMinimo).length;
  const agotados = productos.filter((producto) => producto.stock === 0).length;
  const valorTotalInventario = productos.reduce(
    (acumulado, producto) => acumulado + producto.stock * producto.precioVenta,
    0
  );

  const resumenCategorias = categoriasProducto.map((categoria) => {
    const items = productos.filter((producto) => producto.categoria === categoria.value);
    const total = items.length;
    const porcentaje = totalProductos ? Math.round((total / totalProductos) * 100) : 0;

    return {
      ...categoria,
      total,
      porcentaje,
      color: coloresCategoria[categoria.value],
    };
  });

  const abrirNuevo = () => {
    setErrores([]);
    setPendienteEliminar(null);
    setEditando(null);
    setCreando(true);
    setFormulario(formularioVacio());
  };

  const abrirEdicion = (producto: ProductoInventario) => {
    setErrores([]);
    setPendienteEliminar(null);
    setCreando(false);
    setEditando(producto);
    setFormulario(producto);
  };

  const guardar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const producto: ProductoInventario = {
      ...formulario,
      id: formulario.id || `prod-${Date.now()}`,
      precioCompra: Number(formulario.precioCompra),
      precioVenta: Number(formulario.precioVenta),
      stock: Number(formulario.stock),
      stockMinimo: Number(formulario.stockMinimo),
    };

    const validaciones = validarProductoInventario(producto);
    if (validaciones.length) {
      setErrores(validaciones);
      return;
    }

    guardarProductos(
      editando
        ? productos.map((item) => (item.id === producto.id ? producto : item))
        : [producto, ...productos]
    );

    setEditando(null);
    setCreando(false);
    setFormulario(formularioVacio());
  };

  const eliminar = (producto: ProductoInventario) => {
    setPendienteEliminar(producto);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventario</h1>
            <p className="mt-2 text-sm text-slate-500">Controla productos, stock y movimientos del gimnasio.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variante="secundario" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <Download size={16} />
              Exportar reporte
            </Button>
            <Button type="button" onClick={abrirNuevo} className="bg-orange-500 hover:bg-orange-600">
              <Plus size={16} />
              Registrar producto
            </Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Box size={22} />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900">{totalProductos}</div>
            <p className="mt-2 text-sm text-slate-500">Productos<br />en inventario</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-600">
              <TrendingUp size={14} />
              <span>+8% vs. mes anterior</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle size={22} />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900">{bajoStock}</div>
            <p className="mt-2 text-sm text-slate-500">Bajo stock<br />requieren atención</p>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
              <span>Ver productos</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={22} />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900">{agotados}</div>
            <p className="mt-2 text-sm text-slate-500">Agotados<br />sin existencias</p>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
              <span>Ver productos</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Wallet size={22} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{moneda(valorTotalInventario)}</div>
            <p className="mt-2 text-sm text-slate-500">Valor total<br />del inventario</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-emerald-600">
              <TrendingUp size={14} />
              <span>+12% vs. mes anterior</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <TrendingUp size={22} />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900">18</div>
            <p className="mt-2 text-sm text-slate-500">Movimientos hoy<br />entradas y salidas</p>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
              <span>Ver movimiento</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_1.4fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Requieren atención</h2>
              <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-orange-600">
                Ver todos <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {requiereAtencion.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Box size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{producto.nombre}</p>
                      <p className="text-xs text-slate-500">{producto.sku} · {categoriasProducto.find((item) => item.value === producto.categoria)?.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${producto.stock === 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                      {producto.stock === 0 ? "Agotado" : "Bajo stock"}
                    </span>
                    <span className="text-sm text-slate-600">{producto.stock} unidades</span>
                    <ArrowRight size={14} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Stock por categoría</h2>
              <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                Ver reporte <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="relative mx-auto h-48 w-48">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${resumenCategorias.map((categoria) => `${categoria.color} ${categoria.porcentaje}%`).join(", ")})`,
                  }}
                />
                <div className="absolute inset-[20%] flex items-center justify-center rounded-full bg-white">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">{totalProductos}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">productos</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {resumenCategorias.map((categoria) => (
                  <div key={categoria.value}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: categoria.color }}
                        />
                        {categoria.label}
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>{categoria.porcentaje}%</span>
                        <span>{categoria.total} productos</span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(categoria.porcentaje, 12)}%`, backgroundColor: categoria.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-3xl font-bold text-slate-900">Todos los productos</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <select
                value={categoriaFiltro}
                onChange={(event) => setCategoriaFiltro(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="Todas">Categoría: Todas</option>
                {categoriasProducto.map((categoria) => (
                  <option key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </option>
                ))}
              </select>

              <select
                value={estadoFiltro}
                onChange={(event) => setEstadoFiltro(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Activo">Activo</option>
                <option value="Bajo stock">Bajo stock</option>
                <option value="Agotado">Agotado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Valor total</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((producto) => {
                  const estado = obtenerEstado(producto);
                  const stockPercent = Math.min((producto.stock / Math.max(producto.stockMinimo, 1)) * 100, 100);
                  const chipClass =
                    estado === "Activo"
                      ? "bg-emerald-100 text-emerald-700"
                      : estado === "Bajo stock"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700";

                  return (
                    <tr key={producto.id} className="border-b border-slate-200 align-middle hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                            <Box size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{producto.nombre}</p>
                            <p className="text-xs text-slate-500">{producto.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {categoriasProducto.find((item) => item.value === producto.categoria)?.label}
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-[170px]">
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {producto.stock}{" "}
                              {unidadesMedida.find((u) => u.value === producto.unidadMedida)?.label}
                            </span>
                            <span>Mín. {producto.stockMinimo}</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full ${producto.stock === 0 ? "bg-red-500" : producto.stock <= producto.stockMinimo ? "bg-amber-400" : "bg-emerald-500"}`}
                              style={{ width: `${Math.max(stockPercent, 10)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{moneda(producto.precioVenta)}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chipClass}`}>
                          {estado}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{moneda(producto.stock * producto.precioVenta)}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(producto)}
                            aria-label={`Editar ${producto.nombre}`}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminar(producto)}
                            aria-label={`Eliminar ${producto.nombre}`}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-red-300 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {visibles.length === 0 && (
              <p className="py-10 text-center text-slate-500">No hay productos que coincidan con la búsqueda.</p>
            )}
          </div>
        </div>
      </div>

      {(creando || editando) && (
        <Modal
          abierto={creando || editando !== null}
          titulo={editando ? "Editar producto" : "Nuevo producto"}
          onCerrar={() => {
            setEditando(null);
            setCreando(false);
            setFormulario(formularioVacio());
          }}
        >
          <form onSubmit={guardar} className="space-y-5">
            {errores.length > 0 && (
              <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
                {errores.map((error) => <p key={error}>{error}</p>)}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                etiqueta="Nombre del producto"
                id="nombre"
                value={formulario.nombre}
                onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })}
                required
                className="bg-slate-950 text-white placeholder:text-slate-500"
              />
              <Input
                etiqueta="SKU"
                id="sku"
                value={formulario.sku}
                onChange={(event) => setFormulario({ ...formulario, sku: event.target.value })}
                required
                className="bg-slate-950 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="categoria" className="mb-2 block text-sm font-medium text-slate-200">Categoría</label>
                <select
                  id="categoria"
                  value={formulario.categoria}
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,
                      categoria: event.target.value as ProductoInventario["categoria"],
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                >
                  {categoriasProducto.map((categoria) => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                etiqueta="Proveedor"
                id="proveedor"
                value={formulario.proveedor}
                onChange={(event) => setFormulario({ ...formulario, proveedor: event.target.value })}
                required
                className="bg-slate-950 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <label htmlFor="unidadMedida" className="mb-2 block text-sm font-medium text-slate-200">
                Unidad de medida
              </label>
              <select
                id="unidadMedida"
                value={formulario.unidadMedida}
                onChange={(event) =>
                  setFormulario({
                    ...formulario,
                    unidadMedida: event.target.value as ProductoInventario["unidadMedida"],
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
              >
                {unidadesMedida.map((unidad) => (
                  <option key={unidad.value} value={unidad.value}>
                    {unidad.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                etiqueta="Precio de compra"
                id="precioCompra"
                type="number"
                min="0"
                value={formulario.precioCompra || ""}
                onChange={(event) => setFormulario({ ...formulario, precioCompra: Number(event.target.value) })}
                required
                className="bg-slate-950 text-white"
              />
              <Input
                etiqueta="Precio de venta"
                id="precioVenta"
                type="number"
                min="0"
                value={formulario.precioVenta || ""}
                onChange={(event) => setFormulario({ ...formulario, precioVenta: Number(event.target.value) })}
                required
                className="bg-slate-950 text-white"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                etiqueta="Stock actual"
                id="stock"
                type="number"
                min="0"
                value={formulario.stock}
                onChange={(event) => setFormulario({ ...formulario, stock: Number(event.target.value) })}
                required
                className="bg-slate-950 text-white"
              />
              <Input
                etiqueta="Stock mínimo"
                id="stockMinimo"
                type="number"
                min="0"
                value={formulario.stockMinimo}
                onChange={(event) => setFormulario({ ...formulario, stockMinimo: Number(event.target.value) })}
                required
                className="bg-slate-950 text-white"
              />
            </div>

            <Input
              etiqueta="Fecha de ingreso"
              id="fechaIngreso"
              type="date"
              value={formulario.fechaIngreso}
              onChange={(event) => setFormulario({ ...formulario, fechaIngreso: event.target.value })}
              required
              className="bg-slate-950 text-white"
            />

            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200">
              <input
                type="checkbox"
                checked={formulario.activo}
                onChange={(event) => setFormulario({ ...formulario, activo: event.target.checked })}
                className="h-4 w-4 accent-orange-500"
              />
              Producto activo
            </label>

            <div className="flex gap-3">
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                <Plus size={18} />
                Guardar producto
              </Button>
              <Button
                type="button"
                variante="secundario"
                className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setEditando(null);
                  setCreando(false);
                  setFormulario(formularioVacio());
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {pendienteEliminar && (
        <Modal
          abierto={pendienteEliminar !== null}
          titulo="Eliminar producto"
          onCerrar={() => setPendienteEliminar(null)}
        >
          <p className="text-sm text-slate-300">
            ¿Seguro que deseas eliminar <strong>{pendienteEliminar.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="mt-5 flex gap-3">
            <Button
              variante="peligro"
              onClick={() => {
                guardarProductos(productos.filter((item) => item.id !== pendienteEliminar.id));
                setPendienteEliminar(null);
              }}
            >
              Eliminar
            </Button>
            <Button variante="secundario" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" onClick={() => setPendienteEliminar(null)}>
              Cancelar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
