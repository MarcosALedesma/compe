# Prime Dev 2026 — Sistema de Gestión Escolar EETP N° 602

Aplicación web responsiva para gestionar la vida escolar de la **E.E.T.P. N° 602 "General José de San Martín"** (San Martín 2260, Venado Tuerto, Santa Fe): alumnos, docentes, cursos, calificaciones, asistencias y calendario institucional.

Desarrollada en el marco de **Prime Dev 2026** (5 horas de competencia, 9 de octubre de 2026).

---

## 🎯 Objetivo

Reemplazar las planillas y el papel por un sistema centralizado que permita a la dirección responder rápido preguntas como:

- ¿Cuántos alumnos tiene 4º año?
- ¿Quiénes adeudan materias?
- ¿Qué curso tiene más faltas?
- ¿Cuál es el promedio general de cada curso?

---

## 👥 Usuarios y roles

| Rol | Qué puede hacer |
|---|---|
| **Directivo / Preceptor** | Administra todo: alumnos, docentes, cursos, materias, calificaciones, asistencias, eventos, panel de métricas, boletines. |
| **Docente** | Carga notas y asistencias de sus materias. Consulta sus cursos. |
| **Alumno** | Ve solo sus notas, faltas y próximos eventos (portal del alumno). |

---

## 🧱 Stack tecnológico

### Backend
- **Bun** (runtime) — usa `bun:sqlite` nativo
- **Express** — servidor HTTP y ruteo
- **SQLite** — base de datos relacional (archivo `backend/data/app.db`)
- **JWT** — autenticación con roles
- **bcrypt** — hash de contraseñas
- **express-validator** — validación de datos de entrada

### Frontend
- **Angular 18** (standalone components, signals, control flow `@if` / `@for`)
- **Bootstrap Icons** (locales, sin CDN)
- Responsive: usable en celular (360 px) y PC

### Base de datos
- SQLite con claves primarias, foráneas y restricciones `UNIQUE`
- Script de creación: `backend/schema.sql`
- El promedio anual y el estado académico se **calculan**, no se guardan

---

## 📁 Estructura del proyecto

```
compe/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js (conexión + tablas + vistas)
│   │   ├── controllers/     # lógica HTTP por recurso
│   │   ├── middlewares/     # auth.js, role.js
│   │   ├── routes/          # un archivo por recurso
│   │   ├── services/        # lógica de negocio (promedios, faltas)
│   │   ├── utils/           # helpers (HttpError, jwt, etc.)
│   │   ├── seed/            # seed.js (datos de prueba)
│   │   └── server.js        # punto de entrada
│   ├── data/
│   │   └── app.db           # SQLite (generado por el seed, NO se commitea)
│   ├── db/
│   │   └── schema.sql       # esquema de la base
│   ├── .env.example         # plantilla de variables de entorno
│   └── package.json
├── frontend/                # Angular 18
│   └── src/app/
│       ├── core/            # guards, interceptors, servicios
│       ├── shared/          # componentes reutilizables
│       └── features/        # módulos por dominio (alumnos, notas, etc.)
├── API.md                   # contrato de la API
├── CHEATSHEET.md            # comandos útiles
├── README.md
└── .gitignore
```

---

## 🚀 Puesta en marcha

### Requisitos previos

