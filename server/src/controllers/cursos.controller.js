import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { requireCourseAccess } from '../utils/access.js';

export const listar = (req, res, next) => {
  try {
    const where = req.user.rol === 'docente'
      ? 'WHERE EXISTS (SELECT 1 FROM materias_curso mc WHERE mc.curso_id = c.id AND mc.docente_id = ?)'
      : '';
    const query = db.query(`
      SELECT c.id, c.anio, c.division, c.turno, c.ciclo_lectivo,
             (SELECT COUNT(*) FROM alumnos a WHERE a.curso_id = c.id AND a.activo = 1) AS total_alumnos
      FROM cursos c ${where}
      ORDER BY c.anio, c.division
    `);
    const rows = req.user.rol === 'docente' ? query.all(req.user.docente_id) : query.all();
    res.json(rows);
  } catch (err) { next(err); }
};

export const obtener = (req, res, next) => {
  try {
    const curso = db.query('SELECT * FROM cursos WHERE id = ?').get(req.params.id);
    if (!curso) throw new HttpError(404, 'Curso no encontrado');
    requireCourseAccess(req.user, curso.id);

    const camposAlumno = req.user.rol === 'directivo' ? 'id, dni, apellido, nombre' : 'id, apellido, nombre';
    const alumnos = db
      .query(
        `SELECT ${camposAlumno} FROM alumnos
         WHERE curso_id = ? AND activo = 1
         ORDER BY apellido, nombre`
      )
      .all(req.params.id);

    const filtroDocente = req.user.rol === 'docente' ? 'AND mc.docente_id = ?' : '';
    const parametrosMaterias = req.user.rol === 'docente'
      ? [req.params.id, req.user.docente_id]
      : [req.params.id];
    const materias = db
      .query(
        `SELECT mc.id, m.id AS materia_id, m.nombre AS materia,
                d.id AS docente_id, d.apellido AS docente_apellido, d.nombre AS docente_nombre
         FROM materias_curso mc
         JOIN materias m ON m.id = mc.materia_id
         LEFT JOIN docentes d ON d.id = mc.docente_id
        WHERE mc.curso_id = ? ${filtroDocente}
         ORDER BY m.nombre`
      )
      .all(...parametrosMaterias);

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
    const historial = db.query('SELECT id FROM alumnos_cursos WHERE curso_id = ? LIMIT 1').get(req.params.id);
    if (historial) throw new HttpError(409, 'No se puede eliminar: el curso tiene historial de alumnos');
    const alumno = db
      .query('SELECT id FROM alumnos WHERE curso_id = ? AND activo = 1 LIMIT 1')
      .get(req.params.id);
    if (alumno) throw new HttpError(409, 'No se puede eliminar: tiene alumnos activos');

    const result = db.query('DELETE FROM cursos WHERE id = ?').run(req.params.id);
    if (!result.changes) throw new HttpError(404, 'Curso no encontrado');
    res.json({ ok: true });
  } catch (err) { next(err); }
};