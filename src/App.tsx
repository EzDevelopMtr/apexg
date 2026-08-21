import { useState } from "react";

import Login from "./pages/login/login";

import ModuleSelector from "./pages/moduleSelector/moduleSelector";



import ModuleLayout
  from "./components/layout/moduleLayout";

import Clientes
  from "./Modules/clientes/clientes";


/*
  =====================================================
  APP PRINCIPAL
  =====================================================

  App.tsx será el encargado de controlar
  el flujo general de la aplicación.

  Flujo:

  LOGIN
    ↓
  SELECTOR DE MÓDULOS
    ↓
  MÓDULO SELECCIONADO
    ↓
  CONTENIDO DEL MÓDULO
*/


function App() {


  /*
    ===================================================
    AUTENTICACIÓN
    ===================================================

    false = mostrar Login

    true = usuario autenticado
  */

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);


  /*
    ===================================================
    MÓDULO SELECCIONADO
    ===================================================

    null significa que todavía
    no hemos seleccionado ningún módulo.

    Por ejemplo:

    "clientes"

    significa que estamos dentro
    del módulo Clientes.
  */

  const [selectedModule, setSelectedModule] =
    useState<string | null>(null);


  /*
    ===================================================
    SECCIÓN DEL MÓDULO
    ===================================================

    Dentro de Clientes tendremos:

    todos
    agregar
    activos
    por-vencer
    vencidos
  */

  const [activeSection, setActiveSection] =
    useState("todos");


  /*
    ===================================================
    LOGIN
    ===================================================
  */

  const handleLogin = (
    username: string
  ) => {

    console.log(
      "Usuario autenticado:",
      username
    );

    /*
      Usuario correcto.

      Pasamos del Login al selector.
    */

    setIsLoggedIn(true);
  };


  /*
    ===================================================
    CERRAR SESIÓN
    ===================================================
  */

  const handleLogout = () => {

    /*
      Cerramos sesión.
    */

    setIsLoggedIn(false);

    /*
      También eliminamos cualquier
      módulo seleccionado.
    */

    setSelectedModule(null);

    /*
      Volvemos a la sección inicial.
    */

    setActiveSection("todos");
  };


  /*
    ===================================================
    VOLVER AL SELECTOR
    ===================================================
  */

  const handleBackToModules = () => {

    /*
      Quitamos el módulo actual.

      Esto hace que App.tsx vuelva
      a mostrar ModuleSelector.
    */

    setSelectedModule(null);

    /*
      Cuando volvamos al selector,
      dejamos Clientes en "Todos".
    */

    setActiveSection("todos");
  };


  /*
    ===================================================
    PASO 1
    ===================================================

    Si NO estamos autenticados,
    mostramos Login.
  */

  if (!isLoggedIn) {

    return (
      <Login
        onLogin={handleLogin}
      />
    );

  }


  /*
    ===================================================
    PASO 2
    ===================================================

    Si estamos autenticados pero NO
    hemos seleccionado un módulo,
    mostramos el selector.
  */

  if (!selectedModule) {

    return (

      <ModuleSelector
        onSelectModule={setSelectedModule}
        onLogout={handleLogout}
      />

    );

  }


  /*
    ===================================================
    PASO 3
    ===================================================

    Si seleccionamos Clientes,
    mostramos su Layout.
  */

  if (selectedModule === "clientes") {

    return (

      <ModuleLayout

        activeSection={activeSection}

        onSectionChange={setActiveSection}

        onBackToModules={handleBackToModules}

      >

        <Clientes
          activeSection={activeSection}
        />

      </ModuleLayout>

    );

  }


  /*
    ===================================================
    MÓDULOS QUE TODAVÍA NO EXISTEN
    ===================================================

    Cuando creemos Membresías, Pagos, etc.,
    agregaremos aquí sus componentes.
  */

  return (

    <ModuleSelector
      onSelectModule={setSelectedModule}
      onLogout={handleLogout}
    />

  );
}


export default App;