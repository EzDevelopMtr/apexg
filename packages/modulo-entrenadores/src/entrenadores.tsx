"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  CLAVES_ALMACENAMIENTO,
  clientesAsignados,
  entrenadoresIniciales,
  estaDisponible,
  tituloSeccionEntrenadores,
  validarEntrenador,
  type Cliente,
  type ComisionEntrenador,
  type Entrenador,
} from "@apexg/core";
import { Button, Card, CardBody, Input, Modal } from "@apexg/ui";

import EntrenadorForm from "./entrenador-form";

function moneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formularioVacio(): Entrenador {
  return {
    id: "",
    nombre: "",
    documento: "",
    telefono: "",
    certificados: "N/A",
    fechaContratacion: "",
    sueldo: 0,
    cupoMaximo: 10,
    activo: true,
  };
}

interface EntrenadoresProps {
  activeSection: string;
}

export default function Entrenadores({ activeSection }: EntrenadoresProps) {
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>(entrenadoresIniciales);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [comisiones, setComisiones] = useState<ComisionEntrenador[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Entrenador | null>(null);
  const [pendienteEliminar, setPendienteEliminar] = useState<Entrenador | null>(null);
  const [formulario, setFormulario] = useState<Entrenador>(formularioVacio);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    const guardados = window.localStorage.getItem(CLAVES_ALMACENAMIENTO.entrenadores);
    if (guardados) {
      try {
        // oxlint-disable-next-line react/set-state-in-effect
        setEntrenadores(JSON.parse(guardados) as Entrenador[]);
      } catch {
        window.localStorage.removeItem(CLAVES_ALMACENAMIENTO.entrenadores);
      }
    }

    const clientesGuardados = window.localStorage.getItem(CLAVES_ALMACENAMIENTO.clientes);
    if (clientesGuardados) {
      try {
        setClientes(JSON.parse(clientesGuardados) as Cliente[]);
      } catch {
        // Se ignora: sin datos de clientes solo afecta el conteo de disponibilidad.
      }
    }

    const comisionesGuardadas = window.localStorage.getItem(CLAVES_ALMACENAMIENTO.comisiones);
    if (comisionesGuardadas) {
      try {
        setComisiones(JSON.parse(comisionesGuardadas) as ComisionEntrenador[]);
      } catch {
        window.localStorage.removeItem(CLAVES_ALMACENAMIENTO.comisiones);
      }
    }
  }, []);

  const guardarEntrenadores = (nuevos: Entrenador[]) => {
    setEntrenadores(nuevos);
    window.localStorage.setItem(CLAVES_ALMACENAMIENTO.entrenadores, JSON.stringify(nuevos));
  };

  const conteoAsignados = useMemo(() => {
    const mapa = new Map<string, number>();

    for (const entrenador of entrenadores) {
      mapa.set(entrenador.id, clientesAsignados(entrenador.id, clientes));
    }

    return mapa;
  }, [entrenadores, clientes]);

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    let resultado = entrenadores;

    if (activeSection === "disponibles") {
      resultado = resultado.filter((entrenador) =>
        estaDisponible(entrenador, conteoAsignados.get(entrenador.id) ?? 0)
      );
    }

    if (!termino) return resultado;

    return resultado.filter((entrenador) =>
      `${entrenador.nombre} ${entrenador.documento}`.toLowerCase().includes(termino)
    );
  }, [activeSection, busqueda, entrenadores, conteoAsignados]);

  const tituloVista = tituloSeccionEntrenadores(activeSection);

  const abrirNuevo = () => {
    setErrores([]);
    setPendienteEliminar(null);
    setEditando(null);
    setCreando(true);
    setFormulario(formularioVacio());
  };

  const abrirEdicion = (entrenador: Entrenador) => {
    setErrores([]);
    setPendienteEliminar(null);
    setCreando(false);
    setEditando(entrenador);
    setFormulario(entrenador);
  };

  const guardar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const entrenador: Entrenador = {
      ...formulario,
      id: formulario.id || `ent-${Date.now()}`,
      sueldo: Number(formulario.sueldo),
      cupoMaximo: Number(formulario.cupoMaximo),
    };

    const validaciones = validarEntrenador(entrenador);
    if (validaciones.length) {
      setErrores(validaciones);
      return;
    }

    guardarEntrenadores(
      editando
        ? entrenadores.map((item) => (item.id === entrenador.id ? entrenador : item))
        : [entrenador, ...entrenadores]
    );

    setEditando(null);
    setCreando(false);
    setFormulario(formularioVacio());
  };

  if (activeSection === "comisiones") {
    const totalComisiones = comisiones.reduce((acc, item) => acc + item.valorEntrenador, 0);

    return (
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">{tituloVista}</h1>
            <p className="mt-2 text-slate-500">
              Registro con evidencia de los pagos generados por clientes Personalizado o
              Semipersonalizado (RF-23).
            </p>
          </div>

          <Card>
            <CardBody>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-slate-500">Total comisiones registradas</p>
                <p className="text-2xl font-bold text-slate-900">{moneda(totalComisiones)}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 font-semibold">Entrenador</th>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Valor entrenador</th>
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comisiones.map((comision) => (
                      <tr key={comision.id} className="border-b border-slate-100">
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {comision.entrenadorNombre}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{comision.clienteNombre}</td>
                        <td className="px-4 py-4 text-slate-600">{comision.planNombre}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {moneda(comision.valorEntrenador)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">{comision.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {comisiones.length === 0 && (
                  <p className="py-10 text-center text-slate-500">
                    Aún no se han registrado comisiones. Se generan automáticamente al completar
                    un pago Personalizado o Semipersonalizado desde el módulo de Pagos.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tituloVista}</h1>
            <p className="mt-2 text-slate-500">
              Registra entrenadores, su sueldo y su disponibilidad para nuevos clientes.
            </p>
          </div>
          <Button onClick={abrirNuevo}>
            <Plus size={18} />
            Nuevo entrenador
          </Button>
        </div>

        {(creando || editando) && (
          <Modal
            abierto={creando || editando !== null}
            titulo={editando ? "Editar entrenador" : "Nuevo entrenador"}
            onCerrar={() => {
              setEditando(null);
              setCreando(false);
              setFormulario(formularioVacio());
            }}
          >
            <EntrenadorForm
              formulario={formulario}
              errores={errores}
              onChange={setFormulario}
              onSubmit={guardar}
              onCancelar={() => {
                setEditando(null);
                setCreando(false);
                setFormulario(formularioVacio());
              }}
            />
          </Modal>
        )}

        {pendienteEliminar && (
          <Modal
            abierto={pendienteEliminar !== null}
            titulo="Eliminar entrenador"
            onCerrar={() => setPendienteEliminar(null)}
          >
            <p className="text-sm text-slate-600">
              ¿Seguro que deseas eliminar a <strong>{pendienteEliminar.nombre}</strong>? Esta
              acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variante="peligro"
                onClick={() => {
                  guardarEntrenadores(
                    entrenadores.filter((item) => item.id !== pendienteEliminar.id)
                  );
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
                id="buscar-entrenador"
                etiqueta="Buscar entrenador"
                icono={<Search size={18} />}
                placeholder="Nombre o documento"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 font-semibold">Entrenador</th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold">Sueldo</th>
                    <th className="px-4 py-3 font-semibold">Clientes asignados</th>
                    <th className="px-4 py-3 font-semibold">Disponibilidad</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((entrenador) => {
                    const asignados = conteoAsignados.get(entrenador.id) ?? 0;
                    const disponible = estaDisponible(entrenador, asignados);

                    return (
                      <tr key={entrenador.id} className="border-b border-slate-100">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{entrenador.nombre}</p>
                          <p className="mt-1 text-slate-500">{entrenador.documento}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{entrenador.telefono}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {moneda(entrenador.sueldo)}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {asignados} / {entrenador.cupoMaximo}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              disponible
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {disponible ? "Disponible" : "Sin cupo"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              tamano="sm"
                              variante="secundario"
                              onClick={() => abrirEdicion(entrenador)}
                              aria-label={`Editar ${entrenador.nombre}`}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              tamano="sm"
                              variante="peligro"
                              onClick={() => setPendienteEliminar(entrenador)}
                              aria-label={`Eliminar ${entrenador.nombre}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibles.length === 0 && (
                <p className="py-10 text-center text-slate-500">
                  No hay entrenadores que coincidan con la búsqueda.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
