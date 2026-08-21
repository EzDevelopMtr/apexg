import type { ReactNode } from "react";
import ModuleSidebar from "./moduleSidebar";


/*
  =====================================================
  PROPIEDADES DEL LAYOUT
  =====================================================
*/

interface ModuleLayoutProps {

  /*
    Todo lo que aparezca dentro del Layout.

    Por ejemplo:

    <ModuleLayout>
      <Clientes />
    </ModuleLayout>

    El contenido de Clientes llegará aquí.
  */

  children: ReactNode;

  /*
    Sección activa de la Sidebar.
  */

  activeSection: string;

  /*
    Función para cambiar sección.
  */

  onSectionChange: (section: string) => void;

  /*
    Volver al selector de módulos.
  */

  onBackToModules: () => void;
}


/*
  =====================================================
  LAYOUT DEL MÓDULO
  =====================================================
*/

export default function ModuleLayout({
  children,
  activeSection,
  onSectionChange,
  onBackToModules,
}: ModuleLayoutProps) {


  return (

    <div className="min-h-screen bg-slate-100">

      {/* Sidebar específica del módulo */}

      <ModuleSidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onBackToModules={onBackToModules}
      />


      {/* =================================================
          CONTENIDO PRINCIPAL

          pl-20 deja espacio para la Sidebar
          cuando está contraída.
      ================================================= */}

      <main className="min-h-screen pl-20">

        {children}

      </main>

    </div>

  );
}