# =====================================================
# APEX GYM — entorno de PRUEBAS: misma app, base y archivos propios.
#
#   powershell -ExecutionPolicy Bypass -File ops\pruebas.ps1             # levanta o actualiza
#   powershell -ExecutionPolicy Bypass -File ops\pruebas.ps1 -Reiniciar  # borra todo y vuelve a sembrar
#
# Proyecto compose `apexg-pruebas`, web en 127.0.0.1:3200. Nada aquí comparte
# base, volumen ni puerto con producción (`apexg`, 3000): lo que se rompa
# aquí no llega al gimnasio.
#
# Se siembra con una copia de apexg_work (contenedor apexg-dev-postgres, gimnasios de
# prueba), NO con los datos del piloto.
#
# Link público: Tailscale Funnel en el puerto 8443 del mismo equipo
#   tailscale funnel --bg --https=8443 http://127.0.0.1:3200
#   -> https://pcandres.taildb102a.ts.net:8443
# =====================================================
param([switch]$Reiniciar)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repo "ops\pruebas.env"
if (-not (Test-Path $envFile)) { throw "Falta ops\pruebas.env (copiar ops\ensayo.env.example con WEB_PORT=3200)." }
$compose = @("compose", "--env-file", $envFile, "-p", "apexg-pruebas", "-f", (Join-Path $repo "docker-compose.yml"))

if ($Reiniciar) { & docker @compose down -v }

& docker @compose up -d postgres
do { Start-Sleep 2; & docker @compose exec -T postgres pg_isready -q } while ($LASTEXITCODE -ne 0)

# La consulta va por stdin: PowerShell 5.1 rompe las comillas anidadas al pasar argumentos.
$hay = "SELECT count(*) FROM information_schema.tables WHERE table_name = 'companies'" | & docker @compose exec -T postgres sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB -tA'
if ("$hay".Trim() -eq "0") {
  Write-Output "Base vacía: sembrando con una copia de apexg_work."
  # Desde la base de desarrollo, en su propio contenedor: pruebas nunca toca el del piloto.
  docker exec apexg-dev-postgres pg_dump -U postgres -Fc -d apexg_work -f /tmp/pruebas.dump
  docker cp apexg-dev-postgres:/tmp/pruebas.dump "$env:TEMP\pruebas.dump"
  $pg = (& docker @compose ps -q postgres).Trim()
  docker cp "$env:TEMP\pruebas.dump" "${pg}:/tmp/pruebas.dump"
  Remove-Item "$env:TEMP\pruebas.dump"
  & docker @compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner /tmp/pruebas.dump'
}

& docker @compose up -d --build
Write-Output "Pruebas en http://127.0.0.1:3200 (público: https://pcandres.taildb102a.ts.net:8443 si el Funnel está activo)."
