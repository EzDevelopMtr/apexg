"use client";

import { Save, X } from "lucide-react";

import {
  calcularVencimientoCliente,
  entrenadoresIniciales,
  formasPago,
  planesMembresiaIniciales,
  tiposSangre,
  type Cliente,
  type EstadoCliente,
} from "@apexg/core";

/*
  =====================================================
  FORMULARIO DE CLIENTE (RF-04 a RF-08)
  =====================================================
*/

interface ClienteFormProps {
  cliente: Cliente;
  errores: string[];
  onChange: (cliente: Cliente) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  esEdicion: boolean;
}

const estilosInput =
  "w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const estilosLabel = "mb-2 block text-sm font-semibold text-slate-700";
const estilosSelect = `${estilosInput} bg-white`;

export default function ClienteForm({
  cliente,
  errores,
  onChange,
  onSubmit,
  onCancel,
  esEdicion,
}: ClienteFormProps) {
  const planSeleccionado = planesMembresiaIniciales.find(
    (plan) => plan.id === cliente.membresiaId
  );

  const actualizarMembresiaOFecha = (cambios: Partial<Cliente>) => {
    const siguiente = { ...cliente, ...cambios };

    onChange({
      ...siguiente,
      fechaVencimiento: siguiente.fechaIngreso
        ? calcularVencimientoCliente(siguiente.fechaIngreso, siguiente.membresiaId)
        : siguiente.fechaVencimiento,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {esEdicion ? "Editar cliente" : "Agregar cliente"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Completa la información del cliente.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 p-6">
          {errores.length > 0 && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {errores.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <div>
            <label className={estilosLabel}>Nombre completo</label>
            <input
              type="text"
              value={cliente.nombre}
              onChange={(event) => onChange({ ...cliente, nombre: event.target.value })}
              required
              placeholder="Ej. Juan Pérez"
              className={estilosInput}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={estilosLabel}>Documento</label>
              <input
                type="text"
                value={cliente.documento}
                onChange={(event) => onChange({ ...cliente, documento: event.target.value })}
                required
                placeholder="Número de documento"
                className={estilosInput}
              />
            </div>

            <div>
              <label className={estilosLabel}>Teléfono</label>
              <input
                type="tel"
                value={cliente.telefono}
                onChange={(event) => onChange({ ...cliente, telefono: event.target.value })}
                required
                placeholder="300 000 0000"
                className={estilosInput}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={estilosLabel}>Correo electrónico</label>
              <input
                type="email"
                value={cliente.correo}
                onChange={(event) => onChange({ ...cliente, correo: event.target.value })}
                placeholder="cliente@email.com"
                className={estilosInput}
              />
            </div>

            <div>
              <label className={estilosLabel}>Contacto de emergencia</label>
              <input
                type="text"
                value={cliente.contactoEmergencia}
                onChange={(event) =>
                  onChange({ ...cliente, contactoEmergencia: event.target.value })
                }
                required
                placeholder="Nombre y teléfono"
                className={estilosInput}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className={estilosLabel}>Forma de pago</label>
              <select
                value={cliente.formaPago}
                onChange={(event) =>
                  onChange({ ...cliente, formaPago: event.target.value as Cliente["formaPago"] })
                }
                className={estilosSelect}
              >
                {formasPago.map((forma) => (
                  <option key={forma.value} value={forma.value}>
                    {forma.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={estilosLabel}>Tipo de sangre</label>
              <select
                value={cliente.tipoSangre}
                onChange={(event) =>
                  onChange({ ...cliente, tipoSangre: event.target.value as Cliente["tipoSangre"] })
                }
                className={estilosSelect}
              >
                <option value="">Sin definir</option>
                {tiposSangre.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={estilosLabel}>Fecha de cumpleaños</label>
              <input
                type="date"
                value={cliente.fechaCumpleanos}
                onChange={(event) =>
                  onChange({ ...cliente, fechaCumpleanos: event.target.value })
                }
                className={estilosInput}
              />
            </div>
          </div>

          <div>
            <label className={estilosLabel}>Condición médica</label>
            <input
              type="text"
              value={cliente.condicionMedica}
              onChange={(event) =>
                onChange({ ...cliente, condicionMedica: event.target.value })
              }
              placeholder="N/A"
              className={estilosInput}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={estilosLabel}>Tipo de membresía</label>
              <select
                value={cliente.membresiaId}
                onChange={(event) =>
                  actualizarMembresiaOFecha({ membresiaId: event.target.value, entrenadorId: undefined })
                }
                className={estilosSelect}
              >
                {planesMembresiaIniciales
                  .filter((plan) => plan.activo)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className={estilosLabel}>Estado</label>
              <select
                value={cliente.estado}
                onChange={(event) =>
                  onChange({ ...cliente, estado: event.target.value as EstadoCliente })
                }
                className={estilosSelect}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="En mora">En mora</option>
              </select>
            </div>
          </div>

          {planSeleccionado?.requiereEntrenador && (
            <div>
              <label className={estilosLabel}>Entrenador asignado</label>
              <select
                value={cliente.entrenadorId ?? ""}
                onChange={(event) => onChange({ ...cliente, entrenadorId: event.target.value })}
                required
                className={estilosSelect}
              >
                <option value="">Selecciona un entrenador</option>
                {entrenadoresIniciales
                  .filter((entrenador) => entrenador.activo)
                  .map((entrenador) => (
                    <option key={entrenador.id} value={entrenador.id}>
                      {entrenador.nombre}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={estilosLabel}>Fecha de ingreso</label>
              <input
                type="date"
                value={cliente.fechaIngreso}
                onChange={(event) => actualizarMembresiaOFecha({ fechaIngreso: event.target.value })}
                required
                className={estilosInput}
              />
              <p className="mt-1 text-xs text-slate-400">
                Se asigna hoy por defecto; edítala si la membresía inicia otro día.
              </p>
            </div>

            <div>
              <label className={estilosLabel}>Fecha de vencimiento</label>
              <input
                type="date"
                value={cliente.fechaVencimiento}
                readOnly
                className={`${estilosInput} bg-slate-50 text-slate-500`}
              />
              <p className="mt-1 text-xs text-slate-400">
                Calculada automáticamente según el tipo de membresía.
              </p>
            </div>
          </div>

          <div>
            <label className={estilosLabel}>Comentarios / novedades</label>
            <textarea
              value={cliente.comentarios}
              onChange={(event) => onChange({ ...cliente, comentarios: event.target.value })}
              rows={3}
              className={estilosInput}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <Save size={18} />
              Guardar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
