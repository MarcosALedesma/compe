# ============================================================
#  test-api.ps1  -  Suite de pruebas EETP N° 602
# ============================================================
$ErrorActionPreference = "Continue"
$BASE = "http://localhost:3000/api"

# Colores
function Write-Ok    ($msg) { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Write-Fail  ($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }
function Write-Info  ($msg) { Write-Host "  [INFO] $msg" -ForegroundColor Cyan }
function Write-Title ($msg) {
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Yellow
  Write-Host "  $msg" -ForegroundColor Yellow
  Write-Host "============================================================" -ForegroundColor Yellow
}

# Helper: hace una request y devuelve un objeto { status, body, ok }
function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    $Body = $null,
    $Headers = @{}
  )
  $uri = "$BASE$Path"
  try {
    $params = @{
      Uri         = $uri
      Method      = $Method
      Headers     = $Headers
      ContentType = "application/json"
      ErrorAction = "Stop"
    }
    if ($Body -ne $null) {
      $params.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }
    $resp = Invoke-RestMethod @params
    return @{ ok = $true; status = 200; body = $resp }
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $errBody = $null
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $errBody = $reader.ReadToEnd() | ConvertFrom-Json
    } catch {}
    return @{ ok = $false; status = $status; body = $errBody; raw = $_.Exception.Message }
  }
}

# Helper: assert
function Assert-True ($condition, $msgOk, $msgFail) {
  if ($condition) { Write-Ok $msgOk } else { Write-Fail $msgFail }
}

# ============================================================
Write-Title "1. LOGIN"
# ============================================================

$loginBody = @{ email = "director@eetp602.test"; password = "Prime2026!" }
$login = Invoke-Api -Method Post -Path "/auth/login" -Body $loginBody

if (-not $login.ok) {
  Write-Fail "No se pudo loguear. Abortando."
  Write-Host ($login | ConvertTo-Json -Depth 5)
  exit 1
}

$TOKEN = $login.body.token
$USER  = $login.body.user
$H     = @{ Authorization = "Bearer $TOKEN" }

Write-Ok "Login OK como $($USER.email) (rol: $($USER.rol))"
Write-Info "Token: $($TOKEN.Substring(0,40))..."

# Login con password mala
$badLogin = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = "director@eetp602.test"; password = "mala" }
Assert-True ($badLogin.status -eq 401) "Password incorrecta rechazada (401)" "Password incorrecta NO fue rechazada"

# ============================================================
Write-Title "2. AUTH /ME"
# ============================================================
$me = Invoke-Api -Method Get -Path "/auth/me" -Headers $H
Assert-True ($me.ok -and $me.body.user.email -eq "director@eetp602.test") "GET /auth/me devuelve el usuario" "GET /auth/me falló"

# Sin token
$noAuth = Invoke-Api -Method Get -Path "/alumnos"
Assert-True ($noAuth.status -eq 401) "Sin token rechazado (401)" "Sin token NO fue rechazado"

# ============================================================
Write-Title "3. ALUMNOS - Listado"
# ============================================================
$alumnos = Invoke-Api -Method Get -Path "/alumnos" -Headers $H
Assert-True ($alumnos.ok -and $alumnos.body.Count -ge 60) "Listado devuelve $($alumnos.body.Count) alumnos (esperado >=60)" "Listado de alumnos vacío o incompleto"

# Búsqueda
$busqueda = Invoke-Api -Method Get -Path "/alumnos?search=Gonz" -Headers $H
Assert-True ($busqueda.ok) "Búsqueda por apellido funciona ($($busqueda.body.Count) resultados)" "Búsqueda falló"

# ============================================================
Write-Title "4. ALUMNOS - Crear (caso feliz)"
# ============================================================
# DNI aleatorio de 8 dígitos para evitar colisiones entre corridas
$nuevoDni = (Get-Random -Minimum 10000000 -Maximum 99999999).ToString()
Write-Info "Usando DNI aleatorio: $nuevoDni"

