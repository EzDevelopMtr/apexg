// Fechas en la hora del gimnasio (Bogotá), como las escribe la app.
const ZONA = "America/Bogota";

export const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());

export function sumarDias(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Igual que `calculateExpirationDate` de core: un mes desde el 31 cae en el último día. */
export function sumarMeses(fecha, meses) {
  const [a, m, d] = fecha.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m - 1 + meses + 1, 0)).getUTCDate();
  const destino = new Date(Date.UTC(a, m - 1 + meses, Math.min(d, ultimo)));
  return destino.toISOString().slice(0, 10);
}

/** Un instante de ese día, a esa hora local. */
export const instante = (fecha, hora, minuto = 0) =>
  `${fecha}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00-05:00`;

export const pesosApi = (valor) => `${valor}.00`;
