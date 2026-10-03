# Operación con Docker

Fase 6 de [plan-multi-gimnasio.md](plan-multi-gimnasio.md). Una sola
instalación (`docker-compose.yml`) atiende a todos los gimnasios: Postgres,
migraciones, backend y web. Solo `web` publica un puerto, en `127.0.0.1`, y
Tailscale Funnel sigue apuntando ahí.

| Servicio | Qué hace |
|---|---|
| `postgres` | La base de todos los gimnasios (volumen `pgdata`) |
| `migrate` | Aplica las migraciones pendientes y termina (`ops/migrate.sh`) |
| `backend` | API; archivos en el volumen `files` (`/data/<tipo>/<id-gimnasio>/`) |
| `web` | Next.js en el puerto `WEB_PORT` |

Publicar una versión es reconstruir y levantar: `migrate` corre solo antes
del backend, y si una migración falla el backend no arranca.

## Entorno de pruebas (no toca producción)

La misma app con base, archivos y puerto propios (proyecto `apexg-pruebas`,
web en 3200), sembrada con una copia de `apexg_work`, nunca con datos del
piloto:

```powershell
powershell -ExecutionPolicy Bypass -File ops\pruebas.ps1             # levantar o actualizar
powershell -ExecutionPolicy Bypass -File ops\pruebas.ps1 -Reiniciar  # borrar todo y volver a sembrar
```

Link público propio, en el mismo equipo y otro puerto de Tailscale Funnel
(Funnel admite 443, 8443 y 10000):

```powershell
tailscale funnel --bg --https=8443 http://127.0.0.1:3200
```

Queda en `https://pcandres.taildb102a.ts.net:8443`. Apagarlo:
`tailscale funnel --https=8443 off`. Necesita `ops/pruebas.env` (gitignored,
a partir de `ops/ensayo.env.example` con `WEB_PORT=3200` y `DB_PORT=5434`).

## Respaldos

```powershell
powershell -ExecutionPolicy Bypass -File ops\respaldar.ps1 -EnvFile ops\produccion.env -Proyecto apexg
```

Base completa + archivos de todos los gimnasios en
`Downloads\apexg-respaldos\docker\<fecha-hora>\`; guarda los últimos 14.
**Programarlo a diario** en el Programador de tareas de Windows (lo crea el
dueño del equipo).

Exportar un gimnasio (para entregarle sus datos o darlo de baja):

```powershell
powershell -ExecutionPolicy Bypass -File ops\exportar-gimnasio.ps1 -Slug gimnasio-x -EnvFile ops\produccion.env -Proyecto apexg
```

Un CSV por tabla con sus filas y un `.tgz` con sus archivos. Los archivos
subidos antes de la fase 6 están en la raíz de cada carpeta, sin gimnasio, y
no entran en la exportación (hoy todos son de APEX).

## Paso a producción (lo ejecuta el dueño)

Todo automatizado en `ops/pasar-a-docker.ps1`, con `ops/produccion.env` ya
generado (gitignored; mismo `JWT_ACCESS_SECRET` que `apexg-prod`, así las
sesiones abiertas siguen valiendo). Las migraciones 021–023 se ensayaron
sobre una copia de `apexg_dev` el 2026-10-03: aplican limpias.

```powershell
powershell -ExecutionPolicy Bypass -File ops\pasar-a-docker.ps1
```

Respalda, copia base y archivos al stack nuevo, apaga el anterior, levanta
el nuevo y comprueba `/apex-gym`. Si la comprobación falla, vuelve solo a la
producción anterior. Los pasos a mano equivalentes, por si hiciera falta:


Hoy producción corre fuera de Docker: `apexg-prod` + `produccion.ps1`, base
`apexg_dev` en el contenedor `apexg-postgres`, archivos en
`Downloads\apexg-data`. El paso conviene hacerlo fuera del horario del gimnasio.

1. **Respaldo** de lo actual: `pg_dump` de `apexg_dev` y copia de
   `Downloads\apexg-data` (lo hace `publicar.ps1`, o a mano).
2. **Entorno:** copiar `ops/ensayo.env.example` a `ops/produccion.env` con
   `WEB_PORT=3000`, `DB_PORT=5433`, contraseñas nuevas y el MISMO
   `JWT_ACCESS_SECRET` de `apps/backend/.env` de producción (así las sesiones
   abiertas siguen valiendo).
3. **Base:** `docker compose --env-file ops/produccion.env -p apexg up -d postgres`,
   y restaurar el dump con `pg_restore --no-owner` dentro de ese contenedor.
4. **Archivos:** copiar `apexg-data\receipts` y `apexg-data\client-photos` al
   volumen (por ejemplo con `docker cp` al contenedor `backend` en
   `/data/receipts` y `/data/client-photos`).
5. **Corte:** parar la producción actual (`Stop-Prod` de `produccion.ps1`) para
   liberar el puerto 3000 y levantar todo:
   `docker compose --env-file ops/produccion.env -p apexg up -d --build`.
   Aplica 021–023 solo.
6. **Super admin:** `docker compose -p apexg exec backend node dist/cli/create-platform-admin.js --email ... --name "..."`.
7. **Comprobar** `https://pcandres.taildb102a.ts.net/apex-gym` y `/admin`.

**Volver atrás:** `docker compose -p apexg stop` y `Start-Prod`. El contenedor
`apexg-postgres` y `apexg_dev` no se tocan en ningún paso, así que siguen ahí.

Después del paso, `iniciar-apexg.ps1` debería arrancar con
`docker compose ... up -d` en vez de `Start-Prod` (Docker Desktop con
"iniciar al encender" basta, porque los servicios tienen `restart: unless-stopped`).
