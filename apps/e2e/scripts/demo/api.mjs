// La API del gimnasio por la misma puerta que usa la app: el proxy del web
// (/<gimnasio>/api/...). En producción el backend no está expuesto, así que
// es la única forma, y además respeta los permisos del usuario que entra.

/** Una sesión del administrador del gimnasio. Se renueva sola cada pocos minutos. */
export async function conectar({ base, gimnasio, usuario, clave }) {
  let cookie = "";
  let desde = 0;

  async function entrar() {
    const res = await fetch(`${base}/${gimnasio}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: usuario, password: clave }),
    });
    if (!res.ok) throw new Error(`No se pudo entrar a /${gimnasio}: ${res.status} ${await res.text()}`);
    cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    desde = Date.now();
  }

  async function pedir(metodo, ruta, { json, form } = {}) {
    // El token dura 15 minutos: se pide otro mucho antes.
    if (Date.now() - desde > 8 * 60_000) await entrar();
    const res = await fetch(`${base}/${gimnasio}/api/backend${ruta}`, {
      method: metodo,
      headers: { cookie, ...(json ? { "content-type": "application/json" } : {}) },
      body: json ? JSON.stringify(json) : form,
    });
    const texto = await res.text();
    if (!res.ok) throw new Error(`${metodo} ${ruta} → ${res.status}: ${texto}`);
    return texto ? JSON.parse(texto) : null;
  }

  /** Campos de texto y un archivo en un solo cuerpo multipart. */
  function multipart(campos, archivo, nombreCampo, nombreArchivo) {
    const form = new FormData();
    for (const [k, v] of Object.entries(campos)) if (v !== undefined && v !== null) form.append(k, String(v));
    if (archivo) form.append(nombreCampo, new Blob([archivo], { type: "image/png" }), nombreArchivo);
    return form;
  }

  await entrar();
  return {
    get: (ruta) => pedir("GET", ruta),
    post: (ruta, json) => pedir("POST", ruta, { json }),
    patch: (ruta, json) => pedir("PATCH", ruta, { json }),
    postArchivo: (ruta, campos, archivo, nombreCampo) =>
      pedir("POST", ruta, { form: multipart(campos, archivo, nombreCampo, `${nombreCampo}.png`) }),
  };
}