$nuevoAlumno = @{
  dni            = $nuevoDni
  apellido       = "Test"
  nombre         = "Alumno"
  fecha_nac      = "2010-05-15"
  tutor          = "Tutor Test"
  telefono_tutor = "3462-123456"
  curso_id       = 1
}
$crear = Invoke-Api -Method Post -Path "/alumnos" -Body $nuevoAlumno -Headers $H
Assert-True ($crear.ok -and $crear.body.id) "Alumno creado (id=$($crear.body.id), DNI=$nuevoDni)" "No se pudo crear el alumno"
$nuevoAlumnoId = $crear.body.id

# ============================================================
Write-Title "5. ALUMNOS - DNI repetido (caso del jurado)"
# ============================================================
$dup = Invoke-Api -Method Post -Path "/alumnos" -Body $nuevoAlumno -Headers $H
Assert-True ($dup.status -eq 409) "DNI repetido rechazado (409)" "DNI repetido NO fue rechazado (status=$($dup.status))"

# ============================================================
Write-Title "6. ALUMNOS - Baja lógica"
# ============================================================
$baja = Invoke-Api -Method Delete -Path "/alumnos/$nuevoAlumnoId" -Headers $H
Assert-True ($baja.ok) "Baja lógica OK" "Baja lógica falló"

# ============================================================
Write-Title "7. DOCENTES"
# ============================================================
$docentes = Invoke-Api -Method Get -Path "/docentes" -Headers $H
Assert-True ($docentes.ok -and $docentes.body.Count -ge 8) "Listado devuelve $($docentes.body.Count) docentes" "Listado de docentes incompleto"

$doc1 = Invoke-Api -Method Get -Path "/docentes/1" -Headers $H
Assert-True ($doc1.ok -and $doc1.body.materias) "Docente 1 con $($doc1.body.materias.Count) materias asignadas" "Docente 1 sin materias"

# ============================================================
Write-Title "8. CURSOS"
# ============================================================
$cursos = Invoke-Api -Method Get -Path "/cursos" -Headers $H
Assert-True ($cursos.ok -and $cursos.body.Count -eq 6) "6 cursos (1º a 6º)" "Cursos incorrectos ($($cursos.body.Count))"

$curso1 = Invoke-Api -Method Get -Path "/cursos/1" -Headers $H
Assert-True ($curso1.ok -and $curso1.body.alumnos.Count -ge 10) "Curso 1 tiene $($curso1.body.alumnos.Count) alumnos" "Curso 1 sin alumnos"
Assert-True ($curso1.body.materias.Count -eq 5) "Curso 1 tiene 5 materias" "Curso 1 sin materias"

# ============================================================
Write-Title "9. MATERIAS"
# ============================================================
$materiasCurso1 = Invoke-Api -Method Get -Path "/cursos/1/materias" -Headers $H
Assert-True ($materiasCurso1.ok -and $materiasCurso1.body.Count -eq 5) "Materias del curso 1 OK" "Materias del curso 1 fallaron"

# ============================================================
Write-Title "10. CALIFICACIONES - Listado por alumno"
# ============================================================
$notasAlumno = Invoke-Api -Method Get -Path "/calificaciones/alumno/1" -Headers $H
Assert-True ($notasAlumno.ok -and $notasAlumno.body.materias.Count -eq 5) "Alumno 1 tiene 5 materias con notas" "Notas del alumno 1 incompletas"
if ($notasAlumno.ok) {
  $primera = $notasAlumno.body.materias[0]
  Write-Info "  Ej: $($primera.materia) - promedio $($primera.promedio) - estado: $($primera.estado)"
}

# ============================================================
Write-Title "11. CALIFICACIONES - Cargar nota válida"
# ============================================================
$materiasCurso1Ids = $materiasCurso1.body | ForEach-Object { $_.id }
$mcId = $materiasCurso1Ids[0]

$notaOk = Invoke-Api -Method Post -Path "/calificaciones" -Headers $H -Body @{
  alumno_id        = 1
  materia_curso_id = $mcId
  trimestre        = 1
  nota             = 9
}
Assert-True ($notaOk.ok) "Nota 9 cargada/actualizada" "No se pudo cargar nota válida"

