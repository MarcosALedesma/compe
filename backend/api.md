# API — Sistema de Gestión Escolar EETP N° 602

Base URL local: `http://localhost:3000/api`

Todas las rutas (excepto `/auth/login`) requieren header:

```
Authorization: Bearer <token>
```

---

## Autenticación

### POST /auth/login
Inicia sesión y devuelve un JWT.

**Body:**
```json
{
  "email": "director@eetp602.test",
  "password": "Prime2026!"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "director@eetp602.test",
    "rol": "directivo"
  }
}
```

**Errores:**
- `401` — credenciales inválidas

---

### GET /auth/me
Devuelve el usuario autenticado.

**Roles:** cualquiera autenticado

**Response 200:**
```json
{
  "id": 1,
  "email": "director@eetp602.test",
  "rol": "directivo"
}
```

---

## Alumnos

### GET /alumnos
Lista alumnos. Acepta query params `?buscar=<texto>` para filtrar por DNI o apellido.

**Roles:** autenticado

**Response 200:** array de alumnos.

---

### GET /alumnos/:id
Devuelve un alumno.

**Roles:** autenticado

**Errores:** `404` si no existe.

---

### POST /alumnos
Crea un alumno.

**Roles:** directivo

**Body:**
```json
{
  "dni": "45123456",
  "apellido": "Pérez",
  "nombre": "Juan",
  "fecha_nac": "2010-05-14",
  "tutor": "María Pérez",
  "telefono_tutor": "3462123456",
  "curso_id": 1
}
```

**Errores:**
- `400` — datos inválidos
- `409` — DNI ya existe

---

### PUT /alumnos/:id
Actualiza un alumno.

**Roles:** directivo

---

### DELETE /alumnos/:id
Baja lógica (marca `activo = 0`).

**Roles:** directivo

---

### POST /alumnos/:id/curso
Asigna un alumno a un curso.

**Roles:** directivo

**Body:**
```json
{ "curso_id": 2 }
```

**Errores:**
- `409` — el alumno ya está en ese curso

---

### POST /alumnos/importar
Importa alumnos desde CSV. **Bonus.**

**Roles:** directivo

**Body:**
```json
{
  "csv": "dni,apellido,nombre,fecha_nac,tutor,telefono_tutor,curso\n45123456,Pérez,Juan,2010-05-14,María Pérez,3462123456,1A"
}
```

**Formato CSV** (con o sin cabecera):
```
dni,apellido,nombre,fecha_nac,tutor,telefono_tutor,curso
```

La columna `curso` es opcional. Acepta `1`, `1A`, `1ºA`.

**Response 200:**
```json
{
  "ok": true,
  "total": 6,
  "insertados": 3,
  "rechazados": 3,
  "detalleInsertados": [ ... ],
  "detalleRechazados": [
    { "linea": 5, "motivo": "DNI inválido...", "datos": "..." }
  ]
}
```

---

## Docentes

### GET /docentes
Lista docentes. **Roles:** autenticado

### GET /docentes/:id
Devuelve un docente. **Roles:** autenticado

### POST /docentes
Crea docente. **Roles:** directivo

### PUT /docentes/:id
Actualiza docente. **Roles:** directivo

### DELETE /docentes/:id
Baja lógica. **Roles:** directivo

---

## Cursos

### GET /cursos
Lista cursos. **Roles:** autenticado

### GET /cursos/:id
Devuelve un curso. **Roles:** autenticado

### POST /cursos
Crea curso. **Roles:** directivo

**Body:**
```json
{
  "anio": 1,
  "division": "A",
  "turno": "mañana",
  "ciclo_lectivo": 2026
}
```

### PUT /cursos/:id
Actualiza. **Roles:** directivo

### DELETE /cursos/:id
Elimina. **Roles:** directivo

---

## Materias y materias_curso

### GET /materias
Lista materias. **Roles:** autenticado

### POST /materias
Crea materia. **Roles:** directivo

### GET /cursos/:cursoId/materias
Lista materias de un curso. **Roles:** autenticado

### POST /materias-curso
Asigna materia a curso con docente. **Roles:** directivo

**Body:**
```json
{
  "curso_id": 1,
  "materia_id": 1,
  "docente_id": 1
}
```

### PUT /materias-curso/:id
Actualiza asignación. **Roles:** directivo

### DELETE /materias-curso/:id
Elimina asignación. **Roles:** directivo

---

## Calificaciones

### GET /calificaciones
Lista calificaciones. **Roles:** autenticado

### GET /calificaciones/alumno/:alumnoId
Calificaciones de un alumno (agrupadas por materia, con promedio y estado). **Roles:** autenticado

### GET /calificaciones/auditoria
Historial de cambios de notas. **Roles:** directivo

### POST /calificaciones
Crea o actualiza una nota.

**Roles:** directivo, docente

