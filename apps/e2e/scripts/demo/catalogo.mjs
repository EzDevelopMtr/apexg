// Lo que el gimnasio tiene antes de recibir a nadie: entrenadores, productos,
// categorías y bolsillos de ahorro.
import { CATEGORIAS_INVENTARIO, ENTRENADORES, PRODUCTOS } from "./datos.mjs";
import { pesosApi, sumarDias } from "./fechas.mjs";

export async function sembrarEntrenadores(api, hoyIso) {
  const creados = [];
  for (const [i, e] of ENTRENADORES.entries()) {
    const fila = await api.post("/trainers", {
      ...e,
      phone: `30010000${i + 10}`,
      hiredAt: sumarDias(hoyIso, -400 + i * 60),
    });
    creados.push({ ...fila, maxClients: e.maxClients, asignados: 0 });
  }
  return creados;
}

export async function sembrarInventario(api) {
  const categorias = new Map();
  for (const nombre of CATEGORIAS_INVENTARIO) {
    const c = await api.post("/inventory-categories", { name: nombre });
    categorias.set(nombre, c.id);
  }
  const productos = [];
  for (const p of PRODUCTOS) {
    const item = await api.post("/inventory-items", {
      name: p.name,
      categoryId: categorias.get(p.categoria),
      unitOfMeasure: "unit",
      initialStock: String(p.stock),
      minimumStock: String(p.minimo),
    });
    productos.push({ ...p, id: item.id });
  }
  return productos;
}

/** Las categorías de egresos por nombre, creando las que el gimnasio no trae. */
export async function categoriasDeEgresos(api, nombres) {
  const existentes = await api.get("/expense-categories");
  const porNombre = new Map(existentes.map((c) => [c.name, c.id]));
  for (const nombre of nombres) {
    if (!porNombre.has(nombre)) porNombre.set(nombre, (await api.post("/expense-categories", { name: nombre })).id);
  }
  return porNombre;
}

export async function sembrarAhorros(api, hoyIso) {
  const remo = await api.post("/savings-pockets", { name: "Máquina de remo", goalAmount: pesosApi(3_500_000) });
  await api.post(`/savings-pockets/${remo.id}/contributions`, { amount: pesosApi(600_000), savedOn: sumarDias(hoyIso, -55), notes: "Excedente de agosto" });
  await api.post(`/savings-pockets/${remo.id}/contributions`, { amount: pesosApi(450_000), savedOn: sumarDias(hoyIso, -20), notes: "Excedente de septiembre" });
  const fondo = await api.post("/savings-pockets", { name: "Fondo de emergencias", goalAmount: pesosApi(2_000_000) });
  await api.post(`/savings-pockets/${fondo.id}/contributions`, { amount: pesosApi(300_000), savedOn: sumarDias(hoyIso, -10) });
}