- **Bun** 1.4 o superior → [instalar](https://bun.sh)
- **Node.js** 18.19+ / 20.11+ / 22 → necesario solo para el Angular CLI
- Verificar versiones:
  ```bash
  bun -v
  node -v
  ```

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd compe
```

### 2. Instalar dependencias

```bash
bun run install:all
```

Esto instala dependencias en la raíz, en `backend/` y en `frontend/`.

### 3. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

Editá `backend/.env` si hace falta (puerto, secreto JWT, etc.).

### 4. Cargar datos de prueba

```bash
bun run seed
```

Esto crea `backend/data/app.db` con:

- 6 cursos (1º a 6º año, división A, turno mañana)
- 60 alumnos ficticios (10 por curso)
- 8 docentes y 5 materias por curso
- Notas de los 3 trimestres para 2 cursos completos
- Asistencia de 10 días hábiles para 1 curso
- 5 eventos, incluido el **Encuentro Tecnológico del 9/10/2026**
- Usuarios de prueba (ver abajo)

### 5. Levantar todo

```bash
bun run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:4200 (con proxy a `/api`)

---

## 🔑 Usuarios de prueba

| Email | Contraseña | Rol |
|---|---|---|
| `director@eetp602.test` | `Prime2026!` | directivo |
| `docente@eetp602.test` | `Prime2026!` | docente |
| (alumno del seed) | `Prime2026!` | alumno |

> El login del alumno se crea en el seed. Revisá `backend/src/seed/seed.js` para ver el email exacto.

---

## 📚 Módulos implementados

### Nivel 1 — Básico

- **Alumnos**: ABM, baja lógica, búsqueda por DNI/apellido, asignación a curso.
- **Docentes**: ABM, materias que dicta, datos de contacto.
- **Cursos y materias**: cursos 1º a 6º con división y turno; materias por curso con docente asignado.

### Nivel 2 — Intermedio

- **Calificaciones**: carga por trimestre (1º, 2º, 3º), promedio anual automático, estado Aprobado / Diciembre / Febrero / Previa.
- **Asistencia**: toma diaria (Presente / Ausente / Tarde = ½ falta), total de inasistencias por alumno, alerta al llegar a 20.
- **Calendario**: actos, mesas de examen, cierre de trimestre, Encuentro Tecnológico.

### Nivel 3 — Avanzado

- **Panel de dirección**: totales, alumnos por año, promedio por curso, top 5 con más faltas, materias con más desaprobados.
- **Boletín**: individual y por curso, exportable a PDF / imprimible.
- **Portal del alumno**: login propio, ve solo sus notas, faltas y eventos.

### Bonus implementados

- ✅ **Importar alumnos desde CSV** (`POST /alumnos/importar`)
- ✅ **Auditoría de cambios de notas** (`GET /calificaciones/auditoria`)
- ⬜ Modo oscuro
- ⬜ Deploy público

---

## 🗄️ Modelo de datos

Tablas principales:

| Tabla | Descripción |
|---|---|
| `usuarios` | Login con rol (`directivo`, `docente`, `alumno`), contraseña hasheada |
| `alumnos` | DNI único, datos personales, `activo` (baja lógica), `curso_id` |
| `docentes` | DNI único, datos de contacto |
| `cursos` | Año (1-6), división, turno, ciclo lectivo |
| `materias` | Nombre, año |
| `materias_curso` | Une curso + materia + docente |
| `calificaciones` | Único por alumno + materia_curso + trimestre. Nota 1-10 |
| `asistencias` | Único por alumno + fecha. Estado P/A/T |
| `eventos` | Título, tipo, fechas, curso opcional |
| `auditoria_notas` | Quién y cuándo modificó una nota (bonus) |

El **promedio anual** y el **estado académico** se calculan en el backend a partir de las notas trimestrales.

Esquema completo: `backend/db/schema.sql`.

---

## 🔌 API

Contrato completo en [`API.md`](./API.md).

Base URL: `http://localhost:3000/api`

Todas las rutas (excepto `/auth/login`) requieren `Authorization: Bearer <token>`.

---

## ✅ Validaciones clave

- Nota entre **1 y 10** (rechaza 0 y 11)
- Trimestre entre **1 y 3**
- DNI **único** (rechaza duplicados)
- Fechas válidas (formato y existencia real)
- No inscribir dos veces al mismo alumno en un curso
- Contraseñas **hasheadas** con bcrypt
- Consultas **parametrizadas** (sin SQL Injection)

---

## 🧪 Casos de prueba en vivo (jurado)

| Caso | Resultado esperado |
|---|---|
| Cargar nota **11** | `400` — rechazada |
| Cargar nota **0** | `400` — rechazada |
| Crear alumno con **DNI repetido** | `409` — rechazado |
| Trimestre fuera de 1-3 | `400` — rechazado |
| Estado de asistencia distinto de P/A/T | `400` — rechazado |
| Evento con `fecha_fin < fecha_inicio` | `400` — rechazado |
| Docente intentando ver panel de dirección | `403` |
| Alumno intentando ver boletín ajeno | `403` |

---

## 📜 Scripts disponibles

Desde la raíz del proyecto:

| Comando | Qué hace |
|---|---|
| `bun run install:all` | Instala dependencias en raíz + backend + frontend |
| `bun run seed` | Crea y puebla `backend/data/app.db` |
| `bun run dev` | Levanta backend (`:3000`) y frontend (`:4200`) en paralelo |

Desde `backend/`:

| Comando | Qué hace |
|---|---|
| `bun --watch src/server.js` | Levanta solo el backend con auto-reload |

Desde `frontend/`:

| Comando | Qué hace |
|---|---|
| `bun run start` | Levanta solo el frontend |

---

## 🛠️ Troubleshooting

### El backend no arranca: "Cannot find module"

Revisá que todos los controllers referenciados en `routes/` existan. Bun resuelve imports en tiempo de carga: un solo archivo faltante tumba todo el server.

### `bun:sqlite` no funciona con Node

El backend usa `bun:sqlite`, que **solo existe en Bun**. No intentes correrlo con `node src/server.js`.

### Angular CLI pide Node

El Angular CLI sí necesita Node instalado (18.19+ / 20.11+ / 22). Bun solo no alcanza.

### Acentos rotos en la consola Windows

No es un bug del backend: es la consola. Los datos se guardan bien en UTF-8. Para verlos bien:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### El seed no crea la base

Verificá que exista la carpeta `backend/data/`. Si no, creala:

```powershell
New-Item -ItemType Directory -Force backend\data
```

---

## 👨‍💻 Equipo "polenta con salsa"

- Integrante 1:Marcos Ledesma
- Integrante 2:Agustin Lanthier


---

## 📄 Licencia

Proyecto desarrollado para **Prime Dev 2026**. La aplicación ganadora será implementada por la E.E.T.P. N° 602 (Art. 8 del reglamento).
