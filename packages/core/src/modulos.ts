/*
  =====================================================
  CATALOGO DE MODULOS Y SECCIONES
  =====================================================

  Antes esta informacion vivia duplicada dentro
  de los componentes (moduleSelector y moduleSidebar).

  Ahora vive aqui, en un solo lugar, porque la
  necesitan tres consumidores distintos:

    1. El selector de modulos (para pintar el grid)
    2. La sidebar (para pintar la navegacion)
    3. Las rutas de Next.js (para validar la URL)

  IMPORTANTE:

  Este paquete no conoce React, por eso los iconos
  se guardan como un NOMBRE (texto) y no como
  componente. El paquete @apexg/ui traduce ese
  nombre al icono real de lucide-react.
*/


/*
  -----------------------------------------------------
  NOMBRES DE ICONO DISPONIBLES
  -----------------------------------------------------
*/

export type NombreIcono =
  | "usuarios"
  | "tarjeta"
  | "billetera"
  | "paquete"
  | "grafico"
  | "mancuerna"
  | "lista"
  | "usuario-mas"
  | "usuario-ok"
  | "reloj"
  | "usuario-x";


/*
  -----------------------------------------------------
  MODULO DEL SISTEMA
  -----------------------------------------------------
*/

export interface Modulo {

  // Identificador usado en la URL.
  id: string;

  // Nombre visible.
  nombre: string;

  // Descripcion corta que aparece en la tarjeta.
  descripcion: string;

  // Icono que representa al modulo.
  icono: NombreIcono;

  /*
    Si el modulo ya esta construido.

    Los que estan en false se muestran
    como "Proximamente".
  */
  disponible: boolean;

  /*
    Ruta a la que navegamos al abrirlo.

    Es null mientras el modulo no exista.
  */
  ruta: string | null;
}


/*
  -----------------------------------------------------
  MODULOS
  -----------------------------------------------------

  Por ahora solamente CLIENTES tiene
  funcionalidad completa.
*/

export const modulos: Modulo[] = [

  {
    id: "clientes",
    nombre: "Clientes",
    descripcion: "Gestiona los clientes del gimnasio",
    icono: "usuarios",
    disponible: true,
    ruta: "/modulos/clientes/todos",
  },

  {
    id: "membresias",
    nombre: "Membresias",
    descripcion: "Planes y membresias",
    icono: "tarjeta",
    disponible: false,
    ruta: null,
  },

  {
    id: "pagos",
    nombre: "Pagos",
    descripcion: "Control de pagos",
    icono: "billetera",
    disponible: false,
    ruta: null,
  },

  {
    id: "inventario",
    nombre: "Inventario",
    descripcion: "Productos y existencias",
    icono: "paquete",
    disponible: false,
    ruta: null,
  },

  {
    id: "finanzas",
    nombre: "Finanzas",
    descripcion: "Ingresos y egresos",
    icono: "grafico",
    disponible: false,
    ruta: null,
  },

  {
    id: "entrenadores",
    nombre: "Entrenadores",
    descripcion: "Gestion de entrenadores",
    icono: "mancuerna",
    disponible: false,
    ruta: null,
  },

];


/*
  -----------------------------------------------------
  SECCIONES DEL MODULO CLIENTES
  -----------------------------------------------------

  Cada seccion es un segmento de la URL:

    /modulos/clientes/todos
    /modulos/clientes/agregar
    /modulos/clientes/activos
    /modulos/clientes/por-vencer
    /modulos/clientes/vencidos
*/

export interface SeccionClientes {

  // Identificador usado en la URL.
  id: string;

  // Texto que aparece en la sidebar.
  nombre: string;

  // Titulo grande que aparece en la pagina.
  titulo: string;

  // Icono de la sidebar.
  icono: NombreIcono;
}


export const seccionesClientes: SeccionClientes[] = [

  {
    id: "todos",
    nombre: "Todos los clientes",
    titulo: "Todos los clientes",
    icono: "lista",
  },

  {
    id: "agregar",
    nombre: "Agregar cliente",
    titulo: "Agregar cliente",
    icono: "usuario-mas",
  },

  {
    id: "activos",
    nombre: "Clientes activos",
    titulo: "Clientes activos",
    icono: "usuario-ok",
  },

  {
    id: "por-vencer",
    nombre: "Por vencer",
    titulo: "Clientes por vencer",
    icono: "reloj",
  },

  {
    id: "vencidos",
    nombre: "Vencidos",
    titulo: "Clientes vencidos",
    icono: "usuario-x",
  },

];


/*
  -----------------------------------------------------
  SECCION POR DEFECTO
  -----------------------------------------------------
*/

export const seccionClientesPorDefecto = "todos";


/*
  -----------------------------------------------------
  VALIDAR UNA SECCION QUE VIENE DE LA URL
  -----------------------------------------------------

  Si alguien escribe a mano

    /modulos/clientes/cualquier-cosa

  necesitamos saber que esa seccion no existe
  para poder mostrar un 404.
*/

export function esSeccionClientes(
  valor: string
): boolean {

  return seccionesClientes.some(
    (seccion) => seccion.id === valor
  );
}


/*
  -----------------------------------------------------
  BUSCAR EL TITULO DE UNA SECCION
  -----------------------------------------------------
*/

export function tituloSeccionClientes(
  id: string
): string {

  const seccion = seccionesClientes.find(
    (item) => item.id === id
  );

  return seccion?.titulo ?? "Clientes";
}
