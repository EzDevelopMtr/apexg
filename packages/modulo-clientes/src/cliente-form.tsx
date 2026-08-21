"use client";

import { useState } from "react";

import {
  X,
  Save,
} from "lucide-react";

import type { Cliente } from "@apexg/core";


/*
  =====================================================
  PROPIEDADES DEL FORMULARIO
  =====================================================
*/

interface ClienteFormProps {

  /*
    Cliente existente.

    Si existe → estamos editando.

    Si no existe → estamos creando.
  */

  client?: Cliente;

  /*
    Función que se ejecutará al guardar.
  */

  onSave: (client: Cliente) => void;

  /*
    Función para cancelar.
  */

  onCancel: () => void;
}


/*
  =====================================================
  FORMULARIO DE CLIENTE
  =====================================================
*/

export default function ClienteForm({
  client,
  onSave,
  onCancel,
}: ClienteFormProps) {


  /*
    =====================================================
    ESTADOS DEL FORMULARIO
    =====================================================
  */

  const [nombre, setNombre] =
    useState(client?.nombre ?? "");

  const [documento, setDocumento] =
    useState(client?.documento ?? "");

  const [telefono, setTelefono] =
    useState(client?.telefono ?? "");

  const [correo, setCorreo] =
    useState(client?.correo ?? "");

  const [membresia, setMembresia] =
    useState(client?.membresia ?? "Mensual");

  const [estado, setEstado] =
    useState<Cliente["estado"]>(
      client?.estado ?? "Activo"
    );

  const [fechaVencimiento, setFechaVencimiento] =
    useState(
      client?.fechaVencimiento ?? ""
    );


  /*
    =====================================================
    GUARDAR
    =====================================================
  */

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    /*
      Evitamos que el navegador
      recargue la página.
    */

    event.preventDefault();


    /*
      Creamos el objeto Cliente.
    */

    const newClient: Cliente = {

      /*
        Si estamos editando utilizamos
        el ID existente.

        Si estamos creando generamos
        uno nuevo.
      */

      id: client?.id ?? Date.now(),

      nombre,
      documento,
      telefono,
      correo,
      membresia,
      estado,
      fechaVencimiento,
    };


    /*
      Enviamos el cliente al componente padre.
    */

    onSave(newClient);
  };


  return (

    /*
      ===================================================
      MODAL
      ===================================================
    */

    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
    >

      <div
        className="
          max-h-[90vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >


        {/* =================================================
            ENCABEZADO
        ================================================= */}

        <div className="flex items-center justify-between border-b border-slate-200 p-6">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              {client
                ? "Editar cliente"
                : "Agregar cliente"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Completa la información del cliente.
            </p>

          </div>


          {/* CERRAR */}

          <button
            type="button"
            onClick={onCancel}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
          >

            <X size={20} />

          </button>

        </div>


        {/* =================================================
            FORMULARIO
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >


          {/* NOMBRE */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nombre completo
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(event) =>
                setNombre(event.target.value)
              }
              required
              placeholder="Ej. Juan Pérez"
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/20
              "
            />

          </div>


          {/* DOCUMENTO + TELÉFONO */}

          <div className="grid gap-5 md:grid-cols-2">


            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Documento
              </label>

              <input
                type="text"
                value={documento}
                onChange={(event) =>
                  setDocumento(event.target.value)
                }
                required
                placeholder="Número de documento"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

            </div>


            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Teléfono
              </label>

              <input
                type="tel"
                value={telefono}
                onChange={(event) =>
                  setTelefono(event.target.value)
                }
                required
                placeholder="300 000 0000"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

            </div>

          </div>


          {/* CORREO */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>

            <input
              type="email"
              value={correo}
              onChange={(event) =>
                setCorreo(event.target.value)
              }
              placeholder="cliente@email.com"
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/20
              "
            />

          </div>


          {/* MEMBRESÍA + ESTADO */}

          <div className="grid gap-5 md:grid-cols-2">


            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Membresía
              </label>

              <select
                value={membresia}
                onChange={(event) =>
                  setMembresia(event.target.value)
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              >

                <option value="Mensual">
                  Mensual
                </option>

                <option value="Trimestral">
                  Trimestral
                </option>

                <option value="Semestral">
                  Semestral
                </option>

                <option value="Anual">
                  Anual
                </option>

              </select>

            </div>


            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Estado
              </label>

              <select
                value={estado}
                onChange={(event) =>
                  setEstado(
                    event.target.value as Cliente["estado"]
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              >

                <option value="Activo">
                  Activo
                </option>

                <option value="Por vencer">
                  Por vencer
                </option>

                <option value="Vencido">
                  Vencido
                </option>

              </select>

            </div>

          </div>


          {/* FECHA */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Fecha de vencimiento
            </label>

            <input
              type="date"
              value={fechaVencimiento}
              onChange={(event) =>
                setFechaVencimiento(
                  event.target.value
                )
              }
              required
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                px-4
                py-3
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/20
              "
            />

          </div>


          {/* =================================================
              BOTONES
          ================================================= */}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

            <button
              type="button"
              onClick={onCancel}
              className="
                rounded-xl
                px-5
                py-3
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-100
              "
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:bg-blue-700
              "
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