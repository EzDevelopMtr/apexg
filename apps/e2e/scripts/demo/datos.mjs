// Datos ficticios del gimnasio demo. Un generador con semilla fija: dos
// corridas producen el mismo gimnasio, y nada de esto es de una persona real.

export function azar(semilla = 20261009) {
  let s = semilla >>> 0;
  const siguiente = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  return {
    numero: (min, max) => Math.floor(min + siguiente() * (max - min + 1)),
    elegir: (lista) => lista[Math.floor(siguiente() * lista.length)],
    probabilidad: (p) => siguiente() < p,
  };
}

const NOMBRES = ["Valentina", "Santiago", "Camila", "Mateo", "Isabella", "Sebastián", "Mariana", "Nicolás",
  "Daniela", "Samuel", "Sofía", "Alejandro", "Laura", "Juan David", "Gabriela", "Andrés", "Paula", "Tomás",
  "Natalia", "Felipe", "Juliana", "Esteban", "Manuela", "Miguel Ángel", "Sara", "Julián", "Luisa", "Diego",
  "Antonia", "Carlos", "María José", "Simón", "Ana Lucía", "Emilio", "Verónica", "Martín"];
const APELLIDOS = ["Restrepo", "Gómez", "Cárdenas", "Ospina", "Herrera", "Quintero", "Salazar", "Mejía",
  "Pardo", "Rincón", "Vargas", "Zapata", "Arango", "Londoño", "Muñoz", "Castaño", "Ríos", "Montoya",
  "Valencia", "Bedoya", "Echeverri", "Toro", "Correa", "Giraldo"];
const SANGRE = ["O+", "O+", "O+", "A+", "A+", "B+", "AB+", "O-", "A-"];
const CONDICIONES = ["", "", "", "", "Asma leve", "Lesión de rodilla (2024)", "Hipertensión controlada", "Alergia al maní"];

/** Una persona ficticia con todos los datos que pide el alta. */
export function persona(r, indice) {
  const nombre = `${r.elegir(NOMBRES)} ${r.elegir(APELLIDOS)} ${r.elegir(APELLIDOS)}`;
  const usuario = nombre.split(" ")[0].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return {
    fullName: nombre,
    documentNumber: String(1_000_000_000 + indice * 7_919 + r.numero(0, 7_000)),
    phone: `3${r.numero(0, 2)}${r.numero(0, 9)}${r.numero(1_000_000, 9_999_999)}`,
    email: `${usuario}.${indice}@demo.test`,
    emergencyContactName: `${r.elegir(NOMBRES)} ${r.elegir(APELLIDOS)}`,
    emergencyContactPhone: `31${r.numero(0, 9)}${r.numero(1_000_000, 9_999_999)}`,
    bloodType: r.elegir(SANGRE),
    birthDate: `${r.numero(1975, 2006)}-${String(r.numero(1, 12)).padStart(2, "0")}-${String(r.numero(1, 28)).padStart(2, "0")}`,
    medicalCondition: r.elegir(CONDICIONES) || undefined,
  };
}

export const ENTRENADORES = [
  { fullName: "Carolina Duque Henao", documentNumber: "1036600101", maxClients: 12, salary: "1800000.00", certifications: "Entrenamiento funcional" },
  { fullName: "Jhon Fredy Álvarez", documentNumber: "1036600102", maxClients: 10, salary: "1700000.00", certifications: "Fuerza e hipertrofia" },
  { fullName: "Melissa Orozco Patiño", documentNumber: "1036600103", maxClients: 8, salary: "1600000.00", certifications: "Pilates y movilidad" },
];

export const CATEGORIAS_INVENTARIO = ["Bebidas", "Suplementos", "Accesorios"];

/** Productos del mostrador: precio de venta por unidad y existencias de partida. */
export const PRODUCTOS = [
  { name: "Agua 600 ml", categoria: "Bebidas", precio: 2500, stock: 260, minimo: 24 },
  { name: "Bebida hidratante", categoria: "Bebidas", precio: 5000, stock: 160, minimo: 20 },
  { name: "Batido de proteína", categoria: "Suplementos", precio: 9000, stock: 90, minimo: 15 },
  { name: "Barra de proteína", categoria: "Suplementos", precio: 6000, stock: 110, minimo: 20 },
  { name: "Creatina 300 g", categoria: "Suplementos", precio: 85000, stock: 4, minimo: 5 },
  { name: "Toalla de microfibra", categoria: "Accesorios", precio: 18000, stock: 2, minimo: 3 },
];

/** Gastos de cada mes: día del mes, valor y si se pagan por transferencia. */
/** Gastos de cada mes: día del mes, valor, categoría y si se pagan por transferencia. */
export const GASTOS_DEL_MES = [
  { dia: 12, concepto: "Arriendo del local", valor: 900_000, transferencia: true, categoria: "Arriendo" },
  { dia: 15, concepto: "Pago recepción medio tiempo", valor: 700_000, transferencia: true, categoria: "Nómina" },
  { dia: 6, concepto: "Energía eléctrica", valor: 240_000, transferencia: true, categoria: "Servicios públicos" },
  { dia: 8, concepto: "Agua y alcantarillado", valor: 95_000, transferencia: true, categoria: "Servicios públicos" },
  { dia: 10, concepto: "Internet y música ambiental", valor: 120_000, transferencia: true, categoria: "Servicios públicos" },
  { dia: 18, concepto: "Productos de aseo y antibacterial", valor: 85_000, transferencia: false, categoria: "Insumos de aseo/antibacteriales" },
  { dia: 22, concepto: "Mantenimiento de máquinas", valor: 160_000, transferencia: false, categoria: "Mantenimiento" },
  { dia: 25, concepto: "Publicidad en redes", valor: 110_000, transferencia: true, categoria: "Publicidad" },
];

export const VISITANTES = ["Andrea Molina", "Kevin Sánchez", "Lorena Pineda"];

export const NOVEDADES = [
  "Se cambió la banda de la caminadora 2; quedó funcionando.",
  "Llegó el pedido de bebidas hidratantes.",
];
