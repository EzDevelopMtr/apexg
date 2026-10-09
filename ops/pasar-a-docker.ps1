# =====================================================
# APEX GYM — pasar producción de apexg-prod (node suelto) a Docker Compose.
# Lo ejecuta el dueño, fuera del horario del gimnasio:
#
#   powershell -ExecutionPolicy Bypass -File ops\pasar-a-docker.ps1
#
# Pasos (docs/operacion-docker.md): respaldo -> base y archivos al nuevo
# stack -> corte -> comprobación. Si la comprobación falla, vuelve solo a la
# producción anterior. NUNCA modifica apexg-postgres ni apexg_dev: solo los
# lee para copiarlos, así que volver atrás siempre es posible.
# =====================================================
param(
  [string]$EnvFile = "ops\produccion.env",
  [string]$Proyecto = "apexg"
)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
. "C:\Users\evila\Downloads\apexg-respaldos\arranque\produccion.ps1"
$compose = @("compose", "--env-file", (Join-Path $repo $EnvFile), "-p", $Proyecto, "-f", (Join-Path $repo "docker-compose.yml"))
function Step([string]$texto) { Write-Output "`n== $texto" }

if (-not (Test-Path (Join-Path $repo $EnvFile))) { throw "Falta $EnvFile (ver ops/ensayo.env.example)." }
Wait-Docker

# Primera vez: los volúmenes del stack NO pueden existir todavía. Si existen,
# o son de un intento anterior o (peor) de otra cosa con el mismo nombre: el
# 2026-10-03 un nombre repetido montó la base del piloto en el contenedor nuevo.
# Se listan en vez de `docker volume inspect`: con stderr redirigido, PowerShell
# 5.1 convierte el "no such volume" (el caso bueno) en un error que detiene todo.
$existentes = docker volume ls -q
foreach ($volumen in "${Proyecto}_stack_db", "${Proyecto}_stack_files") {
  if ($existentes -contains $volumen) { throw "El volumen $volumen ya existe: revisar antes de seguir. No se tocó nada." }
}

Step "1. Respaldo de la producción actual"
$respaldo = "C:\Users\evila\Downloads\apexg-respaldos\pre-docker-" + (Get-Date -Format "yyyy-MM-dd_HHmm")
New-Item -ItemType Directory -Force $respaldo | Out-Null
docker start apexg-postgres | Out-Null
docker exec apexg-postgres pg_dump -U postgres -Fc -d $ProdDb -f /tmp/pre-docker.dump
if ($LASTEXITCODE -ne 0) { throw "pg_dump de $ProdDb falló: no se tocó nada." }
docker cp apexg-postgres:/tmp/pre-docker.dump "$respaldo\apexg_dev.dump"
Copy-Item -Recurse $ProdData "$respaldo\apexg-data"
Write-Output "Respaldo en $respaldo"

Step "2. Base nueva con los datos del piloto"
& docker @compose up -d postgres
do { Start-Sleep 2; & docker @compose exec -T postgres pg_isready -q } while ($LASTEXITCODE -ne 0)
# La consulta va por stdin: PowerShell 5.1 rompe las comillas anidadas al pasar argumentos.
$hay = "SELECT count(*) FROM information_schema.tables WHERE table_name = 'companies'" | & docker @compose exec -T postgres sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB -tA'
if ("$hay".Trim() -ne "0") { throw "La base nueva ya tiene datos: este script es para el primer paso. No se tocó producción." }
$pg = (& docker @compose ps -q postgres).Trim()
docker cp "$respaldo\apexg_dev.dump" "${pg}:/tmp/piloto.dump"
& docker @compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner /tmp/piloto.dump'
if ($LASTEXITCODE -ne 0) { throw "pg_restore falló. Producción sigue intacta; revisar y repetir con la base nueva vacía." }

Step "3. Archivos al volumen"
# Mismos subdirectorios que usan RECEIPTS_DIR / CLIENT_PHOTOS_DIR dentro del contenedor.
docker run --rm -v "${Proyecto}_stack_files:/data" -v "${ProdData}:/src:ro" postgres:16 sh -c "cp -a /src/. /data/ && ls /data"

Step "4. Corte: se apaga la producción anterior y se levanta la nueva"
& docker @compose build
if ($LASTEXITCODE -ne 0) { throw "La imagen no compiló. Producción sigue intacta." }
Stop-Prod
& docker @compose up -d

Step "5. Comprobación"
$ok = $false
for ($i = 0; $i -lt 40 -and -not $ok; $i++) {
  Start-Sleep 3
  try { $ok = (Invoke-WebRequest "http://127.0.0.1:3000/apex-gym" -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200 } catch {}
}
if (-not $ok) {
  Write-Output "La nueva no respondió: volviendo a la producción anterior."
  & docker @compose stop
  Start-Prod
  if (Test-Prod) { Write-Output "Producción anterior arriba de nuevo. Revisar: docker compose -p $Proyecto logs" }
  throw "Paso a Docker revertido."
}

Write-Output "`nListo: https://pcandres.taildb102a.ts.net/apex-gym ya sale de Docker."
Write-Output "Falta crear tu super admin:"
Write-Output "  docker compose -p $Proyecto exec backend node dist/cli/create-platform-admin.js --email TU_CORREO --name `"TU NOMBRE`""
Write-Output "Y cambiar iniciar-apexg.ps1: en lugar de 'docker start apexg-postgres' + 'Start-Prod', usar"
Write-Output "  docker compose --env-file $repo\$EnvFile -p $Proyecto -f $repo\docker-compose.yml up -d"