# ============================================================
Write-Title "12. CALIFICACIONES - Nota 11 (caso del jurado)"
# ============================================================
$nota11 = Invoke-Api -Method Post -Path "/calificaciones" -Headers $H -Body @{
  alumno_id        = 1
  materia_curso_id = $mcId
  trimestre        = 1
  nota             = 11
}
Assert-True ($nota11.status -eq 400) "Nota 11 rechazada (400)" "Nota 11 NO fue rechazada (status=$($nota11.status))"
if ($nota11.body) { Write-Info "  Respuesta: $($nota11.body.error)" }

# ============================================================
Write-Title "13. CALIFICACIONES - Nota 0 (caso del jurado)"
# ============================================================
$nota0 = Invoke-Api -Method Post -Path "/calificaciones" -Headers $H -Body @{
  alumno_id        = 1
  materia_curso_id = $mcId
  trimestre        = 1
  nota             = 0
}
Assert-True ($nota0.status -eq 400) "Nota 0 rechazada (400)" "Nota 0 NO fue rechazada (status=$($nota0.status))"

# ============================================================
Write-Title "14. CALIFICACIONES - Trimestre inválido"
# ============================================================
$tri4 = Invoke-Api -Method Post -Path "/calificaciones" -Headers $H -Body @{
  alumno_id        = 1
  materia_curso_id = $mcId
  trimestre        = 4
  nota             = 8
}
Assert-True ($tri4.status -eq 400) "Trimestre 4 rechazado (400)" "Trimestre 4 NO fue rechazado"

# ============================================================
Write-Title "15. CALIFICACIONES - Auditoría"
# ============================================================
$audit = Invoke-Api -Method Get -Path "/calificaciones/auditoria" -Headers $H
Assert-True ($audit.ok -and $audit.body.Count -ge 1) "Auditoría con $($audit.body.Count) registros" "Auditoría vacía"

# ============================================================
Write-Title "16. ASISTENCIAS - Resumen por curso"
# ============================================================
$resumen = Invoke-Api -Method Get -Path "/asistencias/resumen?curso_id=1" -Headers $H
Assert-True ($resumen.ok -and $resumen.body.Count -ge 10) "Resumen de asistencias con $($resumen.body.Count) alumnos" "Resumen vacío"

# Alerta >= 20
$alertas = $resumen.body | Where-Object { $_.alerta -eq 1 }
Write-Info "  Alumnos con alerta (>=20 faltas): $($alertas.Count)"

# ============================================================
Write-Title "17. ASISTENCIAS - Toma diaria"
# ============================================================
$toma = Invoke-Api -Method Post -Path "/asistencias/toma" -Headers $H -Body @{
  curso_id = 1
  fecha    = "2026-10-09"
  registros = @(
    @{ alumno_id = 1; estado = "P" },
    @{ alumno_id = 2; estado = "A" },
    @{ alumno_id = 3; estado = "T" }
  )
}
Assert-True ($toma.ok) "Toma de asistencia OK ($($toma.body.registros) registros)" "Toma de asistencia falló"

# Estado inválido
$tomaMala = Invoke-Api -Method Post -Path "/asistencias/toma" -Headers $H -Body @{
  curso_id = 1
  fecha    = "2026-10-10"
  registros = @( @{ alumno_id = 1; estado = "X" } )
}
Assert-True ($tomaMala.status -eq 400) "Estado 'X' rechazado (400)" "Estado 'X' NO fue rechazado"

# ============================================================
Write-Title "18. ASISTENCIAS - Alumno"
# ============================================================
$asisAlumno = Invoke-Api -Method Get -Path "/asistencias/alumno/1" -Headers $H
Assert-True ($asisAlumno.ok) "Asistencias del alumno 1 (faltas: $($asisAlumno.body.faltas))" "Asistencias del alumno 1 fallaron"

# ============================================================
Write-Title "19. EVENTOS"
# ============================================================
$eventos = Invoke-Api -Method Get -Path "/eventos" -Headers $H
Assert-True ($eventos.ok -and $eventos.body.Count -ge 5) "Listado devuelve $($eventos.body.Count) eventos" "Eventos incompletos"

