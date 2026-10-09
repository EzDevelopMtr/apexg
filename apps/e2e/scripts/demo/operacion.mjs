// El movimiento de los últimos meses y el de hoy: ventas en el mostrador,
// gastos, comisiones pagadas, ingresos al gimnasio, pases y novedades.
import { GASTOS_DEL_MES, NOVEDADES, VISITANTES } from "./datos.mjs";
import { instante, pesosApi, sumarDias } from "./fechas.mjs";

/** Ventas de los últimos 45 días: más agua y bebidas que suplementos. */
export async function sembrarVentas({ api, r, hoyIso }, productos, clientes) {
  const frecuentes = productos.filter((p) => p.precio < 10_000);
  let total = 0;
  for (let dias = 45; dias >= 0; dias -= 1) {
    const fecha = sumarDias(hoyIso, -dias);
    for (let n = r.numero(1, 4); n > 0; n -= 1) {
      const producto = r.probabilidad(0.04) ? productos[4] : r.elegir(frecuentes);
      const cantidad = producto.precio < 3_000 ? r.numero(1, 3) : 1;
      if (producto.stock - cantidad < 0) continue;
      producto.stock -= cantidad;
      await api.post("/product-sales", {
        inventoryItemId: producto.id,
        clientId: r.probabilidad(0.3) ? r.elegir(clientes).id : undefined,
        quantity: `${cantidad}.000`,
        amount: pesosApi(producto.precio * cantidad),
        paymentMethod: r.probabilidad(0.8) ? "cash" : "transfer",
        soldAt: dias === 0 ? undefined : instante(fecha, r.numero(6, 20), r.numero(0, 59)),
      });
      total += 1;
    }
  }
  return total;
}

/** Los gastos fijos de cada mes desde que arranca la historia; las transferencias con su comprobante. */
export async function sembrarGastos({ api, r, fabrica, hoyIso }, categorias, desde) {
  let total = 0;
  for (let mes = new Date(`${desde.slice(0, 7)}-01T12:00:00Z`); ; mes.setUTCMonth(mes.getUTCMonth() + 1)) {
    const prefijo = mes.toISOString().slice(0, 7);
    if (`${prefijo}-01` > hoyIso) break;
    for (const g of GASTOS_DEL_MES) {
      const fecha = `${prefijo}-${String(g.dia).padStart(2, "0")}`;
      if (fecha < desde || fecha > hoyIso) continue;
      const campos = {
        categoryId: categorias.get(g.categoria),
        concept: g.concepto,
        amount: pesosApi(g.valor),
        expenseDate: fecha,
        paymentMethod: g.transferencia ? "transfer" : "cash",
      };
      if (g.transferencia) {
        const recibo = await fabrica.comprobante({ monto: g.valor, fecha, quien: "Gimnasio Demo", concepto: g.concepto, referencia: `EG-${r.numero(100000, 999999)}` });
        await api.postArchivo("/expenses", campos, recibo, "receipt");
      } else {
        await api.post("/expenses", campos);
      }
      total += 1;
    }
  }
  return total;
}

/** Se les paga lo de meses cerrados; lo de este mes queda pendiente, como en la vida real. */
export async function pagarComisiones({ api, r, fabrica, hoyIso }, entrenadores) {
  const inicioDelMes = `${hoyIso.slice(0, 7)}-01`;
  for (const [i, e] of entrenadores.entries()) {
    const pendientes = (await api.get(`/trainers/${e.id}/commissions`))
      .filter((c) => !c.settled && c.commissionDate < inicioDelMes);
    if (pendientes.length === 0) continue;
    const campos = { commissionIds: JSON.stringify(pendientes.map((c) => c.id)), paymentMethod: i % 2 ? "cash" : "transfer" };
    if (campos.paymentMethod === "cash") {
      await api.postArchivo(`/trainers/${e.id}/commissions/settle`, campos);
    } else {
      const total = pendientes.reduce((t, c) => t + Number(c.trainerAmount), 0);
      const recibo = await fabrica.comprobante({ monto: total, fecha: hoyIso, quien: "Gimnasio Demo", concepto: `Comisiones ${e.fullName}`, referencia: `CO-${r.numero(100000, 999999)}` });
      await api.postArchivo(`/trainers/${e.id}/commissions/settle`, campos, recibo, "receipt");
    }
  }
}

/** Hoy: quién ha entrado, los pases vendidos y las novedades del turno. */
export async function sembrarHoy({ api, r, fabrica, hoyIso }, clientes) {
  const alDia = clientes.filter((c) => c.currentMembership.endDate >= hoyIso);
  const adentro = alDia.slice(0, Math.min(16, alDia.length));
  for (const [i, c] of adentro.entries()) {
    await api.post("/attendances", { clientId: c.id });
    if (i % 3 === 0) await api.post(`/attendances/${c.id}/check-out`);
  }
  for (const [i, nombre] of VISITANTES.entries()) {
    const campos = { visitorName: nombre, amount: pesosApi(6_000), paymentMethod: i === 2 ? "transfer" : "cash" };
    if (i < 2) await api.post("/day-passes", campos);
    else await api.postArchivo("/day-passes", campos, await fabrica.comprobante({ monto: 6_000, fecha: hoyIso, quien: nombre, concepto: "Pase de día", referencia: `PD-${r.numero(100000, 999999)}` }), "receipt");
  }
  const observaciones = NOVEDADES.map((texto) => `### Administrador Demo\n${texto}`).join("\n");
  await api.post("/daily-log", { date: hoyIso, observations: observaciones });
  return adentro.length;
}
