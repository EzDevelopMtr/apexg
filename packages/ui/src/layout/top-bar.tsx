import type { ReactNode } from "react";
import Logo from "../components/logo";

export interface TopBarShellProps {
  /** Nombre del módulo, en español. */
  title: string;
  /**
   * Las pestañas del módulo, o nada: un módulo con un solo lugar no las
   * tiene, y la barra queda con el logo y el nombre.
   */
  children?: ReactNode;
  /** A la derecha de la barra: la salida al selector de módulos. */
  trailing: ReactNode;
}

/**
 * La barra superior de cada módulo: logo, módulo y sus pestañas.
 *
 * Reemplaza al riel lateral que se expandía al pasar el mouse: ahí cada
 * sección era un ícono sin texto, y descubrir qué hacía cada uno obligaba a
 * abrirlo. Aquí todas se leen de un vistazo y el contenido gana el ancho
 * completo de la pantalla.
 *
 * El acento propio del módulo NO se usa aquí, igual que en el riel: esos
 * colores son del selector, y dentro del módulo quedarían al lado de las
 * etiquetas de estado, donde un verde dejaría de significar "Activo".
 *
 * Solo presentación: pinta la navegación que la app le entregue, así este
 * paquete sigue sin saber de rutas.
 */
export function TopBarShell({ title, children, trailing }: TopBarShellProps) {
  return (
    // El relleno va POR FUERA del ancho máximo, igual que en el contenido de
    // las páginas (p-8 y dentro max-w-7xl): así el logo queda en la misma
    // vertical que el título, no 32 px más adentro.
    <header className="sticky top-0 z-40 border-b border-shell-line bg-shell/95 px-8 backdrop-blur">
      {/* 80 px de alto en escritorio: el logo completo (pico + APEX + GYM) no
          cabe en 64 sin recortarse por arriba. En pantalla angosta las
          pestañas bajan a su propia fila en vez de quedar apretadas y
          cortadas al lado del logo. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 py-3 md:h-20 md:flex-nowrap md:py-0">
        <Logo size="sm" className="shrink-0" />
        <span className="hidden h-8 w-px shrink-0 bg-shell-line sm:block" />
        <span className="shrink-0 text-sm font-bold uppercase tracking-wider text-body">
          {title}
        </span>

        {/* Con muchas pestañas se desplaza en horizontal en vez de partirse y
            empujar el contenido. */}
        {children ? (
          <nav
            aria-label={`Secciones de ${title}`}
            className="order-last -mx-1 flex w-full min-w-0 items-center gap-1 overflow-x-auto px-1 md:order-none md:w-auto md:flex-1"
          >
            {children}
          </nav>
        ) : null}

        <div className="ml-auto shrink-0">{trailing}</div>
      </div>
    </header>
  );
}