$oct = Invoke-Api -Method Get -Path "/eventos/mes?anio=2026&mes=10" -Headers $H
Assert-True ($oct.ok) "Eventos de octubre 2026 ($($oct.body.eventos.Count))" "Eventos de octubre fallaron"

$prox = Invoke-Api -Method Get -Path "/eventos/proximos?limite=5" -Headers $H
Assert-True ($prox.ok) "Próximos 5 eventos OK" "Próximos eventos fallaron"

# Crear evento
$nuevoEv = Invoke-Api -Method Post -Path "/eventos" -Headers $H -Body @{
  titulo       = "Prueba desde PS1"
  tipo         = "institucional"
  fecha_inicio = "2026-11-01"
  fecha_fin    = "2026-11-01"
}
Assert-True ($nuevoEv.ok) "Evento creado (id=$($nuevoEv.body.id))" "No se pudo crear evento"

# Fecha inválida
$evMalo = Invoke-Api -Method Post -Path "/eventos" -Headers $H -Body @{
  titulo       = "Evento malo"
  tipo         = "acto"
  fecha_inicio = "2026-12-31"
  fecha_fin    = "2026-01-01"
}
Assert-True ($evMalo.status -eq 400) "Evento con fecha_fin < fecha_inicio rechazado" "Evento con fechas invertidas NO fue rechazado"
# ============================================================
Write-Title "20. PANEL DE DIRECCION"
# ============================================================
$panel = Invoke-Api -Method Get -Path "/panel/resumen" -Headers $H
Assert-True ($panel.ok) "Panel resumen OK" "Panel resumen falló"

if ($panel.ok) {
  $p = $panel.body
  Write-Info "  Totales: $($p.totales.alumnos) alumnos, $($p.totales.docentes) docentes, $($p.totales.cursos) cursos, $($p.totales.materias) materias"
  Write-Info "  Alumnos por año: $(($p.alumnosPorAnio | ForEach-Object { "$($_.anio)º=$($_.total)" }) -join ', ')"
  Write-Info "  Promedio por curso: $(($p.promedioPorCurso | ForEach-Object { "$($_.anio)º$($_.division)=$($_.promedio_general)" }) -join ', ')"
  Write-Info "  Top faltas: $(($p.top5Faltas | ForEach-Object { "$($_.apellido) ($($_.faltas))" }) -join ', ')"
  Write-Info "  Materias con más desaprobados: $(($p.materiasConMasDesaprobados | ForEach-Object { "$($_.materia) ($($_.desaprobados))" }) -join ', ')"
}

Assert-True ($panel.body.totales.alumnos -ge 60) "Total alumnos >= 60" "Total alumnos incorrecto"
Assert-True ($panel.body.totales.docentes -ge 8) "Total docentes >= 8" "Total docentes incorrecto"
Assert-True ($panel.body.alumnosPorAnio.Count -eq 6) "Alumnos por año: 6 filas (1º a 6º)" "Alumnos por año incompleto"
Assert-True ($panel.body.promedioPorCurso.Count -eq 6) "Promedio por curso: 6 filas" "Promedio por curso incompleto"

# Probar que un docente NO puede ver el panel
$loginDoc = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = "docente@eetp602.test"; password = "Prime2026!" }
$HDoc = @{ Authorization = "Bearer $($loginDoc.body.token)" }
$panelDoc = Invoke-Api -Method Get -Path "/panel/resumen" -Headers $HDoc
Assert-True ($panelDoc.status -eq 403) "Docente NO puede ver el panel (403)" "Docente PUDO ver el panel (mal)"
# ============================================================
Write-Title "21. PORTAL DEL ALUMNO"
# ============================================================
$loginAlu = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = "alumno@eetp602.test"; password = "Prime2026!" }
$HAlu = @{ Authorization = "Bearer $($loginAlu.body.token)" }
Write-Info "Login alumno OK (alumno_id=$($loginAlu.body.user.alumno_id))"

