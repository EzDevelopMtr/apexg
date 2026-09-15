<#
  Levanta el backend (NestJS, puerto 3001) y el frontend (Next.js, puerto
  3000), cada uno en su propia ventana de PowerShell.

  Postgres (Docker) debe estar corriendo ANTES de ejecutar este script —
  no lo levanta por ti.

  Uso:
    .\dev.ps1
#>

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Verificando Postgres (apexg-postgres)..." -ForegroundColor Cyan
try {
    $postgres = docker ps --filter "name=apexg-postgres" --format "{{.Names}}" 2>$null
    if (-not $postgres) {
        Write-Warning "No se ve el contenedor 'apexg-postgres' corriendo. Levántalo antes de continuar (el backend fallará al conectar si no está)."
    } else {
        Write-Host "Postgres OK." -ForegroundColor Green
    }
} catch {
    Write-Warning "No se pudo consultar Docker. ¿Está Docker Desktop corriendo?"
}

Write-Host "Iniciando backend (NestJS) en http://localhost:3001 ..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $root -ArgumentList @(
    "-NoExit", "-Command", "pnpm --filter @apexg/backend run start:dev"
)

Start-Sleep -Seconds 2

Write-Host "Iniciando frontend (Next.js) en http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $root -ArgumentList @(
    "-NoExit", "-Command", "pnpm --filter @apexg/web dev"
)

Write-Host ""
Write-Host "Listo. Se abrieron dos ventanas nuevas:" -ForegroundColor Green
Write-Host "  - Backend:  http://localhost:3001"
Write-Host "  - Frontend: http://localhost:3000"
Write-Host "Para detener cada servidor, cierra su ventana o presiona Ctrl+C dentro de ella."
