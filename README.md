# Prime Dev 2026 - Sistema de Gestión Escolar EETP N° 602

## Situación problemática
La EETP N° 602 "General José de San Martín" (San Martín 2260, Venado Tuerto, Santa Fe) necesita una **aplicación web responsiva para gestionar su vida escolar**: alumnos, docentes, cursos, calificaciones, asistencia y calendario institucional. Hoy esa información está repartida en planillas y papel, y la dirección no puede responder rápido preguntas como "¿cuántos alumnos tiene 4º año?" o "¿quiénes adeudan materias?".

**Objetivo:** en 5 horas, cada equipo (máx. 3 integrantes, Art. 2) desarrolla el sistema con frontend responsivo, backend y base de datos. La aplicación ganadora será implementada por la escuela (Arts. 4 y 8).

**Usuarios del sistema:** Directivo/Preceptor (administra todo), Docente (carga notas y asistencia de sus materias) y, como desafío, Alumno (consulta sus notas).

## Requisitos técnicos obligatorios
Tecnologías libres (Art. 4), pero toda entrega debe cumplir:
1. **Frontend responsivo:** usable en celular (360 px) y en PC.
2. **Backend propio con API** (REST o similar) que valide los datos antes de guardarlos.
3. **Base de datos relacional** (MySQL, PostgreSQL, SQLite, SQL Server, etc.) con claves primarias, foráneas y restricciones. Se entrega el script `schema.sql` o las migraciones.
4. **Login con roles** (mínimo Directivo y Docente). Contraseñas hasheadas, nunca en texto plano.
5. **Repositorio Git** con commits durante la competencia (no un único commit final) y un `README.md` con cómo levantar el proyecto.
6. **Validaciones:** nota entre 1 y 10, DNI único, fechas válidas, no inscribir dos veces al mismo alumno en un curso.

**Permitido:** internet, frameworks, librerías, plantillas de UI y asistentes de IA.
**Prohibido:** consultar al docente acompañante (Art. 4) y usar un sistema escolar ya hecho.

## Módulos funcionales
Los módulos están en tres niveles. Solo suma puntos un nivel superior si el anterior funciona completo.

| Nivel | Módulo | Qué debe hacer | Puntos |
| :--- | :--- | :--- | :--- |
| **1 · Básico** | Alumnos | ABM (alta, baja lógica, modificación), búsqueda por DNI/apellido, asignación a curso | 8 |
| **1 · Básico** | Docentes | ABM, materias que dicta, datos de contacto | 6 |
| **1 · Básico** | Cursos y materias | Cursos 1º a 6º año con división y turno; materias por curso con docente asignado | 6 |
| **2 · Intermedio** | Calificaciones | Carga de notas por trimestre (1º, 2º, 3º), promedio anual automático, estado Aprobado / Diciembre / Febrero / Previa | 10 |
| **2 · Intermedio** | Asistencia | Toma diaria por curso (Presente / Ausente / Tarde = ½ falta), total de inasistencias por alumno, alerta al llegar a 20 | 6 |
| **2 · Intermedio** | Calendario | Fechas importantes: actos, mesas de examen, cierre de trimestre, Encuentro Tecnológico (9/10). Vista mensual o lista | 4 |
| **3 · Avanzado** | Panel de dirección | Total de alumnos y docentes, alumnos por año (gráfico), promedio por curso, top 5 con más faltas, materias con más desaprobados | 6 |
| **3 · Avanzado** | Boletín | Boletín del alumno exportable a PDF o imprimible | 2 |
| **3 · Avanzado** | Portal del alumno | El alumno inicia sesión y ve solo sus notas, faltas y próximas fechas | 2 |

**Bonus (hasta +5 pts extra):** Importar alumnos desde CSV, modo oscuro, auditoría de quién modificó una nota, deploy público funcionando.

## Modelo de datos mínimo
Estas son las entidades mínimas esperadas. Cada equipo puede agregar tablas y campos; el jurado evalúa normalización y relaciones.

| Tabla | Campos clave | Relación |
| :--- | :--- | :--- |
| **usuarios** | id, email, password_hash, rol | 1 a 1 con docente o alumno |
| **alumnos** | id, dni (único), apellido, nombre, fecha_nac, tutor, telefono_tutor, activo | N a 1 con cursos |
| **docentes** | id, dni (único), apellido, nombre, email, telefono | 1 a N con materias_curso |
| **cursos** | id, anio (1-6), division, turno, ciclo_lectivo | 1 a N con alumnos |
| **materias** | id, nombre, anio | N a N con cursos |
| **materias_curso** | id, curso_id, materia_id, docente_id | une curso, materia y docente |
| **calificaciones** | id, alumno_id, materia_curso_id, trimestre (1-3), nota (1-10) | único por alumno + materia + trimestre |
| **asistencias** | id, alumno_id, fecha, estado (P/A/T) | único por alumno + fecha |
| **eventos** | id, titulo, tipo (acto, examen, feriado, institucional), fecha_inicio, fecha_fin, curso_id (opcional) | opcional por curso |

*El promedio anual y el estado del alumno se calculan, no se guardan a mano.*

## Datos de prueba
Cada equipo debe cargar (por seed o script) al menos este volumen, para que el jurado pruebe en igualdad de condiciones:
- 6 cursos (1º a 6º año, división A, turno mañana).
- 60 alumnos ficticios (10 por curso).
- 8 docentes y 5 materias por curso.
- Notas de los 3 trimestres para 2 cursos completos.
- Asistencia de 10 días hábiles para 1 curso.
- 5 eventos en el calendario, incluido el Encuentro Tecnológico del 9/10/2026.
- Usuarios: `director@eetp602.test` y `docente@eetp602.test`, contraseña `Prime2026!`.

