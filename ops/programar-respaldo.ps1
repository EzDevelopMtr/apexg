# =====================================================
# APEX GYM — programa el respaldo diario en el Programador de tareas.
#
#   powershell -ExecutionPolicy Bypass -File ops\programar-respaldo.ps1 [-Hora 23:00] [-Copia D:\respaldos-apexg]
#
# Crea (o reemplaza) la tarea "APEX GYM - respaldo diario". Corre con la
# sesión del usuario porque Docker Desktop vive en ella; si el equipo estaba
# apagado a esa hora, corre en cuanto se encienda. Resultado de cada día en
# Downloads\apexg-respaldos\docker\respaldos.log.
# =====================================================
param(
  [string]$Hora = "23:00",
  [string]$Copia = ""
)
$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "respaldar.ps1"
$argumentos = "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -EnvFile ops\produccion.env -Proyecto apexg"
if ($Copia) { $argumentos += " -Copia `"$Copia`"" }

$accion = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argumentos
$disparo = New-ScheduledTaskTrigger -Daily -At $Hora
$ajustes = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "APEX GYM - respaldo diario" -Action $accion -Trigger $disparo -Settings $ajustes -Force | Out-Null
Write-Output "Tarea programada a las $Hora. Probarla ya: Start-ScheduledTask 'APEX GYM - respaldo diario'"
