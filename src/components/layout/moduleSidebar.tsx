import {
  Users,
  List,
  UserPlus,
  UserCheck,
  Clock,
  UserX,
  ArrowLeft,
} from "lucide-react";


/*
  =====================================================
  PROPIEDADES
  =====================================================
*/

interface ModuleSidebarProps {

  /*
    Función para volver al selector
    de módulos.
  */

  onBackToModules: () => void;

  /*
    Opción seleccionada actualmente.
  */

  activeSection: string;

  /*
    Función para cambiar de sección.
  */

  onSectionChange: (section: string) => void;
}


/*
  =====================================================
  SIDEBAR DEL MÓDULO CLIENTES
  =====================================================
*/

export default function ModuleSidebar({
  onBackToModules,
  activeSection,
  onSectionChange,
}: ModuleSidebarProps) {


  /*
    Opciones disponibles dentro
    del módulo Clientes.
  */

  const options = [

    {
      id: "todos",
      name: "Todos los clientes",
      icon: List,
    },

    {
      id: "agregar",
      name: "Agregar cliente",
      icon: UserPlus,
    },

    {
      id: "activos",
      name: "Clientes activos",
      icon: UserCheck,
    },

    {
      id: "por-vencer",
      name: "Por vencer",
      icon: Clock,
    },

    {
      id: "vencidos",
      name: "Vencidos",
      icon: UserX,
    },

  ];


  return (

    <aside
      className="
        group
        fixed
        left-0
        top-0
        z-40
        h-screen
        w-20
        overflow-hidden
        bg-slate-950
        text-white
        transition-all
        duration-300
        hover:w-72
      "
    >

      <div className="flex h-full flex-col">


        {/* =================================================
            ENCABEZADO
        ================================================= */}

        <div className="flex h-20 items-center border-b border-white/10 px-5">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-600
            "
          >

            <Users size={22} />

          </div>


          <div
            className="
              ml-4
              min-w-max
              opacity-0
              transition-opacity
              duration-200
              group-hover:opacity-100
            "
          >

            <p className="font-bold">
              CLIENTES
            </p>

            <p className="text-xs text-slate-400">
              APEX GYM
            </p>

          </div>

        </div>


        {/* =================================================
            OPCIONES
        ================================================= */}

        <nav className="flex-1 px-3 py-6">


          {options.map((option) => {

            const Icon = option.icon;

            const isActive =
              activeSection === option.id;


            return (

              <button
                key={option.id}
                type="button"

                onClick={() =>
                  onSectionChange(option.id)
                }

                className={`
                  mb-2
                  flex
                  h-12
                  w-full
                  items-center
                  rounded-xl
                  px-3
                  transition

                  ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }
                `}
              >

                <Icon
                  size={21}
                  className="shrink-0"
                />


                <span
                  className="
                    ml-4
                    min-w-max
                    text-sm
                    font-medium
                    opacity-0
                    transition-opacity
                    duration-200
                    group-hover:opacity-100
                  "
                >
                  {option.name}
                </span>

              </button>

            );

          })}

        </nav>


        {/* =================================================
            VOLVER AL SELECTOR
        ================================================= */}

        <div className="border-t border-white/10 p-3">

          <button
            type="button"
            onClick={onBackToModules}

            className="
              flex
              h-12
              w-full
              items-center
              rounded-xl
              px-3
              text-slate-400
              transition
              hover:bg-white/10
              hover:text-white
            "
          >

            <ArrowLeft
              size={21}
              className="shrink-0"
            />

            <span
              className="
                ml-4
                min-w-max
                text-sm
                opacity-0
                transition-opacity
                duration-200
                group-hover:opacity-100
              "
            >
              Cambiar módulo
            </span>

          </button>

        </div>

      </div>

    </aside>
  );
}