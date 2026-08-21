import type { ReactNode } from "react";


/*
  =====================================================
  PROPIEDADES DEL LAYOUT
  =====================================================
*/

interface ModuleLayoutProps {

  /*
    La sidebar del modulo.

    Antes el Layout construia la sidebar por su
    cuenta. Ahora la recibe como propiedad, porque
    cada modulo tiene su propia navegacion y porque
    la navegacion real (enlaces de Next.js) vive
    en la aplicacion, no en este paquete.
  */

  sidebar: ReactNode;

  /*
    Todo lo que aparezca dentro del Layout.

    Por ejemplo:

    <ModuleLayout sidebar={<ClientesSidebar />}>
      <Clientes />
    </ModuleLayout>

    El contenido de Clientes llegara aqui.
  */

  children: ReactNode;
}


/*
  =====================================================
  LAYOUT DEL MODULO
  =====================================================
*/

export default function ModuleLayout({
  sidebar,
  children,
}: ModuleLayoutProps) {


  return (

    <div className="min-h-screen bg-slate-100">

      {/* Sidebar especifica del modulo */}

      {sidebar}


      {/* =================================================
          CONTENIDO PRINCIPAL

          pl-20 deja espacio para la Sidebar
          cuando esta contraida.
      ================================================= */}

      <main className="min-h-screen pl-20">

        {children}

      </main>

    </div>

  );
}
