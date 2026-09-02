"use client";

import { useEffect, useMemo, useState } from "react";

import { Pencil, Plus, Search, UserRound } from "lucide-react";

import {
  CLAVES_ALMACENAMIENTO,
  calcularEstadoCliente,
  calcularVencimientoCliente,
  clientesIniciales,
  diasParaVencer,
  planesMembresiaIniciales,
  tituloSeccionClientes,
  validarCliente,
  type Cliente,
} from "@apexg/core";

import ClienteForm from "./cliente-form";

interface ClientesProps {
  activeSection: string;
}

function formularioVacio(): Cliente {
  const hoy = new Date().toISOString().slice(0, 10);

  return {
    id: 0,
    nombre: "",
    documento: "",
    telefono: "",
    correo: "",
    contactoEmergencia: "",
    formaPago: "efectivo",
    tipoSangre: "",
    fechaCumpleanos: "",
    condicionMedica: "N/A",
    comentarios: "",
    membresiaId: planesMembresiaIniciales[0]!.id,
    fechaIngreso: hoy,
    fechaVencimiento: calcularVencimientoCliente(hoy, planesMembresiaIniciales[0]!.id),
    estado: "Activo",
  };
}

function nombreMembresia(membresiaId: string): string {
  return planesMembresiaIniciales.find((plan) => plan.id === membresiaId)?.nombre ?? membresiaId;
}

export default function Clientes({ activeSection }: ClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [search, setSearch] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [formulario, setFormulario] = useState<Cliente>(formularioVacio);
  const [errores, setErrores] = useState<string[]>([]);

  useEffect(() => {
    const guardados = window.localStorage.getItem(CLAVES_ALMACENAMIENTO.clientes);
    if (!guardados) return;

    try {
      // oxlint-disable-next-line react/set-state-in-effect
      setClientes(JSON.parse(guardados) as Cliente[]);
    } catch {
      window.localStorage.removeItem(CLAVES_ALMACENAMIENTO.clientes);
    }
  }, []);

  // RF-21: cada vez que la lista cambia, recalculamos automáticamente
  // el estado "En mora" según la fecha de vencimiento.
  const clientesActualizados = useMemo(
    () => clientes.map((cliente) => ({ ...cliente, estado: calcularEstadoCliente(cliente) })),
    [clientes]
  );

  const guardarClientes = (nuevos: Cliente[]) => {
    setClientes(nuevos);
    window.localStorage.setItem(CLAVES_ALMACENAMIENTO.clientes, JSON.stringify(nuevos));
  };

  const filteredClients = useMemo(() => {
    let result = clientesActualizados;

    if (activeSection === "activos") {
      result = result.filter((cliente) => cliente.estado === "Activo");
    }

    if (activeSection === "por-vencer") {
      result = result.filter((cliente) => {
        const dias = diasParaVencer(cliente.fechaVencimiento);
        return cliente.estado === "Activo" && dias >= 0 && dias <= 7;
      });
    }

    if (activeSection === "en-mora") {
      result = result.filter((cliente) => cliente.estado === "En mora");
    }

    if (activeSection === "inactivos") {
      result = result.filter((cliente) => cliente.estado === "Inactivo");
    }

    if (search.trim()) {
      const searchText = search.toLowerCase();

      result = result.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(searchText) ||
          cliente.documento.toLowerCase().includes(searchText) ||
          cliente.telefono.toLowerCase().includes(searchText)
      );
    }

    return result;
  }, [clientesActualizados, activeSection, search]);

  const abrirNuevo = () => {
    setErrores([]);
    setEditando(null);
    setCreando(true);
    setFormulario(formularioVacio());
  };

  const abrirEdicion = (cliente: Cliente) => {
    setErrores([]);
    setCreando(false);
    setEditando(cliente);
    setFormulario(cliente);
  };

  const cerrarFormulario = () => {
    setEditando(null);
    setCreando(false);
    setFormulario(formularioVacio());
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cliente: Cliente = {
      ...formulario,
      id: formulario.id || Date.now(),
    };

    const validaciones = validarCliente(cliente);
    if (validaciones.length) {
      setErrores(validaciones);
      return;
    }

    const existe = clientesActualizados.some((item) => item.id === cliente.id);

    guardarClientes(
      existe
        ? clientesActualizados.map((item) => (item.id === cliente.id ? cliente : item))
        : [...clientesActualizados, cliente]
    );

    cerrarFormulario();
  };

  if (activeSection === "agregar") {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Agregar cliente</h1>
            <p className="mt-2 text-slate-500">Registra un nuevo cliente en APEX GYM.</p>
          </div>

          <ClienteForm
            cliente={formulario}
            errores={errores}
            esEdicion={false}
            onChange={setFormulario}
            onSubmit={handleSubmit}
            onCancel={cerrarFormulario}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Gestión de clientes
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {tituloSeccionClientes(activeSection)}
            </h1>
            <p className="mt-2 text-slate-500">
              Administra los clientes registrados en el gimnasio.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={20} />
            Agregar cliente
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, documento o teléfono..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Cliente</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Documento</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Teléfono</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Membresía</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Vencimiento</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((cliente) => (
                  <tr key={cliente.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <UserRound size={19} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{cliente.nombre}</p>
                          <p className="text-sm text-slate-500">{cliente.correo}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">{cliente.documento}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cliente.telefono}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {nombreMembresia(cliente.membresiaId)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          cliente.estado === "Activo"
                            ? "bg-green-100 text-green-700"
                            : cliente.estado === "En mora"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {cliente.estado}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cliente.fechaVencimiento}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(cliente)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Editar cliente"
                      >
                        <Pencil size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredClients.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">No encontramos clientes.</p>
            <p className="mt-1 text-sm text-slate-500">
              Intenta cambiar los filtros o la búsqueda.
            </p>
          </div>
        )}

        {(creando || editando) && (
          <ClienteForm
            cliente={formulario}
            errores={errores}
            esEdicion={editando !== null}
            onChange={setFormulario}
            onSubmit={handleSubmit}
            onCancel={cerrarFormulario}
          />
        )}
      </div>
    </div>
  );
}
