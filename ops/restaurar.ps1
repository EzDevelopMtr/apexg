# =====================================================
# APEX GYM — restaura un respaldo de respaldar.ps1 sobre una instalación.
#
#   powershell -ExecutionPolicy Bypass -File ops\restaurar.ps1 -Carpeta <respaldo> -EnvFile ops\produccion.env -Proyecto apexg
#
# <respaldo> es una carpeta con base.dump y archivos.tgz: la local
# (Downloads\apexg-respaldos\docker\<fecha-hora>) o la copia de Google Drive.
#
# REEMPLAZA la base y los archivos de TODOS los gimnasios por los del
# respaldo: lo registrado después de esa fecha se pierde. Por eso, antes de
# tocar nada: comprueba que el respaldo se puede restaurar y respalda el
# estado actual en <Destino>\antes-de-restaurar\. Pide escribir el nombre del
# proyecto para confirmar (-Confirmado lo omite, solo para pruebas).
# =====================================================
param(
  [Parameter(Mandatory)][string]$Carpeta,
  [string]$EnvFile = "ops\produccion.env",
  [string]$Proyecto = "apexg",
  [string]$Destino = "$env:USERPROFILE\Downloads\apexg-respaldos\docker",
  [switch]$Confirmado
)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repo $EnvFile
$compose = @("compose", "--env-file", $envPath, "-p", $Proyecto, "-f", (Join-Path $repo "docker-compose.yml"))
$Carpeta = (Resolve-Path $Carpeta).Path

function Invoke-Docker {
  # docker escribe su progreso en stderr; en PowerShell 5.1 eso no es un error.
  $ErrorActionPreference = "Continue"
  $salida = & docker @args 2>&1
  if ($LASTEXITCODE -ne 0) { throw "docker $($args -join ' ') falló: $salida" }
  $salida
}
function Paso([string]$texto) { Write-Output "== $texto" }

if ($Carpeta -match 'FALLIDO') { throw "Ese respaldo quedó marcado como fallido; elegir otro." }

Paso "Comprobando que el respaldo se puede restaurar"
& (Join-Path $PSScriptRoot "verificar-respaldo.ps1") -Carpeta $Carpeta

if (-not $Confirmado) {
  Write-Output "Se reemplazarán TODOS los datos de '$Proyecto' por los de $Carpeta."
  if ((Read-Host "Escriba $Proyecto para continuar") -ne $Proyecto) { throw "Cancelado: no se tocó nada." }
}

Paso "Encendiendo Postgres"
Invoke-Docker @compose up -d --wait postgres | Out-Null

Paso "Respaldando el estado actual por si hay que deshacer"
$previo = Join-Path $Destino "antes-de-restaurar"
& (Join-Path $PSScriptRoot "respaldar.ps1") -EnvFile $EnvFile -Proyecto $Proyecto -Destino $previo -Conservar 1000
if ($LASTEXITCODE -ne 0) { throw "No se pudo respaldar el estado actual; no se restauró nada." }

Paso "Deteniendo web y backend"
Invoke-Docker @compose stop web backend | Out-Null

Paso "Restaurando la base"
$postgres = (Invoke-Docker @compose ps -q postgres | Out-String).Trim()
Invoke-Docker cp (Join-Path $Carpeta "base.dump") "${postgres}:/tmp/restaurar.dump" | Out-Null
$sh = 'dropdb -U $POSTGRES_USER --force --if-exists $POSTGRES_DB && createdb -U $POSTGRES_USER $POSTGRES_DB && ' +
  'pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --no-owner --exit-on-error /tmp/restaurar.dump && rm -f /tmp/restaurar.dump'
Invoke-Docker @compose exec -T postgres sh -c $sh | Out-Null

Paso "Restaurando los archivos"
# El volumen se toma del contenedor del backend (detenido), no del nombre: en
# producción el volumen no sigue la convención de compose (operacion-docker.md).
$backend = (Invoke-Docker @compose ps -aq backend | Out-String).Trim()
$montajes = Invoke-Docker inspect -f '{{json .Mounts}}' $backend | Out-String | ConvertFrom-Json
$volumen = ($montajes | Where-Object Destination -eq '/data').Name
if (-not $volumen) { throw "No se encontró el volumen /data del backend." }
Invoke-Docker run --rm -v "${volumen}:/data" -v "${Carpeta}:/respaldo:ro" postgres:16 `
  sh -c 'find /data -mindepth 1 -delete && tar -xzf /respaldo/archivos.tgz -C /data' | Out-Null

Paso "Levantando la aplicación (aplica migraciones pendientes)"
Invoke-Docker @compose up -d | Out-Null

$puerto = (Select-String -Path $envPath -Pattern '^WEB_PORT=(\d+)').Matches.Groups[1].Value
if (-not $puerto) { $puerto = "3000" }
$slug = (Select-String -Path $envPath -Pattern '^DEFAULT_GYM_SLUG=(.+)').Matches.Groups[1].Value
if (-not $slug) { $slug = "apex-gym" }
$url = "http://127.0.0.1:$puerto/$slug"
for ($i = 0; $i -lt 30; $i++) {
  try { if ((Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200) { break } } catch { Start-Sleep 2 }
}
if ($i -eq 30) { throw "La app no respondió en $url. El estado anterior está en $previo." }
Write-Output "Restaurado desde $Carpeta. La app responde en $url. Estado anterior guardado en $previo."
