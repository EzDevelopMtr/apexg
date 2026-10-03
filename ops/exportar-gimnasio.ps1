# =====================================================
# APEX GYM — exportar los datos de UN gimnasio.
#
#   powershell -ExecutionPolicy Bypass -File ops\exportar-gimnasio.ps1 -Slug gimnasio-x -EnvFile ops\produccion.env -Proyecto apexg
#
# Para entregarle a un gimnasio sus datos o antes de darlo de baja. Deja en
# <Destino>\<slug>_<fecha>\ un CSV por cada tabla que tiene company_id (filtrado
# a ese gimnasio), la fila de `companies`, los permisos de sus roles, y sus
# archivos (cada gimnasio tiene su carpeta desde la fase 6; los archivos
# anteriores, en la raíz, no se pueden atribuir y quedan fuera).
#
# Solo lee: no borra ni modifica nada.
# =====================================================
param(
  [Parameter(Mandatory = $true)][string]$Slug,
  [string]$EnvFile = "ops\produccion.env",
  [string]$Proyecto = "apexg",
  [string]$Destino = "$env:USERPROFILE\Downloads\apexg-respaldos\exportaciones"
)
$ErrorActionPreference = "Stop"
if ($Slug -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') { throw "Identificador inválido: $Slug" }
$repo = Split-Path -Parent $PSScriptRoot
$compose = @("compose", "--env-file", (Join-Path $repo $EnvFile), "-p", $Proyecto, "-f", (Join-Path $repo "docker-compose.yml"))

function Invoke-Sql([string]$sql) {
  $out = $sql | & docker @compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tA'
  if ($LASTEXITCODE -ne 0) { throw "Falló la consulta: $sql" }
  return $out
}

$id = (Invoke-Sql "SELECT id FROM companies WHERE slug = '$Slug';" | Select-Object -First 1)
if (-not $id) { throw "No existe un gimnasio con el identificador $Slug." }
$id = $id.Trim()

$carpeta = Join-Path $Destino ("{0}_{1}" -f $Slug, (Get-Date -Format "yyyy-MM-dd_HHmm"))
New-Item -ItemType Directory -Force (Join-Path $carpeta "datos") | Out-Null

$consultas = [ordered]@{
  "companies"        = "SELECT * FROM companies WHERE id = '$id'"
  "role_permissions" = "SELECT rp.* FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.company_id = '$id'"
}
$tablas = Invoke-Sql "SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'company_id' ORDER BY table_name;"
foreach ($tabla in $tablas) {
  $t = $tabla.Trim()
  if ($t) { $consultas[$t] = "SELECT * FROM $t WHERE company_id = '$id'" }
}

foreach ($nombre in $consultas.Keys) {
  $csv = Invoke-Sql ("COPY ({0}) TO STDOUT WITH CSV HEADER;" -f $consultas[$nombre])
  $filas = @($csv).Count - 1
  Set-Content -Encoding utf8 -Path (Join-Path $carpeta "datos\$nombre.csv") -Value $csv
  if ($filas -gt 0) { Write-Output ("{0,-28} {1} filas" -f $nombre, $filas) }
}

# Archivos del gimnasio: su carpeta en cada tipo de archivo.
# Comillas simples: el comando es de sh, y PowerShell no debe interpretar $( ) ni 2>.
& docker @compose exec -T -e "GYM=$id" backend sh -c 'cd /data && set -- */"$GYM" && if [ -e "$1" ]; then tar -czf /tmp/gimnasio.tgz "$@"; else tar -czf /tmp/gimnasio.tgz -T /dev/null; fi'
$backend = (& docker @compose ps -q backend).Trim()
& docker cp "${backend}:/tmp/gimnasio.tgz" (Join-Path $carpeta "archivos.tgz")
& docker @compose exec -T backend rm -f /tmp/gimnasio.tgz

Write-Output "Exportado en $carpeta"
