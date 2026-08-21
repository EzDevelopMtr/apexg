/*
  =====================================================
  PUNTO DE ENTRADA DE @apexg/ui
  =====================================================

  Componentes de interfaz compartidos.

  IMPORTANTE:

  Este paquete es presentacional. No conoce Next.js
  ni el enrutador, para poder reutilizarse en
  cualquier aplicacion del monorepo.

  La navegacion (enlaces, rutas, sesion) vive
  en apps/web.
*/


/* --------------------------- Primitivos ------------- */

export { default as Button } from "./components/button";

export {
  default as Card,
  CardHeader,
  CardBody,
} from "./components/card";

export { default as Input } from "./components/input";

export { default as Modal } from "./components/modal";

export {
  default as Table,
  TableRow,
  TableCell,
  TableEmpty,
} from "./components/table";


/* --------------------------- Layout ----------------- */

export { default as ModuleLayout } from "./layout/module-layout";

export {
  SidebarShell,
  EtiquetaSidebar,
} from "./layout/sidebar";

export { clasesItemSidebar } from "./layout/clases-sidebar";


/* --------------------------- Iconos ----------------- */

export {
  iconos,
  obtenerIcono,
  type ComponenteIcono,
} from "./iconos";
