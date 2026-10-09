# cvs.ps1
$ErrorActionPreference = 'Stop'

# --- 1) Login ---
$loginBody = @{
    email    = 'director@eetp602.test'
    password = 'Prime2026!'
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post `
    -Uri 'http://localhost:3000/api/auth/login' `
    -ContentType 'application/json; charset=utf-8' `
    -Body $loginBody

$token = $login.token
Write-Host "[OK] Login OK. Token: $($token.Substring(0,20))..." -ForegroundColor Green

# --- 2) Leer CSV como STRING puro (¡SIN metadata!) ---
$csvPath = Join-Path $PSScriptRoot 'alumnos-test.csv'
if (-not (Test-Path $csvPath)) {
    Write-Host "[ERROR] No existe $csvPath" -ForegroundColor Red
    exit 1
}

# Opción C: la más limpia, devuelve System.String puro
$csvTexto = [System.IO.File]::ReadAllText(
    (Resolve-Path $csvPath),
    [System.Text.Encoding]::UTF8
)

Write-Host "[INFO] CSV leído: $($csvTexto.Length) caracteres" -ForegroundColor Cyan
Write-Host "[INFO] Tipo: $($csvTexto.GetType().FullName)" -ForegroundColor Cyan

# --- 3) Body ---
$body = @{ csv = $csvTexto } | ConvertTo-Json -Compress -Depth 10

# Sanity check: ver los primeros 80 chars del JSON
Write-Host "[DEBUG] Body: $($body.Substring(0, [Math]::Min(80, $body.Length)))..." -ForegroundColor DarkGray

# --- 4) POST ---
$headers = @{
    Authorization = "Bearer $token"
}

$resp = Invoke-RestMethod -Method Post `
    -Uri 'http://localhost:3000/api/alumnos/importar' `
    -Headers $headers `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

Write-Host ""
Write-Host "===== RESULTADO =====" -ForegroundColor Yellow
$resp | ConvertTo-Json -Depth 5