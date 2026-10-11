import { db } from './db.js';

const migrateEnrollmentHistory = db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alumnos_cursos (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      alumno_id     INTEGER NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
      curso_id      INTEGER NOT NULL REFERENCES cursos(id) ON DELETE RESTRICT,
      fecha_inicio  TEXT NOT NULL CHECK (date(fecha_inicio) IS NOT NULL),
      fecha_fin     TEXT CHECK (fecha_fin IS NULL OR date(fecha_fin) IS NOT NULL),
      CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
    );
    CREATE INDEX IF NOT EXISTS idx_alumnos_cursos_alumno
      ON alumnos_cursos(alumno_id, fecha_inicio);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alumnos_curso_actual
      ON alumnos_cursos(alumno_id) WHERE fecha_fin IS NULL;
  `);

  db.query(`
    INSERT INTO alumnos_cursos (alumno_id, curso_id, fecha_inicio)
    SELECT a.id, a.curso_id, printf('%04d-03-01', c.ciclo_lectivo)
    FROM alumnos a
    JOIN cursos c ON c.id = a.curso_id
    WHERE NOT EXISTS (
      SELECT 1 FROM alumnos_cursos ac
      WHERE ac.alumno_id = a.id AND ac.fecha_fin IS NULL
    )
  `).run();

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_alumno_curso_insert
    AFTER INSERT ON alumnos
    WHEN NEW.curso_id IS NOT NULL
    BEGIN
      INSERT INTO alumnos_cursos (alumno_id, curso_id, fecha_inicio)
      VALUES (NEW.id, NEW.curso_id, date('now'));
    END;

    CREATE TRIGGER IF NOT EXISTS trg_alumno_curso_update
    AFTER UPDATE OF curso_id ON alumnos
    WHEN OLD.curso_id IS NOT NEW.curso_id
    BEGIN
      UPDATE alumnos_cursos
      SET fecha_fin = MAX(fecha_inicio, date('now', '-1 day'))
      WHERE alumno_id = OLD.id AND fecha_fin IS NULL;

      INSERT INTO alumnos_cursos (alumno_id, curso_id, fecha_inicio)
      SELECT NEW.id, NEW.curso_id, date('now')
      WHERE NEW.curso_id IS NOT NULL;
    END;
  `);
});

migrateEnrollmentHistory();
