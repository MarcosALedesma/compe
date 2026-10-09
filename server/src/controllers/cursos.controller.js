import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export const listar = (req, res, next) => {
  try {
    const rows = db
      .query(
        `SELECT c.id, c.anio, c.division, c.turno, c.ciclo_lectivo,
                (SELECT COUNT(*) FROM alumnos a WHERE a.curso_id = c.id AND a.activo = 1) AS total_alumnos
         FROM cursos c
         ORDER BY c.anio, c.division`
      )
      .all();
    res.json(rows);
  } catch (err) { next(err); }
};

export const obtener = (req, res, next) => {
  try {
    const curso = db.query('SELECT * FROM cursos WHERE id = ?').get(req.params.id);
    if (!curso) throw new HttpError(404, 'Curso no encontrado');

    const alumnos = db
      .query(
        `SELECT id, dni, apellido, nombre FROM alumnos
         WHERE curso_id = ? AND activo = 1
         ORDER BY apellido, nombre`
      )
      .all(req.params.id);

    const materias = db
      .query(
        `SELECT mc.id, m.id AS materia_id, m.nombre AS materia,
                d.id AS docente_id, d.apellido AS docente_apellido, d.nombre AS docente_nombre
         FROM materias_curso mc
         JOIN materias m ON m.id = mc.materia_id
         LEFT JOIN docentes d ON d.id = mc.docente_id
         WHERE mc.curso_id = ?
         ORDER BY m.nombre`
      )
      .all(req.params.id);

    res.json({ ...curso, alumnos, materias });
  } catch (err) { next(err); }
};

export const crear = (req, res, next) => {
  try {
    const { anio, division, turno, ciclo_lectivo } = req.body;

    const dup = db
      .query('SELECT id FROM cursos WHERE anio = ? AND division = ? AND ciclo_lectivo = ?')
      .get(anio, division, ciclo_lectivo);
    if (dup) throw new HttpError(409, 'Ya existe ese curso en ese ciclo lectivo');

    const result = db
      .query('INSERT INTO cursos (anio, division, turno, ciclo_lectivo) VALUES (?, ?, ?, ?)')
      .run(anio, division, turno, ciclo_lectivo);

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { next(err); }
};

export const actualizar = (req, res, next) => {
  try {
    const { id } = req.params;
    const { anio, division, turno, ciclo_lectivo } = req.body;

    const curso = db.query('SELECT * FROM cursos WHERE id = ?').get(id);
    if (!curso) throw new HttpError(404, 'Curso no encontrado');

    db.query(
      `UPDATE cursos SET
        anio = COALESCE(?, anio),
        division = COALESCE(?, division),
        turno = COALESCE(?, turno),
        ciclo_lectivo = COALESCE(?, ciclo_lectivo)
       WHERE id = ?`
    ).run(anio ?? null, division ?? null, turno ?? null, ciclo_lectivo ?? null, id);

    res.json({ ok: true });
  } catch (err) { next(err); }
};

export const eliminar = (req, res, next) => {
  try {
    const alumno = db
      .query('SELECT id FROM alumnos WHERE curso_id = ? AND activo = 1 LIMIT 1')
      .get(req.params.id);
    if (alumno) throw new HttpError(409, 'No se puede eliminar: tiene alumnos activos');

    const result = db.query('DELETE FROM cursos WHERE id = ?').run(req.params.id);
    if (!result.changes) throw new HttpError(404, 'Curso no encontrado');
    res.json({ ok: true });
  } catch (err) { next(err); }
};