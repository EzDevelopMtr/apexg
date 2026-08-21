/*
  =====================================================
  DATOS FICTICIOS DE CLIENTES
  =====================================================

  IMPORTANTE:

  Estos datos NO vienen de una base de datos.

  Los utilizamos únicamente para construir
  y probar el Frontend.

  Más adelante estos datos serán reemplazados
  por información proveniente del Backend.
  =====================================================
*/


/*
  -----------------------------------------------------
  INTERFACE CLIENTE
  -----------------------------------------------------

  Esta interface define cómo debe ser un cliente.

  TypeScript utilizará esta estructura para
  ayudarnos a evitar errores.
*/

export interface Cliente {

  // Identificador único del cliente.
  id: number;

  // Nombre del cliente.
  nombre: string;

  // Número de documento.
  documento: string;

  // Número telefónico.
  telefono: string;

  // Correo electrónico.
  correo: string;

  // Tipo de membresía.
  membresia: string;

  // Estado actual del cliente.
  estado: "Activo" | "Por vencer" | "Vencido";

  // Fecha en la que termina la membresía.
  fechaVencimiento: string;
}


/*
  -----------------------------------------------------
  CLIENTES DE PRUEBA
  -----------------------------------------------------

  Posteriormente estos datos serán obtenidos
  desde una API.
*/

export const clientesIniciales: Cliente[] = [

  {
    id: 1,
    nombre: "Juan Pérez",
    documento: "1001234567",
    telefono: "3001234567",
    correo: "juan@email.com",
    membresia: "Mensual",
    estado: "Activo",
    fechaVencimiento: "2026-09-15",
  },

  {
    id: 2,
    nombre: "Laura Gómez",
    documento: "1007654321",
    telefono: "3017654321",
    correo: "laura@email.com",
    membresia: "Trimestral",
    estado: "Activo",
    fechaVencimiento: "2026-10-20",
  },

  {
    id: 3,
    nombre: "Carlos Rodríguez",
    documento: "1012345678",
    telefono: "3102345678",
    correo: "carlos@email.com",
    membresia: "Mensual",
    estado: "Por vencer",
    fechaVencimiento: "2026-08-25",
  },

  {
    id: 4,
    nombre: "Ana Martínez",
    documento: "1018765432",
    telefono: "3158765432",
    correo: "ana@email.com",
    membresia: "Mensual",
    estado: "Vencido",
    fechaVencimiento: "2026-07-20",
  },

  {
    id: 5,
    nombre: "Pedro Sánchez",
    documento: "1023456789",
    telefono: "3203456789",
    correo: "pedro@email.com",
    membresia: "Anual",
    estado: "Activo",
    fechaVencimiento: "2027-01-10",
  },

];