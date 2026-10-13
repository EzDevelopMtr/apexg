# =====================================================
# APEX GYM — respaldo completo de la instalación en Docker.
#
#   powershell -ExecutionPolicy Bypass -File ops\respaldar.ps1 -EnvFile ops\produccion.env -Proyecto apexg
#
# Deja en <Destino>\<fecha-hora>\ la base completa (pg_dump formato custom) y
# los archivos (comprobantes, fotos, logos) de TODOS los gimnasios. Cada
# respaldo se restaura de prueba (verificar-respaldo.ps1) y el resultado queda
# en <Destino>\respaldos.log. Uno fallido queda como <fecha>-FALLIDO y no
# dispara la rotación, que conserva los últimos <Conservar> buenos.
#
# Con la base compartida, este respaldo es la red de seguridad: restaurar un
# solo gimnasio dentro de ella no es trivial (ver exportar-gimnasio.ps1).
# Programarlo a diario: ops\programar-respaldo.ps1.
# =====================================================
param(
  [string]$EnvFile = "ops\produccion.env",
  [string]$Proyecto = "apexg",
  [string]$Destino = "$env:USERPROFILE\Downloads\apexg-respaldos\docker",
  [int]$Conservar = 14,
  # Segunda copia fuera de esta carpeta (otro disco, carpeta sincronizada).
  [string]$Copia = ""
)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$compose = @("compose", "--env-file", (Join-Path $repo $EnvFile), "-p", $Proyecto, "-f", (Join-Path $repo "docker-compose.yml"))

function Invoke-Docker {
  # docker escribe su progreso en stderr; en PowerShell 5.1 eso no es un error.
  $ErrorActionPreference = "Continue"
  $salida = & docker @args 2>&1
  if ($LASTEXITCODE -ne 0) { throw "docker $($args -join ' ') falló: $salida" }
  $salida
}

$sello = Get-Date -Format "yyyy-MM-dd_HHmm"
$carpeta = Join-Path $Destino $sello
New-Item -ItemType Directory -Force $carpeta | Out-Null
$registro = Join-Path $Destino "respaldos.log"
function Registrar([string]$linea) {
  Add-Content -Encoding utf8 $registro "$(Get-Date -Format 'yyyy-MM-dd HH:mm') $linea"
  Write-Output $linea
}

try {
  # Base: se genera dentro del contenedor y se copia, así el binario no pasa por la consola.
  Invoke-Docker @compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc -d "$POSTGRES_DB" -f /tmp/respaldo.dump' | Out-Null
  $postgres = (Invoke-Docker @compose ps -q postgres | Out-String).Trim()
  Invoke-Docker cp "${postgres}:/tmp/respaldo.dump" (Join-Path $carpeta "base.dump") | Out-Null
  Invoke-Docker @compose exec -T postgres rm -f /tmp/respaldo.dump | Out-Null

  # Archivos: el volumen /data del backend, leído directo para no depender de
  # que el backend esté corriendo (restaurar.ps1 respalda con él detenido).
  $backend = (Invoke-Docker @compose ps -aq backend | Out-String).Trim()
  $montajes = Invoke-Docker inspect -f '{{json .Mounts}}' $backend | Out-String | ConvertFrom-Json
  $volumen = ($montajes | Where-Object Destination -eq '/data').Name
  if (-not $volumen) { throw "No se encontró el volumen /data del backend." }
  Invoke-Docker run --rm -v "${volumen}:/data:ro" -v "${carpeta}:/salida" postgres:16 tar -czf /salida/archivos.tgz -C /data . | Out-Null

  $verificacion = & (Join-Path $PSScriptRoot "verificar-respaldo.ps1") -Carpeta $carpeta
  $tamano = (Get-ChildItem $carpeta | Measure-Object Length -Sum).Sum / 1MB
  Registrar ("OK {0} ({1:N1} MB). {2}" -f $sello, $tamano, $verificacion)

  if ($Copia) {
    New-Item -ItemType Directory -Force $Copia | Out-Null
    Copy-Item -Recurse $carpeta (Join-Path $Copia $sello)
    Registrar "Copia en $(Join-Path $Copia $sello)"
  }
} catch {
  Rename-Item $carpeta "$sello-FALLIDO" -ErrorAction SilentlyContinue
  Registrar "FALLÓ $sello : $_"
  exit 1
}

# Rotación: solo carpetas con el sello de este script (las -FALLIDO no cuentan).
foreach ($dir in @($Destino, $Copia) | Where-Object { $_ }) {
  Get-ChildItem $dir -Directory |
    Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
    Sort-Object Name -Descending |
    Select-Object -Skip $Conservar |
    ForEach-Object { Remove-Item -Recurse -Force $_.FullName; Registrar "Borrado respaldo viejo $($_.FullName)" }
}
