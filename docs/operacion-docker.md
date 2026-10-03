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

## Ensayo (no toca producción)

Puertos y volúmenes propios (`apexg-ensayo`, web en 3200, base en 5434):

```bash
cp ops/ensayo.env.example ops/ensayo.env   # y poner secretos reales
docker compose --env-file ops/ensayo.env -p apexg-ensayo up -d --build
```

Para ensayar con datos, restaurar antes una copia de `apexg_work` en su
Postgres (ver "Paso a producción", punto 3, cambiando proyecto y archivo).

Bajarlo y borrar sus datos: `docker compose -p apexg-ensayo down -v`.

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
