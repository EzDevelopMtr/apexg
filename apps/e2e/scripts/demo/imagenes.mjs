// Imágenes de prueba para el gimnasio demo, dibujadas aquí: nada se descarga.
// Las fotos son avatares ilustrados y los comprobantes llevan «DEMO» a la vista,
// para que nadie los confunda con un soporte real.
import { chromium } from "@playwright/test";

const TONOS = [
  ["#0ea5e9", "#6366f1"], ["#14b8a6", "#0ea5e9"], ["#8b5cf6", "#ec4899"],
  ["#f97316", "#ef4444"], ["#22c55e", "#14b8a6"], ["#6366f1", "#a855f7"],
  ["#0284c7", "#22d3ee"], ["#db2777", "#f59e0b"],
];

const pesos = (n) => `$ ${n.toLocaleString("es-CO")}`;
const iniciales = (nombre) => nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function htmlAvatar(nombre, indice) {
  const [a, b] = TONOS[indice % TONOS.length];
  const giro = (indice * 47) % 360;
  return `<div id="lienzo" style="width:480px;height:480px;position:relative;overflow:hidden;
    background:linear-gradient(${giro}deg,${a},${b});font-family:Segoe UI,Arial,sans-serif">
    <div style="position:absolute;left:50%;top:150px;width:170px;height:170px;margin-left:-85px;border-radius:50%;background:rgba(255,255,255,.88)"></div>
    <div style="position:absolute;left:50%;top:330px;width:320px;height:260px;margin-left:-160px;border-radius:160px 160px 0 0;background:rgba(255,255,255,.88)"></div>
    <div style="position:absolute;left:50%;top:205px;transform:translateX(-50%);font-size:58px;font-weight:700;color:${a}">${iniciales(nombre)}</div>
  </div>`;
}

function htmlComprobante({ monto, fecha, concepto, referencia, quien }) {
  const fila = (k, v) => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e5e7eb">
    <span style="color:#6b7280">${k}</span><b>${v}</b></div>`;
  return `<div id="lienzo" style="width:420px;padding:28px;background:#fff;font-family:Segoe UI,Arial,sans-serif;color:#111827;position:relative">
    <div style="position:absolute;right:18px;top:18px;padding:4px 10px;border:2px solid #dc2626;color:#dc2626;font-weight:800;transform:rotate(8deg)">DEMO</div>
    <div style="font-size:13px;color:#6b7280">Banco de Pruebas · Comprobante</div>
    <div style="font-size:22px;font-weight:700;margin:6px 0 2px">Transferencia exitosa</div>
    <div style="font-size:34px;font-weight:800;color:#059669;margin:10px 0 16px">${pesos(monto)}</div>
    ${fila("Fecha", fecha)}${fila("Concepto", concepto)}${fila("Origen", quien)}${fila("Destino", "Gimnasio Demo")}${fila("Referencia", referencia)}
    <div style="margin-top:14px;font-size:11px;color:#9ca3af">Imagen generada para pruebas. Sin validez.</div>
  </div>`;
}

/** Un navegador sin ventana que convierte HTML en PNG. Cerrarlo al terminar. */
export async function abrirFabrica() {
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ deviceScaleFactor: 1 });
  const dibujar = async (html) => {
    await pagina.setContent(`<body style="margin:0">${html}</body>`);
    return pagina.locator("#lienzo").screenshot({ type: "png" });
  };
  return {
    foto: (nombre, indice) => dibujar(htmlAvatar(nombre, indice)),
    comprobante: (datos) => dibujar(htmlComprobante(datos)),
    cerrar: () => navegador.close(),
  };
}

/** El logo del demo, en SVG: el panel lo acepta tal cual. */
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0ea5e9"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>
  <rect width="240" height="240" rx="56" fill="url(#g)"/>
  <path d="M120 46 186 176H150L120 114 90 176H54Z" fill="#fff"/>
  <rect x="46" y="188" width="148" height="14" rx="7" fill="#fff" opacity=".85"/>
  <text x="120" y="226" text-anchor="middle" font-family="Segoe UI,Arial" font-size="20" font-weight="800" fill="#fff">DEMO</text>
</svg>`;
