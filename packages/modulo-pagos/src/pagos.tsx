"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  conceptosPago,
  pagosIniciales,
  type Pago,
  type EstadoPago,
  type MetodoPago,
  tituloSeccionPagos,
  validarPago,
  type TipoDestinoPago,
} from "@apexg/core";
import { Button, Card, CardBody, Input, Modal } from "@apexg/ui";

const CLAVE_PAGOS = "apexg:pagos";

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formularioVacio(): Pago {
  return {
    id: "",
    tipo: "cliente",
    clienteId: "",
    clienteNombre: "",
    entrenadorId: "",
    entrenadorNombre: "",
    concepto: "Membresía mensual",
    monto: 0,
    fecha: "",
    vencimiento: "",
    metodo: "transferencia",
    referencia: "",
    estado: "pendiente",
    observaciones: "",
  };
}

interface PagosProps {
  activeSection: string;
}

export default function Pagos({ activeSection }: PagosProps) {
  const [pagos, setPagos] = useState<Pago[]>(pagosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Pago | null>(null);
  const [pendienteEliminar, setPendienteEliminar] = useState<Pago | null>(null);
  const [formulario, setFormulario] = useState<Pago>(formularioVacio);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    const guardados = window.localStorage.getItem(CLAVE_PAGOS);
    if (!guardados) return;

    try {
      setPagos(JSON.parse(guardados) as Pago[]);
    } catch {
      window.localStorage.removeItem(CLAVE_PAGOS);
    }
  }, []);

  const guardarPagos = (nuevos: Pago[]) => {
    setPagos(nuevos);
    window.localStorage.setItem(CLAVE_PAGOS, JSON.stringify(nuevos));
  };

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    let resultado = pagos;

    if (activeSection === "pendientes") {
      resultado = resultado.filter((pago) => pago.estado === "pendiente");
    }

    if (activeSection === "pagados") {
      resultado = resultado.filter((pago) => pago.estado === "pagado");
    }

    if (activeSection === "vencidos") {
      resultado = resultado.filter((pago) => pago.estado === "vencido");
    }

    if (!termino) return resultado;

    return resultado.filter((pago) =>
      `${pago.clienteNombre} ${pago.concepto} ${pago.referencia}`
        .toLowerCase()
        .includes(termino)
    );
  }, [activeSection, busqueda, pagos]);

  const tituloVista = tituloSeccionPagos(activeSection);

  const abrirNuevo = () => {
    setErrores([]);
    setPendienteEliminar(null);
    setEditando(null);
    setCreando(true);
    setFormulario(formularioVacio());
  };

  const abrirEdicion = (pago: Pago) => {
    setErrores([]);
    setPendienteEliminar(null);
    setCreando(false);
    setEditando(pago);
    setFormulario(pago);
  };

  const guardar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const pago: Pago = {
      ...formulario,
      id: formulario.id || `pago-${Date.now()}`,
      clienteId: formulario.clienteId || `cli-${Date.now()}`,
      monto: Number(formulario.monto),
    };

    const validaciones = validarPago(pago);
    if (validaciones.length) {
      setErrores(validaciones);
      return;
    }

    guardarPagos(
      editando
        ? pagos.map((item) => (item.id === pago.id ? pago : item))
        : [pago, ...pagos]
    );

    setEditando(null);
    setCreando(false);
    setFormulario(formularioVacio());
  };

  const eliminar = (pago: Pago) => {
    setPendienteEliminar(pago);
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tituloVista}</h1>
            <p className="mt-2 text-slate-500">
              Administra pagos, referencias y cobros pendientes del gimnasio.
            </p>
          </div>
          <Button onClick={abrirNuevo}>
            <Plus size={18} />
            Nuevo pago
          </Button>
        </div>

        {(creando || editando) && (
          <Modal
            abierto={creando || editando !== null}
            titulo={editando ? "Editar pago" : "Nuevo pago"}
            onCerrar={() => {
              setEditando(null);
              setCreando(false);
              setFormulario(formularioVacio());
            }}
          >
            <form onSubmit={guardar} className="space-y-5">
              {errores.length > 0 && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {errores.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="tipo" className="mb-2 block text-sm font-medium text-slate-700">
                    Destino del pago
                  </label>
                  <select
                    id="tipo"
                    value={formulario.tipo}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        tipo: event.target.value as TipoDestinoPago,
                        clienteNombre:
                          event.target.value === "cliente"
                            ? formulario.clienteNombre || ""
                            : "",
                        entrenadorNombre:
                          event.target.value === "entrenador"
                            ? formulario.entrenadorNombre || ""
                            : "",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="entrenador">Entrenador</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="concepto" className="mb-2 block text-sm font-medium text-slate-700">
                    Concepto
                  </label>
                  <select
                    id="concepto"
                    value={formulario.concepto}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        concepto: event.target.value as Pago["concepto"],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  >
                    {conceptosPago.map((concepto) => (
                      <option key={concepto} value={concepto}>
                        {concepto}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formulario.tipo === "cliente" ? (
                <Input
                  etiqueta="Nombre del cliente"
                  id="clienteNombre"
                  value={formulario.clienteNombre}
                  onChange={(event) =>
                    setFormulario({ ...formulario, clienteNombre: event.target.value })
                  }
                  required
                />
              ) : (
                <Input
                  etiqueta="Nombre del entrenador"
                  id="entrenadorNombre"
                  value={formulario.entrenadorNombre || ""}
                  onChange={(event) =>
                    setFormulario({ ...formulario, entrenadorNombre: event.target.value })
                  }
                  required
                />
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  etiqueta="Monto"
                  id="monto"
                  type="number"
                  min="1"
                  value={formulario.monto || ""}
                  onChange={(event) =>
                    setFormulario({ ...formulario, monto: Number(event.target.value) })
                  }
                  required
                />
                <Input
                  etiqueta="Referencia"
                  id="referencia"
                  value={formulario.referencia}
                  onChange={(event) =>
                    setFormulario({ ...formulario, referencia: event.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  etiqueta="Fecha de pago"
                  id="fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={(event) =>
                    setFormulario({ ...formulario, fecha: event.target.value })
                  }
                  required
                />
                <Input
                  etiqueta="Fecha de vencimiento"
                  id="vencimiento"
                  type="date"
                  value={formulario.vencimiento}
                  onChange={(event) =>
                    setFormulario({ ...formulario, vencimiento: event.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="metodo" className="mb-2 block text-sm font-medium text-slate-700">
                    Método de pago
                  </label>
                  <select
                    id="metodo"
                    value={formulario.metodo}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        metodo: event.target.value as MetodoPago,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="nequi">Nequi</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="estado" className="mb-2 block text-sm font-medium text-slate-700">
                    Estado
                  </label>
                  <select
                    id="estado"
                    value={formulario.estado}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        estado: event.target.value as EstadoPago,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="observaciones" className="mb-2 block text-sm font-medium text-slate-700">
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  value={formulario.observaciones}
                  onChange={(event) =>
                    setFormulario({ ...formulario, observaciones: event.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  <Plus size={18} />
                  Guardar pago
                </Button>
                <Button
                  type="button"
                  variante="secundario"
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
            titulo="Eliminar pago"
            onCerrar={() => setPendienteEliminar(null)}
          >
            <p className="text-sm text-slate-600">
              ¿Seguro que deseas eliminar <strong>{pendienteEliminar.clienteNombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variante="peligro"
                onClick={() => {
                  guardarPagos(pagos.filter((item) => item.id !== pendienteEliminar.id));
                  setPendienteEliminar(null);
                }}
              >
                Eliminar
              </Button>
              <Button variante="secundario" onClick={() => setPendienteEliminar(null)}>
                Cancelar
              </Button>
            </div>
          </Modal>
        )}

        <Card>
          <CardBody>
            <div className="mb-6">
              <Input
                id="buscar-pago"
                etiqueta="Buscar pago"
                icono={<Search size={18} />}
                placeholder="Cliente, concepto o referencia"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Concepto</th>
                    <th className="px-4 py-3 font-semibold">Monto</th>
                    <th className="px-4 py-3 font-semibold">Método</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((pago) => (
                    <tr key={pago.id} className="border-b border-slate-100">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {pago.tipo === "entrenador"
                            ? pago.entrenadorNombre || "Entrenador sin nombre"
                            : pago.clienteNombre}
                        </p>
                        <p className="mt-1 text-slate-500">{pago.referencia}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{pago.concepto}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">{moneda(pago.monto)}</td>
                      <td className="px-4 py-4 text-slate-600">{pago.metodo}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            pago.estado === "pagado"
                              ? "bg-emerald-100 text-emerald-700"
                              : pago.estado === "pendiente"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {pago.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            tamano="sm"
                            variante="secundario"
                            onClick={() => abrirEdicion(pago)}
                            aria-label={`Editar ${pago.clienteNombre}`}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            tamano="sm"
                            variante="peligro"
                            onClick={() => eliminar(pago)}
                            aria-label={`Eliminar ${pago.clienteNombre}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibles.length === 0 && (
                <p className="py-10 text-center text-slate-500">
                  No hay pagos que coincidan con la búsqueda.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