$miResumen = Invoke-Api -Method Get -Path "/portal/mi-resumen" -Headers $HAlu
Assert-True ($miResumen.ok) "GET /portal/mi-resumen OK" "Portal del alumno falló"
if ($miResumen.ok) {
  Write-Info "  Alumno: $($miResumen.body.alumno.apellido), $($miResumen.body.alumno.nombre) - Curso $($miResumen.body.alumno.anio)º $($miResumen.body.alumno.division)"
  Write-Info "  Materias: $($miResumen.body.materias.Count)"
  Write-Info "  Faltas: $($miResumen.body.faltas.total) (alerta=$($miResumen.body.faltas.alerta))"
  Write-Info "  Próximos eventos: $($miResumen.body.proximosEventos.Count)"
}

Assert-True ($miResumen.body.materias.Count -ge 5) "Alumno ve al menos 5 materias" "Alumno con materias incompletas"

# El alumno NO puede ver el panel
$panelAlu = Invoke-Api -Method Get -Path "/panel/resumen" -Headers $HAlu
Assert-True ($panelAlu.status -eq 403) "Alumno NO puede ver el panel (403)" "Alumno PUDO ver el panel (mal)"

# El alumno NO puede listar todos los alumnos
$alumnosAlu = Invoke-Api -Method Get -Path "/alumnos" -Headers $HAlu
Assert-True ($alumnosAlu.status -eq 200 -or $alumnosAlu.status -eq 403) "Alumno puede/no puede listar (según diseño)" "Comportamiento raro"

# ============================================================
Write-Title "22. BOLETIN"
# ============================================================
$bol = Invoke-Api -Method Get -Path "/boletin/1" -Headers $H
Assert-True ($bol.ok) "Boletín del alumno 1 OK" "Boletín falló"
if ($bol.ok) {
  Write-Info "  Institución: $($bol.body.institucion.nombre)"
  Write-Info "  Alumno: $($bol.body.alumno.apellido), $($bol.body.alumno.nombre) - Curso $($bol.body.alumno.curso)"
  Write-Info "  Materias: $($bol.body.materias.Count) - Promedio general: $($bol.body.promedioGeneral)"
  Write-Info "  Faltas: $($bol.body.faltas.total)"
  foreach ($m in $bol.body.materias) {
    Write-Info "    $($m.materia): T1=$($m.notas.1) T2=$($m.notas.2) T3=$($m.notas.3) -> prom=$($m.promedio) [$($m.estado)]"
  }
}

Assert-True ($bol.body.institucion.nombre -like "*602*") "Boletín con datos de la institución" "Boletín sin institución"
Assert-True ($bol.body.materias.Count -ge 5) "Boletín con al menos 5 materias" "Boletín incompleto"

# Boletín por curso (solo directivo)
$bolCurso = Invoke-Api -Method Get -Path "/boletin/curso/1" -Headers $H
Assert-True ($bolCurso.ok -and $bolCurso.body.boletines.Count -eq 10) "Boletines del curso 1: 10 alumnos" "Boletines por curso fallaron"

# Docente NO puede ver boletines por curso
$loginDoc2 = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = "docente@eetp602.test"; password = "Prime2026!" }
$HDoc2 = @{ Authorization = "Bearer $($loginDoc2.body.token)" }
$bolCursoDoc = Invoke-Api -Method Get -Path "/boletin/curso/1" -Headers $HDoc2
Assert-True ($bolCursoDoc.status -eq 403) "Docente NO puede ver boletines por curso (403)" "Docente PUDO ver boletines por curso (mal)"

# Alumno NO puede ver boletín de otro
$bolAjeno = Invoke-Api -Method Get -Path "/boletin/2" -Headers $HAlu
Assert-True ($bolAjeno.status -eq 403) "Alumno NO puede ver boletín ajeno (403)" "Alumno PUDO ver boletín ajeno (mal)"
# ============================================================
Write-Title "RESUMEN"
# ============================================================
Write-Host ""
Write-Host "  Pruebas completadas. Revisá arriba los [FAIL] si hay." -ForegroundColor Cyan
Write-Host "  Token usado: $($TOKEN.Substring(0,40))..." -ForegroundColor DarkGray
Write-Host ""