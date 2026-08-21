import {
  Users,
  CreditCard,
  Wallet,
  Package,
  BarChart3,
  Dumbbell,
} from "lucide-react";


/*
  =====================================================
  PROPIEDADES DEL SELECTOR
  =====================================================
*/

interface ModuleSelectorProps {

  /*
    Función que se ejecutará cuando
    seleccionemos un módulo.
  */

  onSelectModule: (module: string) => void;

  /*
    Función para cerrar sesión.
  */

  onLogout: () => void;
}


/*
  =====================================================
  SELECTOR DE MÓDULOS
  =====================================================
*/

export default function ModuleSelector({
  onSelectModule,
  onLogout,
}: ModuleSelectorProps) {


  /*
    Lista de módulos disponibles.

    Por ahora solamente CLIENTES tendrá
    funcionalidad completa.

    Los demás los iremos construyendo después.
  */

  const modules = [

    {
      id: "clientes",
      name: "Clientes",
      description: "Gestiona los clientes del gimnasio",
      icon: Users,
      available: true,
    },

    {
      id: "membresias",
      name: "Membresías",
      description: "Planes y membresías",
      icon: CreditCard,
      available: false,
    },

    {
      id: "pagos",
      name: "Pagos",
      description: "Control de pagos",
      icon: Wallet,
      available: false,
    },

    {
      id: "inventario",
      name: "Inventario",
      description: "Productos y existencias",
      icon: Package,
      available: false,
    },

    {
      id: "finanzas",
      name: "Finanzas",
      description: "Ingresos y egresos",
      icon: BarChart3,
      available: false,
    },

    {
      id: "entrenadores",
      name: "Entrenadores",
      description: "Gestión de entrenadores",
      icon: Dumbbell,
      available: false,
    },
  ];


  return (

    /*
      CONTENEDOR PRINCIPAL

      min-h-screen:
      ocupa como mínimo toda la pantalla.

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
            Selecciona un módulo
          </h1>

          <p className="mt-2 text-slate-500">
            Selecciona el área que deseas administrar.
          </p>

        </div>


        {/* GRID DE MÓDULOS */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">


          {modules.map((module) => {

            /*
              Guardamos el componente del icono
              en una variable para poder utilizarlo.
            */

            const Icon = module.icon;


            return (

              <button
                key={module.id}
                type="button"

                /*
                  Cuando hacemos clic:

                  onSelectModule("clientes")

                  Esto avisará a App.tsx
                  qué módulo queremos abrir.
                */

                onClick={() => {

                  if (module.available) {
                    onSelectModule(module.id);
                  }

                }}

                disabled={!module.available}

                className={`
                  group
                  rounded-2xl
                  border
                  bg-white
                  p-6
                  text-left
                  shadow-sm
                  transition-all
                  duration-300

                  ${
                    module.available
                      ? `
                        cursor-pointer
                        border-slate-200
                        hover:-translate-y-1
                        hover:border-blue-400
                        hover:shadow-lg
                      `
                      : `
                        cursor-not-allowed
                        border-slate-200
                        opacity-50
                      `
                  }
                `}
              >

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

                  <Icon size={28} />

                </div>


                {/* NOMBRE */}

                <h2 className="text-lg font-bold text-slate-900">
                  {module.name}
                </h2>


                {/* DESCRIPCIÓN */}

                <p className="mt-2 text-sm text-slate-500">
                  {module.description}
                </p>


                {/* ESTADO */}

                {!module.available && (

                  <span className="mt-4 inline-block text-xs font-semibold text-slate-400">
                    Próximamente
                  </span>

                )}

              </button>

            );

          })}

        </div>


        {/* CERRAR SESIÓN */}

        <div className="mt-10">

          <button
            type="button"
            onClick={onLogout}
            className="
              text-sm
              font-medium
              text-slate-500
              transition
              hover:text-red-600
            "
          >
            Cerrar sesión
          </button>

        </div>

      </div>

    </main>
  );
}