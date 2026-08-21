import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react";


/*
  ==========================================
  DASHBOARD
  ==========================================

  Esta será la pantalla principal del
  sistema después de iniciar sesión.

  Por ahora todos los números son
  DATOS FICTICIOS.

  Más adelante vendrán del Backend.
*/

export default function Dashboard() {

  /*
    ========================================
    TARJETAS DE ESTADÍSTICAS
    ========================================

    Guardamos la información en un array
    para no repetir código.
  */

  const statistics = [
    {
      title: "Clientes activos",
      value: "248",
      description: "+12 este mes",
      icon: Users,
    },
    {
      title: "Membresías activas",
      value: "216",
      description: "+8 este mes",
      icon: CreditCard,
    },
    {
      title: "Por vencer",
      value: "32",
      description: "Próximos 7 días",
      icon: AlertTriangle,
    },
    {
      title: "Ingresos del mes",
      value: "$8.450.000",
      description: "+14.5% vs. mes anterior",
      icon: DollarSign,
    },
  ];


  return (

    /*
      ======================================
      CONTENIDO PRINCIPAL
      ======================================

      ml-20:

      Dejamos espacio a la izquierda para
      nuestra Sidebar cerrada.

      Cuando la Sidebar se expanda,
      simplemente se colocará encima del
      contenido.
    */

    <main
      className="
        min-h-screen
        bg-slate-100
        pl-20
      "
    >

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================
            ENCABEZADO
        ================================= */}

        <div
          className="
            mb-8
            flex
            flex-col
            justify-between
            gap-4

            md:flex-row
            md:items-center
          "
        >

          <div>

            <p className="text-sm text-slate-500">
              texto xdd
            </p>

            <h1
              className="
                mt-1
                text-3xl
                font-bold
                tracking-tight
                text-slate-900
              "
            >
              Buenos días, Administrador 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Aquí tienes un resumen.
            </p>

          </div>


          {/* FECHA */}

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              text-sm
              text-slate-600
              shadow-sm
            "
          >
            aqui va la fecha y hora
          </div>

        </div>


        {/* =================================
            TARJETAS
        ================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-5

            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          {statistics.map((stat) => {

            const Icon = stat.icon;

            return (

              <article
                key={stat.title}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                  shadow-sm

                  transition
                  duration-200

                  hover:-translate-y-1
                  hover:shadow-md
                "
              >

                <div
                  className="
                    flex
                    items-start
                    justify-between
                  "
                >

                  {/* INFORMACIÓN */}

                  <div>

                    <p
                      className="
                        text-sm
                        font-medium
                        text-slate-500
                      "
                    >
                      {stat.title}
                    </p>

                    <p
                      className="
                        mt-2
                        text-2xl
                        font-bold
                        text-slate-900
                      "
                    >
                      {stat.value}
                    </p>

                  </div>


                  {/* ICONO */}

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      text-slate-700
                    "
                  >

                    <Icon size={21} />

                  </div>

                </div>


                {/* DESCRIPCIÓN */}

                <p
                  className="
                    mt-4
                    text-xs
                    text-slate-500
                  "
                >
                  {stat.description}
                </p>

              </article>

            );
          })}

        </section>


        {/* =================================
            SEGUNDA SECCIÓN
        ================================= */}

        <section
          className="
            mt-6
            grid
            grid-cols-1
            gap-6
            xl:grid-cols-3
          "
        >

          {/* =================================
              MEMBRESÍAS
          ================================= */}

          <article
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
              xl:col-span-2
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <h2
                  className="
                    text-lg
                    font-semibold
                    text-slate-900
                  "
                >
                  Resumen de membresías
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Estado actual de las membresías.
                </p>

              </div>

              <CreditCard
                size={22}
                className="text-slate-400"
              />

            </div>


            {/* BARRAS */}

            <div className="mt-7 space-y-5">

              {/* ACTIVAS */}

              <div>

                <div
                  className="
                    mb-2
                    flex
                    justify-between
                    text-sm
                  "
                >

                  <span className="text-slate-600">
                    Activas
                  </span>

                  <span className="font-semibold">
                    216
                  </span>

                </div>

                <div
                  className="
                    h-2
                    overflow-hidden
                    rounded-full
                    bg-slate-100
                  "
                >

                  <div
                    className="
                      h-full
                      w-[82%]
                      rounded-full
                      bg-slate-900
                    "
                  />

                </div>

              </div>


              {/* POR VENCER */}

              <div>

                <div
                  className="
                    mb-2
                    flex
                    justify-between
                    text-sm
                  "
                >

                  <span className="text-slate-600">
                    Por vencer
                  </span>

                  <span className="font-semibold">
                    32
                  </span>

                </div>

                <div
                  className="
                    h-2
                    overflow-hidden
                    rounded-full
                    bg-slate-100
                  "
                >

                  <div
                    className="
                      h-full
                      w-[12%]
                      rounded-full
                      bg-amber-400
                    "
                  />

                </div>

              </div>


              {/* VENCIDAS */}

              <div>

                <div
                  className="
                    mb-2
                    flex
                    justify-between
                    text-sm
                  "
                >

                  <span className="text-slate-600">
                    Vencidas
                  </span>

                  <span className="font-semibold">
                    18
                  </span>

                </div>

                <div
                  className="
                    h-2
                    overflow-hidden
                    rounded-full
                    bg-slate-100
                  "
                >

                  <div
                    className="
                      h-full
                      w-[7%]
                      rounded-full
                      bg-red-400
                    "
                  />

                </div>

              </div>

            </div>

          </article>


          {/* =================================
              ACTIVIDAD RECIENTE
          ================================= */}

          <article
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-sm
            "
          >

            <h2
              className="
                text-lg
                font-semibold
                text-slate-900
              "
            >
              Actividad reciente
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Últimos movimientos.
            </p>


            <div className="mt-6 space-y-5">

              {/* ACTIVIDAD 1 */}

              <div className="flex gap-3">

                <div
                  className="
                    mt-1
                    h-2
                    w-2
                    shrink-0
                    rounded-full
                    bg-emerald-500
                  "
                />

                <div>

                  <p className="text-sm font-medium">
                    Juan Pérez
                  </p>

                  <p className="text-xs text-slate-500">
                    Registró una membresía
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Hace 5 minutos
                  </p>

                </div>

              </div>


              {/* ACTIVIDAD 2 */}

              <div className="flex gap-3">

                <div
                  className="
                    mt-1
                    h-2
                    w-2
                    shrink-0
                    rounded-full
                    bg-blue-500
                  "
                />

                <div>

                  <p className="text-sm font-medium">
                    María López
                  </p>

                  <p className="text-xs text-slate-500">
                    Realizó un pago
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Hace 18 minutos
                  </p>

                </div>

              </div>


              {/* ACTIVIDAD 3 */}

              <div className="flex gap-3">

                <div
                  className="
                    mt-1
                    h-2
                    w-2
                    shrink-0
                    rounded-full
                    bg-violet-500
                  "
                />

                <div>

                  <p className="text-sm font-medium">
                    Carlos Gómez
                  </p>

                  <p className="text-xs text-slate-500">
                    Renovó su membresía
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Hace 35 minutos
                  </p>

                </div>

              </div>

            </div>

          </article>

        </section>


        {/* =================================
            ACCIONES RÁPIDAS
        ================================= */}

        <section className="mt-6">

          <h2
            className="
              mb-4
              text-lg
              font-semibold
              text-slate-900
            "
          >
            Acciones rápidas
          </h2>


          <div
            className="
              grid
              grid-cols-1
              gap-4

              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

            <button
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-slate-900
                px-5
                py-4
                text-sm
                font-semibold
                text-white

                transition
                hover:bg-slate-800
              "
            >
              <Users size={18} />
              Nuevo cliente
            </button>


            <button
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                py-4
                text-sm
                font-semibold
                text-slate-700

                transition
                hover:bg-slate-50
              "
            >
              <CreditCard size={18} />
              Nueva membresía
            </button>


            <button
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                py-4
                text-sm
                font-semibold
                text-slate-700

                transition
                hover:bg-slate-50
              "
            >
              <ArrowUp size={18} />
              Registrar pago
            </button>


            <button
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-5
                py-4
                text-sm
                font-semibold
                text-slate-700

                transition
                hover:bg-slate-50
              "
            >
              <ArrowDown size={18} />
              Registrar egreso
            </button>

          </div>

        </section>

      </div>

    </main>
  );
}