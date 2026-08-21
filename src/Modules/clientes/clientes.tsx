import { useMemo, useState } from "react";

import { Search, Plus, Pencil, UserRound } from "lucide-react";

import type { Cliente } from "../../data/clientes";
import { clientesIniciales } from "../../data/clientes";

import ClienteForm from "./clienteform";

/*
  =====================================================
  PROPIEDADES
  =====================================================
*/

interface ClientesProps {

  /*
    Indica qué sección de Clientes
    estamos viendo.

    Ejemplos:

    todos
    agregar
    activos
    por-vencer
    vencidos
  */

  activeSection: string;
}


/*
  =====================================================
  COMPONENTE CLIENTES
  =====================================================
*/

export default function Clientes({
  activeSection,
}: ClientesProps) {


  /*
    =====================================================
    ESTADO DE CLIENTES
    =====================================================

    Inicialmente copiamos los datos ficticios.

    Posteriormente esto será reemplazado
    por datos provenientes del Backend.
  */

  const [clientes, setClientes] =
    useState<Cliente[]>(clientesIniciales);


  /*
    =====================================================
    BÚSQUEDA
    =====================================================
  */

  const [search, setSearch] =
    useState("");


  /*
    =====================================================
    CLIENTE QUE SE ESTÁ EDITANDO
    =====================================================

    null = no estamos editando.

    Cliente = estamos editando ese cliente.
  */

  const [editingClient, setEditingClient] =
    useState<Cliente | null>(null);


  /*
    =====================================================
    FILTRAR CLIENTES
    =====================================================

    useMemo evita realizar el cálculo
    innecesariamente.

    Primero filtramos por sección.

    Después filtramos por búsqueda.
  */

  const filteredClients = useMemo(() => {

    let result = [...clientes];


    /*
      FILTRO SEGÚN SIDEBAR
    */

    if (activeSection === "activos") {

      result = result.filter(
        (cliente) =>
          cliente.estado === "Activo"
      );

    }

    if (activeSection === "por-vencer") {

      result = result.filter(
        (cliente) =>
          cliente.estado === "Por vencer"
      );

    }

    if (activeSection === "vencidos") {

      result = result.filter(
        (cliente) =>
          cliente.estado === "Vencido"
      );

    }


    /*
      FILTRO DE BÚSQUEDA
    */

    if (search.trim()) {

      const searchText =
        search.toLowerCase();


      result = result.filter((cliente) =>

        cliente.nombre
          .toLowerCase()
          .includes(searchText)

        ||

        cliente.documento
          .toLowerCase()
          .includes(searchText)

        ||

        cliente.telefono
          .toLowerCase()
          .includes(searchText)

      );

    }


    return result;

  }, [clientes, activeSection, search]);


  /*
    =====================================================
    GUARDAR CLIENTE
    =====================================================
  */

  const handleSaveClient = (
    client: Cliente
  ) => {

    /*
      Si el cliente ya existe,
      lo estamos EDITANDO.
    */

    const exists = clientes.some(
      (item) => item.id === client.id
    );


    if (exists) {

      setClientes((current) =>
        current.map((item) =>
          item.id === client.id
            ? client
            : item
        )
      );

    }

    /*
      Si no existe,
      estamos CREANDO un cliente nuevo.
    */

    else {

      setClientes((current) => [
        ...current,
        client,
      ]);

    }


    /*
      Cerramos el formulario de edición.
    */

    setEditingClient(null);
  };


  /*
    =====================================================
    TÍTULO DE LA SECCIÓN
    =====================================================
  */

  const titles: Record<string, string> = {

    todos: "Todos los clientes",

    agregar: "Agregar cliente",

    activos: "Clientes activos",

    "por-vencer":
      "Clientes por vencer",

    vencidos: "Clientes vencidos",

  };


  /*
    =====================================================
    SI ESTAMOS AGREGANDO
    =====================================================
  */

  if (activeSection === "agregar") {

    return (

      <div className="p-8">

        <div className="mx-auto max-w-5xl">

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-slate-900">
              Agregar cliente
            </h1>

            <p className="mt-2 text-slate-500">
              Registra un nuevo cliente en APEX GYM.
            </p>

          </div>


          <ClienteForm
            onSave={handleSaveClient}
            onCancel={() => {
              // El formulario se cancela
              // simplemente limpiando la edición.
              setEditingClient(null);
            }}
          />

        </div>

      </div>

    );
  }


  /*
    =====================================================
    VISTA PRINCIPAL
    =====================================================
  */

  return (

    <div className="p-8">

      <div className="mx-auto max-w-7xl">


        {/* ENCABEZADO */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Gestión de clientes
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              {titles[activeSection]}
            </h1>

            <p className="mt-2 text-slate-500">
              Administra los clientes registrados en el gimnasio.
            </p>

          </div>


          {/* BOTÓN AGREGAR */}

          <button
            type="button"
            onClick={() => {

              /*
                Para acceder a "Agregar"
                utilizaremos la Sidebar.

                Aquí por ahora mostramos
                una acción visual.
              */

              setEditingClient({
                id: Date.now(),
                nombre: "",
                documento: "",
                telefono: "",
                correo: "",
                membresia: "Mensual",
                estado: "Activo",
                fechaVencimiento: "",
              });

            }}

            className="
              inline-flex
              items-center
              justify-center
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

            <Plus size={20} />

            Agregar cliente

          </button>

        </div>


        {/* =================================================
            BUSCADOR
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <Search
              size={20}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por nombre, documento o teléfono..."

              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                py-3
                pl-12
                pr-4
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/20
              "
            />

          </div>

        </div>


        {/* =================================================
            TABLA
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Cliente
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Documento
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Teléfono
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Membresía
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Estado
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                    Vencimiento
                  </th>

                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                    Acción
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {filteredClients.map((cliente) => (

                  <tr
                    key={cliente.id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* CLIENTE */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            bg-blue-50
                            text-blue-600
                          "
                        >

                          <UserRound size={19} />

                        </div>

                        <div>

                          <p className="font-semibold text-slate-900">
                            {cliente.nombre}
                          </p>

                          <p className="text-sm text-slate-500">
                            {cliente.correo}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* DOCUMENTO */}

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cliente.documento}
                    </td>


                    {/* TELÉFONO */}

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cliente.telefono}
                    </td>


                    {/* MEMBRESÍA */}

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cliente.membresia}
                    </td>


                    {/* ESTADO */}

                    <td className="px-6 py-4">

                      <span
                        className={`
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-semibold

                          ${
                            cliente.estado === "Activo"
                              ? "bg-green-100 text-green-700"
                              : cliente.estado === "Por vencer"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }
                        `}
                      >
                        {cliente.estado}
                      </span>

                    </td>


                    {/* VENCIMIENTO */}

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {cliente.fechaVencimiento}
                    </td>


                    {/* EDITAR */}

                    <td className="px-6 py-4 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          setEditingClient(cliente)
                        }
                        className="
                          inline-flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          text-slate-500
                          transition
                          hover:bg-blue-50
                          hover:text-blue-600
                        "
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


        {/* =================================================
            MENSAJE SI NO HAY CLIENTES
        ================================================= */}

        {filteredClients.length === 0 && (

          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

            <p className="font-semibold text-slate-700">
              No encontramos clientes.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Intenta cambiar los filtros o la búsqueda.
            </p>

          </div>

        )}


        {/* =================================================
            MODAL / FORMULARIO DE EDICIÓN
        ================================================= */}

        {editingClient && (

          <ClienteForm
            client={editingClient}
            onSave={handleSaveClient}
            onCancel={() =>
              setEditingClient(null)
            }
          />

        )}

      </div>

    </div>

  );
}