**Body:**
```json
{
  "alumno_id": 1,
  "materia_curso_id": 1,
  "trimestre": 1,
  "nota": 8
}
```

**Validaciones:**
- `nota` entero entre **1 y 10** (rechaza 0 y 11)
- `trimestre` entre 1 y 3
- único por alumno + materia_curso + trimestre

**Errores:**
- `400` — nota fuera de rango o trimestre inválido

### DELETE /calificaciones/:id
Elimina una nota. **Roles:** directivo, docente

---

## Asistencias

### GET /asistencias
Lista. **Roles:** autenticado

### GET /asistencias/curso/:cursoId
Asistencias de un curso en una fecha (`?fecha=YYYY-MM-DD`).

**Roles:** directivo, docente

### GET /asistencias/resumen
Resumen general. **Roles:** autenticado

### GET /asistencias/alumno/:alumnoId
Asistencias de un alumno. **Roles:** autenticado

### POST /asistencias/toma
Toma diaria de asistencia.

**Roles:** directivo, docente

**Body:**
```json
{
  "fecha": "2026-10-09",
  "registros": [
    { "alumno_id": 1, "estado": "P" },
    { "alumno_id": 2, "estado": "A" },
    { "alumno_id": 3, "estado": "T" }
  ]
}
```

**Estados:**
- `P` — Presente (0 faltas)
- `A` — Ausente (1 falta)
- `T` — Tarde (0.5 faltas)

**Errores:**
- `400` — estado inválido o fecha inválida

---

## Eventos

### GET /eventos
Lista todos. **Roles:** autenticado

### GET /eventos/mes?anio=2026&mes=10
Eventos de un mes. **Roles:** autenticado

### GET /eventos/proximos
Próximos 5 eventos. **Roles:** autenticado

### GET /eventos/:id
Devuelve uno. **Roles:** autenticado

### POST /eventos
Crea evento. **Roles:** directivo

**Body:**
```json
{
  "titulo": "Encuentro Tecnológico",
  "tipo": "institucional",
  "fecha_inicio": "2026-10-09",
  "fecha_fin": "2026-10-09",
  "curso_id": null
}
```

**Tipos válidos:** `acto`, `examen`, `feriado`, `institucional`

**Errores:** `400` si `fecha_fin < fecha_inicio`

### PUT /eventos/:id
Actualiza. **Roles:** directivo

### DELETE /eventos/:id
Elimina. **Roles:** directivo

---

## Panel de dirección

Todas requieren rol **directivo**.

### GET /panel/resumen
Totales: alumnos, docentes, cursos, materias.

### GET /panel/alumnos-por-anio
Cantidad de alumnos por año (1º a 6º).

### GET /panel/promedio-por-curso
Promedio general de cada curso.

### GET /panel/top-faltas
Top 5 alumnos con más faltas.

### GET /panel/materias-desaprobadas
Materias con más alumnos desaprobados.

### GET /panel/alertas-asistencia
Alumnos con 20 o más faltas.

---

## Portal del alumno

Todas requieren rol **alumno**.

### GET /portal/mi-resumen
Resumen del alumno logueado: curso, materias, faltas, próximos eventos.

### GET /portal/mis-notas
Notas propias agrupadas por materia.

### GET /portal/mis-faltas
Total de faltas propias y estado de alerta.

### GET /portal/mis-eventos
Próximos eventos que le aplican.

---

## Boletín

### GET /boletin/:alumnoId
Boletín completo del alumno. El alumno solo puede ver el suyo.

**Roles:** autenticado

**Response 200:**
```json
{
  "institucion": {
    "nombre": "E.E.T.P. N° 602 \"General José de San Martín\"",
    "direccion": "San Martín 2260, Venado Tuerto, Santa Fe",
    "ciclo_lectivo": 2026
  },
  "alumno": {
    "id": 1,
    "dni": "45000000",
    "apellido": "González",
    "nombre": "Santiago",
    "curso": "1º A",
    "turno": "mañana"
  },
  "materias": [
    {
      "materia": "Matemática",
      "notas": { "1": 8, "2": 6, "3": 5 },
      "promedio": 6.33,
      "estado": "Diciembre"
    }
  ],
  "promedioGeneral": 6.07,
  "faltas": { "total": 1, "alerta": false },
  "generadoEn": "2026-10-09T..."
}
```

### GET /boletin/curso/:cursoId
Boletines resumidos de todos los alumnos de un curso.

**Roles:** directivo

---

## Códigos de estado usados

| Código | Significado |
|---|---|
| 200 | OK |
| 400 | Validación fallida |
| 401 | No autenticado |
| 403 | Sin permiso (rol incorrecto) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (DNI duplicado, etc.) |
| 500 | Error interno |

---

## Usuarios de prueba

| Email | Password | Rol |
|---|---|---|
| director@eetp602.test | Prime2026! | directivo |
| docente@eetp602.test | Prime2026! | docente |
| (alumno del seed) | Prime2026! | alumno |