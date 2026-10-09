// Llena un gimnasio de DEMOSTRACIÓN con datos ficticios: clientes con foto,
// pagos con comprobante, entrenadores y comisiones, ventas, gastos, ahorros y
// el movimiento de hoy. Entra como el administrador de ese gimnasio, por la
// misma API que usa la app, así que no puede tocar ningún otro gimnasio.
//
//   node apps/e2e/scripts/demo/sembrar-demo.mjs ops/demo-dev.credenciales.env
//
// El archivo (gitignored) lleva DEMO_BASE_URL, DEMO_GYM, DEMO_USERNAME y
// DEMO_PASSWORD. Se niega a correr contra APEX GYM y contra un gimnasio que
// ya tenga clientes: es para uno recién creado.
import { readFileSync, writeFileSync } from "node:fs";
import { conectar } from "./api.mjs";
import { categoriasDeEgresos, sembrarAhorros, sembrarEntrenadores, sembrarInventario } from "./catalogo.mjs";
import { sembrarClientes } from "./clientes.mjs";
import { GASTOS_DEL_MES, azar } from "./datos.mjs";
import { hoy, sumarDias } from "./fechas.mjs";
import { LOGO_SVG, abrirFabrica } from "./imagenes.mjs";
import { pagarComisiones, sembrarGastos, sembrarHoy, sembrarVentas } from "./operacion.mjs";

const CLIENTES = 72;
const DIAS_DE_HISTORIA = 100;
const PROTEGIDOS = new Set(["apex-gym"]);

function leerConfiguracion(ruta) {
  if (!ruta) throw new Error("Uso: node sembrar-demo.mjs <archivo .env con DEMO_*>");
  const valores = Object.fromEntries(
    readFileSync(ruta, "utf8").split(/\r?\n/).filter((l) => /^DEMO_[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  );
  for (const clave of ["DEMO_BASE_URL", "DEMO_GYM", "DEMO_USERNAME", "DEMO_PASSWORD"]) {
    if (!valores[clave]) throw new Error(`Falta ${clave} en ${ruta}`);
  }
  if (PROTEGIDOS.has(valores.DEMO_GYM)) throw new Error(`/${valores.DEMO_GYM} es un gimnasio real: el demo nunca se siembra ahí.`);
  return { base: valores.DEMO_BASE_URL.replace(/\/+$/, ""), gimnasio: valores.DEMO_GYM, usuario: valores.DEMO_USERNAME, clave: valores.DEMO_PASSWORD };
}

/** Lo que el script cuenta mientras avanza (la terminal es su única salida). */
const decir = (texto) => process.stdout.write(`${texto}
`);

const lista = (respuesta) => (Array.isArray(respuesta) ? respuesta : (respuesta?.items ?? []));

async function principal() {
  const config = leerConfiguracion(process.argv[2]);
  decir(`Sembrando ${config.base}/${config.gimnasio} como ${config.usuario}`);
  const api = await conectar(config);
  if (lista(await api.get("/clients")).length > 0) {
    throw new Error(`/${config.gimnasio} ya tiene clientes: este script es para un gimnasio recién creado. No se tocó nada.`);
  }

  const fabrica = await abrirFabrica();
  try {
    const hoyIso = hoy();
    const planes = lista(await api.get("/membership-types")).filter((p) => p.state === 1);
    const contexto = { api, r: azar(), fabrica, hoyIso, planes, entrenadores: [] };

    contexto.entrenadores = await sembrarEntrenadores(api, hoyIso);
    decir(`Entrenadores: ${contexto.entrenadores.length}`);
    const productos = await sembrarInventario(api);
    decir(`Productos: ${productos.length}`);
    const categorias = await categoriasDeEgresos(api, [...new Set(GASTOS_DEL_MES.map((g) => g.categoria))]);

    const clientes = await sembrarClientes(contexto, CLIENTES);
    decir(`Clientes: ${clientes.length}`);
    decir(`Ventas: ${await sembrarVentas(contexto, productos, clientes)}`);
    decir(`Gastos: ${await sembrarGastos(contexto, categorias, sumarDias(hoyIso, -DIAS_DE_HISTORIA))}`);
    await pagarComisiones(contexto, contexto.entrenadores);
    await sembrarAhorros(api, hoyIso);
    decir(`Ingresos de hoy: ${await sembrarHoy(contexto, clientes)}`);
  } finally {
    await fabrica.cerrar();
  }
  const logo = new URL("./logo-demo.svg", import.meta.url);
  writeFileSync(logo, LOGO_SVG);
  decir(`Listo. Logo para subir en el panel: ${logo.pathname.slice(1)}`);
}

principal().catch((error) => {
  process.stderr.write(`\nNo terminó: ${error.message}\n`);
  process.exitCode = 1;
});
