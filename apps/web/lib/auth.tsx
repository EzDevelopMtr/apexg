"use client";

/*
  =====================================================
  SESION DE LA APLICACION
  =====================================================

  Antes el estado "isLoggedIn" vivia dentro de
  App.tsx. Con Next.js ya no existe un App.tsx que
  envuelva todo, asi que la sesion vive aqui, en un
  contexto de React, y se guarda en sessionStorage
  para que no se pierda al recargar la pagina.

  ATENCION - ESTO NO ES SEGURIDAD REAL

  La validacion ocurre en el navegador y las
  credenciales estan escritas en el codigo, igual
  que antes. Sirve unicamente para construir el
  Frontend.

  Cuando exista el Backend hay que reemplazar
  iniciarSesion por una llamada a la API y proteger
  las rutas en el servidor (middleware.ts).
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";


/*
  -----------------------------------------------------
  CREDENCIALES TEMPORALES DE ADMIN
  -----------------------------------------------------
*/

const USUARIO_ADMIN = "apexg";
const CLAVE_ADMIN = "apex2026";


/*
  -----------------------------------------------------
  DONDE GUARDAMOS LA SESION
  -----------------------------------------------------
*/

const CLAVE_ALMACENAMIENTO = "apexg:sesion";


/*
  -----------------------------------------------------
  FORMA DE LA SESION
  -----------------------------------------------------
*/

export interface Sesion {
  usuario: string;
}


interface ContextoSesion {

  // null = no hay sesion.
  sesion: Sesion | null;

  /*
    true mientras leemos sessionStorage.

    Lo necesitamos porque en el primer render del
    navegador todavia no sabemos si hay sesion, y
    no queremos mandar al login a alguien que si
    la tiene.
  */
  cargando: boolean;

  // Devuelve true si las credenciales son correctas.
  iniciarSesion: (
    usuario: string,
    clave: string
  ) => boolean;

  cerrarSesion: () => void;
}


const Contexto = createContext<ContextoSesion | null>(null);


/*
  =====================================================
  PROVEEDOR
  =====================================================

  Se coloca una sola vez, en app/layout.tsx.
*/

export function ProveedorSesion({
  children,
}: {
  children: ReactNode;
}) {

  const [sesion, setSesion] =
    useState<Sesion | null>(null);

  const [cargando, setCargando] =
    useState(true);


  /*
    Al montar, recuperamos la sesion guardada.
  */

  useEffect(() => {

    try {

      const guardado =
        window.sessionStorage.getItem(
          CLAVE_ALMACENAMIENTO
        );

      if (guardado) {
        /*
          Leemos sessionStorage DESPUES de montar y no
          al inicializar el estado, porque en el
          servidor no existe window. Es el patron
          correcto aunque el linter lo senale.
        */
        // oxlint-disable-next-line react/set-state-in-effect
        setSesion(JSON.parse(guardado) as Sesion);
      }

    } catch {

      /*
        Si el JSON estaba corrupto simplemente
        empezamos sin sesion.
      */

      setSesion(null);
    }

    setCargando(false);

  }, []);


  /*
    -----------------------------------------------------
    INICIAR SESION
    -----------------------------------------------------
  */

  const iniciarSesion = useCallback(
    (usuario: string, clave: string) => {

      if (
        usuario !== USUARIO_ADMIN ||
        clave !== CLAVE_ADMIN
      ) {
        return false;
      }

      const nueva: Sesion = { usuario };

      setSesion(nueva);

      window.sessionStorage.setItem(
        CLAVE_ALMACENAMIENTO,
        JSON.stringify(nueva)
      );

      return true;
    },
    []
  );


  /*
    -----------------------------------------------------
    CERRAR SESION
    -----------------------------------------------------
  */

  const cerrarSesion = useCallback(() => {

    setSesion(null);

    window.sessionStorage.removeItem(
      CLAVE_ALMACENAMIENTO
    );

  }, []);


  const valor = useMemo(
    () => ({
      sesion,
      cargando,
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion, cargando, iniciarSesion, cerrarSesion]
  );


  return (
    <Contexto.Provider value={valor}>
      {children}
    </Contexto.Provider>
  );
}


/*
  =====================================================
  HOOK PARA LEER LA SESION
  =====================================================
*/

// oxlint-disable-next-line react/only-export-components
export function useSesion(): ContextoSesion {

  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error(
      "useSesion debe usarse dentro de ProveedorSesion"
    );
  }

  return contexto;
}
