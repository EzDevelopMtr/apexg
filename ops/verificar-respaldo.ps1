# =====================================================
# APEX GYM — comprueba que un respaldo se puede restaurar.
#
#   powershell -ExecutionPolicy Bypass -File ops\verificar-respaldo.ps1 -Carpeta <ruta del respaldo>
#
# Restaura base.dump en un Postgres desechable (sin puertos ni volumen con
# nombre; se borra al terminar) y lista archivos.tgz. Un respaldo que no se
# ha restaurado no cuenta como respaldo. Deja el resultado en
# <Carpeta>\verificacion.txt y termina con error si algo falla.
# =====================================================
param([Parameter(Mandatory)][string]$Carpeta)
$ErrorActionPreference = "Stop"

function Invoke-Docker {
  # docker escribe su progreso en stderr; en PowerShell 5.1 eso no es un error.
  $ErrorActionPreference = "Continue"
  $salida = & docker @args 2>&1
  if ($LASTEXITCODE -ne 0) { throw "docker $($args -join ' ') falló: $salida" }
  $salida
}

$dump = Join-Path $Carpeta "base.dump"
$tgz = Join-Path $Carpeta "archivos.tgz"
foreach ($f in $dump, $tgz) {
  if (-not (Test-Path $f) -or (Get-Item $f).Length -eq 0) { throw "Falta o está vacío: $f" }
}

$nombre = "apexg-verifica-" + (Get-Random)
Invoke-Docker run -d --rm --name $nombre -e POSTGRES_PASSWORD=verifica postgres:16 | Out-Null
try {
  $listo = $false
  for ($i = 0; $i -lt 60 -and -not $listo; $i++) {
    & docker exec $nombre pg_isready -U postgres -q 2>$null
    $listo = $LASTEXITCODE -eq 0
    if (-not $listo) { Start-Sleep 1 }
  }
  if (-not $listo) { throw "El Postgres de verificación no arrancó." }

  Invoke-Docker cp $dump "${nombre}:/tmp/base.dump" | Out-Null
  Invoke-Docker exec $nombre createdb -U postgres verifica | Out-Null
  Invoke-Docker exec $nombre pg_restore -U postgres -d verifica --no-owner --no-privileges --exit-on-error /tmp/base.dump | Out-Null

  $sql = "select (select count(*) from information_schema.tables where table_schema='public') || ' tablas, ' ||
    (select count(*) from schema_migrations) || ' migraciones, ' ||
    (select count(*) from companies) || ' gimnasios, ' ||
    (select count(*) from clients) || ' clientes, ' ||
    (select count(*) from payments) || ' pagos'"
  $base = (Invoke-Docker exec $nombre psql -U postgres -d verifica -tAc $sql | Out-String).Trim()

  Invoke-Docker cp $tgz "${nombre}:/tmp/archivos.tgz" | Out-Null
  $archivos = (Invoke-Docker exec $nombre sh -c "tar -tzf /tmp/archivos.tgz | grep -vc '/$' || true" | Out-String).Trim()
} finally {
  & docker rm -f $nombre 2>$null | Out-Null
}

$resultado = "Restaurado OK $(Get-Date -Format 'yyyy-MM-dd HH:mm'): $base; $archivos archivos."
Set-Content -Encoding utf8 (Join-Path $Carpeta "verificacion.txt") $resultado
Write-Output $resultado
