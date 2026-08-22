"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { modulos } from "@apexg/core";

import { obtenerIcono } from "@apexg/ui";

import { useSesion } from "../lib/auth";


/*
  =====================================================
  SELECTOR DE MODULOS
  =====================================================

  Es el mismo grid de antes. Los cambios:

    1. La lista de modulos ya no esta escrita aqui:
       viene de @apexg/core, que es el mismo lugar
       que usan las rutas.

    2. Ya no avisamos a App.tsx con onSelectModule.
       Cada modulo disponible es un enlace real,
       asi que se puede abrir en otra pestana y
       compartir la URL.
*/


/*
  -----------------------------------------------------
  CLASES COMPARTIDAS DE LA TARJETA
  -----------------------------------------------------
*/

const clasesTarjeta = `
  group
  rounded-2xl
  border
  bg-white
  p-6
  text-left
  shadow-sm
  transition-all
  duration-300
`;

const clasesDisponible = `
  cursor-pointer
  border-slate-200
  hover:-translate-y-1
  hover:border-blue-400
  hover:shadow-lg
`;

const clasesNoDisponible = `
  cursor-not-allowed
  border-slate-200
  opacity-50
`;


export default function ModuleGrid() {

  const router = useRouter();

  const { cerrarSesion } = useSesion();


  /*
    -----------------------------------------------------
    CERRAR SESION
    -----------------------------------------------------
  */

  const handleLogout = () => {

    cerrarSesion();

    router.replace("/login");
  };


  return (

    /*
      CONTENEDOR PRINCIPAL

      min-h-screen:
      ocupa como minimo toda la pantalla.

      bg-slate-100:
      fondo gris claro.
    */

    <main className="min-h-screen bg-slate-100 px-6 py-10">

      <div className="mx-auto max-w-6xl">


        {/* ENCABEZADO */}

        <div className="mb-10">

          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-600">
            APEX GYM
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Selecciona un modulo
          </h1>

          <p className="mt-2 text-slate-500">
            Selecciona el area que deseas administrar.
          </p>

        </div>


        {/* GRID DE MODULOS */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">


          {modulos.map((modulo) => {

            /*
              Guardamos el componente del icono
              en una variable para poder utilizarlo.
            */

            const Icono = obtenerIcono(modulo.icono);


            /*
              Contenido interno de la tarjeta.

              Es igual para los modulos disponibles
              y para los que todavia no existen.
            */

            const contenido = (

              <>

                {/* ICONO */}

                <div
                  className="
                    mb-5
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                    transition
                    group-hover:bg-blue-600
                    group-hover:text-white
                  "
                >

                  <Icono size={28} />

                </div>


                {/* NOMBRE */}

                <h2 className="text-lg font-bold text-slate-900">
                  {modulo.nombre}
                </h2>


                {/* DESCRIPCION */}

                <p className="mt-2 text-sm text-slate-500">
                  {modulo.descripcion}
                </p>


                {/* ESTADO */}

                {!modulo.disponible && (

                  <span className="mt-4 inline-block text-xs font-semibold text-slate-400">
                    Proximamente
                  </span>

                )}

              </>

            );


            /*
              MODULO TODAVIA NO CONSTRUIDO

              Lo dejamos como boton deshabilitado
              para que no se pueda pulsar.
            */

            if (!modulo.disponible || !modulo.ruta) {

              return (

                <button
                  key={modulo.id}
                  type="button"
                  disabled
                  className={`${clasesTarjeta} ${clasesNoDisponible}`}
                >
                  {contenido}
                </button>

              );

            }


            /*
              MODULO DISPONIBLE

              Enlace real hacia su ruta.
            */

            return (

              <Link
                key={modulo.id}
                href={modulo.ruta}
                className={`${clasesTarjeta} ${clasesDisponible} block`}
              >
                {contenido}
              </Link>

            );

          })}

        </div>


        {/* CERRAR SESION */}

        <div className="mt-10">

          <button
            type="button"
            onClick={handleLogout}
            className="
              text-sm
              font-medium
              text-slate-500
              transition
              hover:text-red-600
            "
          >
            Cerrar sesion
          </button>

        </div>

      </div>

    </main>
  );
}