**Casos que el jurado va a probar en vivo:**
1. Cargar una nota 11 o 0: debe rechazarla.
2. Crear un alumno con DNI repetido: debe rechazarlo.

## Rúbrica de evaluación (100 pts + 5 bonus)
Basada en los cuatro criterios del Art. 5 del reglamento, más la etapa de Presentación (Art. 3).

**Entregables al cierre:** link al repositorio, `README.md`, `schema.sql` o migraciones, y la app corriendo (local o deploy) lista para la demo.

| Criterio | Qué mira el jurado | Puntos |
| :--- | :--- | :--- |
| **Funcionalidad y operatividad** | Puntos de cada módulo según la tabla de módulos; casos de prueba en vivo | 50 |
| **Estructura del código** | Separación frontend / backend / datos, carpetas ordenadas, nombres claros, base normalizada con FK | 15 |
| **Buenas prácticas** | Validaciones en backend, contraseñas hasheadas, consultas parametrizadas (sin SQL Injection), commits frecuentes, README | 15 |
| **Presentación** | Demo clara en 5 min, respuestas del portavoz | 5 |
| **Bonus** | Extras del nivel avanzado (CSV, auditoría, deploy, modo oscuro) | +5 |

*Si la app no levanta en la demo, Funcionalidad se puntúa en 0.*

## Presentación y desempate
En la presentación, el portavoz muestra en este orden: login como director, panel con métricas, carga de una nota, boletín de un alumno y la vista en celular. Solo el portavoz responde al jurado (Art. 2).

**Desempate, en este orden:**
1. Mayor puntaje en Funcionalidad.
2. Hora del último checkpoint cumplido (gana el más temprano).
3. Mayor puntaje en Buenas prácticas.
4. Decisión del jurado, inapelable (Art. 1).

**Premio:** diploma de participación para todos, mención especial al ganador y su aplicación será la que use la EETP N° 602 (Art. 8).

## Cronograma del 9 de octubre y entregables
El desarrollo dura 5 horas exactas (9:20 a 14:20). Los checkpoints dan puntos por tiempo (Art. 5); el jurado pasa por cada mesa y verifica en vivo.

| Hora | Momento | Qué se verifica |
| :--- | :--- | :--- |
| 9:00 | Acreditación y entrega de consigna | Equipo y portavoz registrados |
| 9:20 | Inicio del desarrollo | Repositorio creado |
| 11:20 | Checkpoint 1 | Nivel 1 funcionando + base de datos con seed |
| 13:20 | Checkpoint 2 | Nivel 2 funcionando |
| 14:20 | Fin del desarrollo | Último commit; después de esta hora no se aceptan cambios |
| 14:30 | Presentaciones | 5 min por equipo + 2 min de preguntas |

# Angular + Express

Ejemplo completo: **tienda con carrito** (auth JWT, productos, carrito, checkout con transacción, pedidos).
Sirve de base para cualquier consigna: copiás, renombrás entidades y listo.

## Puesta en marcha (hacerlo ANTES de la competencia)

```bash
# 1) Dependencias
bun run install:all                 # raíz + backend + frontend

# 2) Datos de prueba (crea backend/data/app.db)
bun run seed

# 3) Levantar todo (back :3000 + front :4200 con proxy a /api)
bun run dev
```

Usuarios de prueba: `admin@test.com / admin123` · `user@test.com / user123`

## Estructura

```
backend/   Express + SQLite (bun:sqlite, viene con Bun), JWT, express-validator
  src/{config,controllers,routes,middlewares,utils,seed}
frontend/  Angular 18 (standalone, signals, control flow @if/@for)
  src/app/{core,shared,features}
API.md     Contrato de la API (acordar con el compañero)
CHEATSHEET.md  Comandos y snippets que se olvidan
```

## Cómo adaptarlo a otra consigna
1. **Modelo de datos**: editar `backend/src/config/db.js` (tablas) y `seed/seed.js`.
2. **Back**: copiar `products.controller.js` como CRUD base → nuevo controller + rutas en `routes/index.js`.
3. **Front**: copiar `features/products/` → nueva feature, agregar ruta en `app.routes.ts`.
4. Reutilizar tal cual: auth, interceptors, guards, `ApiService`, toast, modal, estilos de `styles.css`.

## Notas
- **Bun + Node**: el back corre con Bun (usa `bun:sqlite`, no funciona con Node). El Angular CLI sí necesita **Node instalado** (18.19+ / 20.11+ / 22) además de Bun. Mismo `bun -v` y `node -v` en ambas compus. Probado con Bun 1.4 y Node 22.
- **Comandos del CLI de Angular**: `bunx ng generate component ...` (o `bun run ng ...`).
- **Build de producción** (`ng build`): ya viene con la inlineación de fuentes desactivada, así que funciona sin internet. La fuente Inter se carga por Google Fonts en `index.html` (si no hay internet cae a la fuente del sistema).
- **Imágenes** del seed vienen de picsum.photos (requiere internet). Sin internet se ve el gris de fondo; cambiá `image_url` en el seed por rutas locales si hace falta.
- **Iconos**: Bootstrap Icons instalados localmente (`bun install` los trae, ya están en `angular.json`). Uso: `<i class="bi bi-cart"></i>`. Funcionan sin internet.
- `.env` está en `.gitignore`; el repo trae `.env.example`.
