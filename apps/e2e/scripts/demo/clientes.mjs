// Los clientes del demo, cada uno con su foto, su historia de membresías y sus
// pagos: unos renuevan mes a mes, otros dejan de venir y quedan en mora, y
// algunos pagan por abonos.
import { persona } from "./datos.mjs";
import { instante, pesosApi, sumarDias } from "./fechas.mjs";

/** Cuánto pesa cada plan entre los clientes, como en un gimnasio de barrio. */
const REPARTO = [
  ["Mensualidad (lunes a sábado)", 45], ["Mes 3 veces por semana", 15], ["Promo amigos/familiar", 7],
  ["Promo folleto físico", 5], ["Quincena", 8], ["Semana", 5], ["Personalizado", 8], ["Semipersonalizado", 7],
];

function elegirPlan(r, planes) {
  let x = r.numero(1, REPARTO.reduce((t, [, peso]) => t + peso, 0));
  for (const [nombre, peso] of REPARTO) {
    if ((x -= peso) <= 0) return planes.find((p) => p.name === nombre) ?? planes[0];
  }
  return planes[0];
}

async function pagar(contexto, cliente, { membresiaId, monto, fecha }) {
  const { api, r, fabrica, hoyIso } = contexto;
  const transferencia = r.probabilidad(0.4);
  const campos = {
    clientMembershipId: membresiaId,
    amount: pesosApi(monto),
    paymentMethod: transferencia ? "transfer" : "cash",
    // Hoy, a la hora real: un pago con hora futura se vería raro en el listado.
    paidAt: fecha === hoyIso ? undefined : instante(fecha, r.numero(6, 20), r.numero(0, 59)),
  };
  if (!transferencia) return api.post("/payments", campos);
  const comprobante = await fabrica.comprobante({
    monto, fecha, quien: cliente.fullName, concepto: "Pago de membresía",
    referencia: `DM-${r.numero(100000, 999999)}`,
  });
  return api.postArchivo("/payments", campos, comprobante, "receipt");
}

/** El pago de un ciclo: completo, o por abonos (a veces el segundo aún no llega). */
async function pagarCiclo(contexto, cliente, { membresia, plan, esElUltimo }) {
  const { r, hoyIso } = contexto;
  const precio = Number(plan.price);
  const minimo = plan.minimumPayment ? Number(plan.minimumPayment) : null;
  if (minimo && r.probabilidad(0.18)) {
    await pagar(contexto, cliente, { membresiaId: membresia.id, monto: minimo, fecha: membresia.startDate });
    const segundo = sumarDias(membresia.startDate, r.numero(4, 12));
    if (segundo <= hoyIso && !(esElUltimo && r.probabilidad(0.6))) {
      await pagar(contexto, cliente, { membresiaId: membresia.id, monto: precio - minimo, fecha: segundo });
    }
    return;
  }
  await pagar(contexto, cliente, { membresiaId: membresia.id, monto: precio, fecha: membresia.startDate });
}

function entrenadorPara(plan, entrenadores) {
  if (!plan.trainerShare) return undefined;
  const libre = entrenadores.find((e) => e.asignados < e.maxClients);
  if (libre) libre.asignados += 1;
  return libre?.id;
}

/** Un cliente con foto, inscrito en el pasado, y todas sus renovaciones hasta hoy. */
async function sembrarCliente(contexto, indice) {
  const { api, r, fabrica, hoyIso, planes, entrenadores } = contexto;
  const datos = persona(r, indice);
  let plan = elegirPlan(r, planes);
  const trainerId = entrenadorPara(plan, entrenadores);
  if (plan.trainerShare && !trainerId) plan = planes.find((p) => p.name.startsWith("Mensualidad")) ?? plan;

  const foto = await fabrica.foto(datos.fullName, indice);
  // Un gimnasio ya establecido: la mayoría lleva meses; unos pocos son nuevos.
  const inicio = sumarDias(hoyIso, -(r.probabilidad(0.75) ? r.numero(65, 100) : r.numero(0, 64)));
  let fila = await api.postArchivo("/clients", { ...datos, membershipTypeId: plan.id, startDate: inicio, trainerId }, foto, "photo");
  // Los planes cortos se renuevan menos: quien compra una semana suele probar.
  const constancia = plan.durationUnit === "month" ? 0.9 : 0.5;
  for (;;) {
    const m = fila.currentMembership;
    const renueva = m.endDate <= hoyIso && r.probabilidad(constancia);
    await pagarCiclo(contexto, datos, { membresia: m, plan, esElUltimo: !renueva });
    if (!renueva) return fila;
    fila = await api.post(`/clients/${fila.id}/memberships`, { membershipTypeId: plan.id, startDate: m.endDate, trainerId });
  }
}

export async function sembrarClientes(contexto, cantidad) {
  const clientes = [];
  for (let i = 0; i < cantidad; i += 1) {
    clientes.push(await sembrarCliente(contexto, i));
    if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${cantidad} clientes
`);
  }
  return clientes;
}
