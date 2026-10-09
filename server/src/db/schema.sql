PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- CURSOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cursos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  anio           INTEGER NOT NULL CHECK (anio BETWEEN 1 AND 6),
  division       TEXT    NOT NULL CHECK (length(trim(division)) > 0),
  turno          TEXT    NOT NULL CHECK (turno IN ('mañana', 'tarde', 'noche')),
  ciclo_lectivo  INTEGER NOT NULL CHECK (ciclo_lectivo BETWEEN 2000 AND 2100),
  UNIQUE (anio, division, ciclo_lectivo)
);

-- ---------------------------------------------------------------------
-- ALUMNOS
CREATE TABLE IF NOT EXISTS alumnos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dni             TEXT    NOT NULL UNIQUE CHECK (dni GLOB '[0-9]*' AND length(dni) BETWEEN 7 AND 9),
  apellido        TEXT    NOT NULL CHECK (length(trim(apellido)) > 0),
  nombre          TEXT    NOT NULL CHECK (length(trim(nombre)) > 0),
  fecha_nac       TEXT    NOT NULL CHECK (date(fecha_nac) IS NOT NULL AND fecha_nac = date(fecha_nac)),
  tutor           TEXT,
  telefono_tutor  TEXT,
  curso_id        INTEGER REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE SET NULL,
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  creado_en       TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alumnos_apellido ON alumnos(apellido);
CREATE INDEX IF NOT EXISTS idx_alumnos_curso    ON alumnos(curso_id);

-- ---------------------------------------------------------------------
-- DOCENTES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS docentes (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  dni       TEXT    NOT NULL UNIQUE CHECK (dni GLOB '[0-9]*' AND length(dni) BETWEEN 7 AND 9),
  apellido  TEXT    NOT NULL CHECK (length(trim(apellido)) > 0),
  nombre    TEXT    NOT NULL CHECK (length(trim(nombre)) > 0),
  email     TEXT    UNIQUE,
  telefono  TEXT,
  activo    INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_docentes_apellido ON docentes(apellido);

-- ---------------------------------------------------------------------
-- USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  rol            TEXT    NOT NULL CHECK (rol IN ('directivo', 'docente', 'alumno')),
  docente_id     INTEGER UNIQUE REFERENCES docentes(id) ON DELETE CASCADE,
  alumno_id      INTEGER UNIQUE REFERENCES alumnos(id)  ON DELETE CASCADE,
  activo         INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  CHECK (
    (rol = 'directivo' AND docente_id IS NULL AND alumno_id IS NULL) OR
    (rol = 'docente'   AND docente_id IS NOT NULL AND alumno_id IS NULL) OR
    (rol = 'alumno'    AND alumno_id  IS NOT NULL AND docente_id IS NULL)
  )
);

-- ---------------------------------------------------------------------
-- MATERIAS 
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materias (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT    NOT NULL CHECK (length(trim(nombre)) > 0),
  anio    INTEGER NOT NULL CHECK (anio BETWEEN 1 AND 6),
  UNIQUE (nombre, anio)
);

CREATE TABLE IF NOT EXISTS materias_curso (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  curso_id    INTEGER NOT NULL REFERENCES cursos(id)   ON DELETE CASCADE,
  materia_id  INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  docente_id  INTEGER REFERENCES docentes(id) ON DELETE SET NULL,
  UNIQUE (curso_id, materia_id)
);
CREATE INDEX IF NOT EXISTS idx_mc_docente ON materias_curso(docente_id);

-- --------------------------------------------------------------------
-- CALIFICACIONES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calificaciones (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id         INTEGER NOT NULL REFERENCES alumnos(id)        ON DELETE CASCADE,
  materia_curso_id  INTEGER NOT NULL REFERENCES materias_curso(id) ON DELETE CASCADE,
  trimestre         INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 3),
  nota              REAL    NOT NULL CHECK (nota BETWEEN 1 AND 10),
  modificado_por    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  modificado_en     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (alumno_id, materia_curso_id, trimestre)
);
CREATE INDEX IF NOT EXISTS idx_calif_mc ON calificaciones(materia_curso_id);

CREATE TABLE IF NOT EXISTS auditoria_calificaciones (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  calificacion_id  INTEGER NOT NULL,
  usuario_id       INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nota_anterior    REAL,
  nota_nueva       REAL NOT NULL,
  fecha            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- ASISTENCIAS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asistencias (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  alumno_id  INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha      TEXT    NOT NULL CHECK (date(fecha) IS NOT NULL AND fecha = date(fecha)),
  estado     TEXT    NOT NULL CHECK (estado IN ('P', 'A', 'T')),
  UNIQUE (alumno_id, fecha)
);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);

-- ---------------------------------------------------------------------
-- EVENTOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo        TEXT NOT NULL CHECK (length(trim(titulo)) > 0),
  tipo          TEXT NOT NULL CHECK (tipo IN ('acto', 'examen', 'feriado', 'institucional')),
  fecha_inicio  TEXT NOT NULL CHECK (date(fecha_inicio) IS NOT NULL AND fecha_inicio = date(fecha_inicio)),
  fecha_fin     TEXT NOT NULL CHECK (date(fecha_fin) IS NOT NULL AND fecha_fin = date(fecha_fin)),
  curso_id      INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
  CHECK (fecha_fin >= fecha_inicio)
);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha_inicio);

-- ---------------------------------------------------------------------
-- VISTAS 
-- ---------------------------------------------------------------------

CREATE VIEW IF NOT EXISTS v_inasistencias AS
SELECT
  a.id AS alumno_id,
  a.apellido,
  a.nombre,
  a.curso_id,
  COALESCE(SUM(CASE s.estado WHEN 'A' THEN 1.0 WHEN 'T' THEN 0.5 ELSE 0 END), 0) AS faltas,
  CASE WHEN COALESCE(SUM(CASE s.estado WHEN 'A' THEN 1.0 WHEN 'T' THEN 0.5 ELSE 0 END), 0) >= 20
       THEN 1 ELSE 0 END AS alerta
FROM alumnos a
LEFT JOIN asistencias s ON s.alumno_id = a.id
WHERE a.activo = 1
GROUP BY a.id;

CREATE VIEW IF NOT EXISTS v_promedio_anual AS
SELECT
  c.alumno_id,
  c.materia_curso_id,
  COUNT(*)                 AS trimestres_cargados,
  ROUND(AVG(c.nota), 2)    AS promedio
FROM calificaciones c
GROUP BY c.alumno_id, c.materia_curso_id;
