# =====================================================
# APEX GYM — respaldo completo de la instalación en Docker.
#
#   powershell -ExecutionPolicy Bypass -File ops\respaldar.ps1 -EnvFile ops\produccion.env -Proyecto apexg
#
# Deja en <Destino>\<fecha-hora>\ la base completa (pg_dump formato custom) y
# los archivos (comprobantes, fotos, logos) de TODOS los gimnasios. Conserva
# los últimos <Conservar> respaldos y borra los más viejos.
#
# Con la base compartida, este respaldo es la red de seguridad: restaurar un
# solo gimnasio dentro de ella no es trivial (ver exportar-gimnasio.ps1).
# Programarlo a diario lo hace el dueño del equipo (Programador de tareas).
# =====================================================
param(
  [string]$EnvFile = "ops\produccion.env",
  [string]$Proyecto = "apexg",
  [string]$Destino = "$env:USERPROFILE\Downloads\apexg-respaldos\docker",
  [int]$Conservar = 14
)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$compose = @("compose", "--env-file", (Join-Path $repo $EnvFile), "-p", $Proyecto, "-f", (Join-Path $repo "docker-compose.yml"))

$sello = Get-Date -Format "yyyy-MM-dd_HHmm"
$carpeta = Join-Path $Destino $sello
New-Item -ItemType Directory -Force $carpeta | Out-Null

# Base: se genera dentro del contenedor y se copia, así el binario no pasa por la consola.
& docker @compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc -d "$POSTGRES_DB" -f /tmp/respaldo.dump'
if ($LASTEXITCODE -ne 0) { throw "pg_dump falló." }
$postgres = (& docker @compose ps -q postgres).Trim()
& docker cp "${postgres}:/tmp/respaldo.dump" (Join-Path $carpeta "base.dump")
& docker @compose exec -T postgres rm -f /tmp/respaldo.dump

# Archivos: el volumen /data del backend, empaquetado.
& docker @compose exec -T backend tar -czf /tmp/archivos.tgz -C /data .
$backend = (& docker @compose ps -q backend).Trim()
& docker cp "${backend}:/tmp/archivos.tgz" (Join-Path $carpeta "archivos.tgz")
& docker @compose exec -T backend rm -f /tmp/archivos.tgz

$tamano = (Get-ChildItem $carpeta | Measure-Object Length -Sum).Sum / 1MB
Write-Output ("Respaldo en {0} ({1:N1} MB)" -f $carpeta, $tamano)

# Rotación: solo carpetas con el formato de sello de este script.
Get-ChildItem $Destino -Directory |
  Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
  Sort-Object Name -Descending |
  Select-Object -Skip $Conservar |
  ForEach-Object { Remove-Item -Recurse -Force $_.FullName; Write-Output "Borrado respaldo viejo $($_.Name)" }
