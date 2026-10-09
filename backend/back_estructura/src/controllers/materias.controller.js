import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

// Catálogo de materias
export const listarMaterias = (req, res, next) => {
  try {
    res.json(db.query('SELECT * FROM materias ORDER BY anio, nombre').all());
  } catch (err) { next(err); }
};

export const crearMateria = (req, res, next) => {
  try {
    const { nombre, anio } = req.body;
    const result = db
      .query('INSERT INTO materias (nombre, anio) VALUES (?, ?)')
      .run(nombre, anio);
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { next(err); }
};

// Materias asignadas a un curso
export const listarMateriasDeCurso = (req, res, next) => {
  try {
    const rows = db
      .query(
        `SELECT mc.id, mc.curso_id, mc.materia_id, mc.docente_id,
                m.nombre AS materia, m.anio,
                d.apellido AS docente_apellido, d.nombre AS docente_nombre
         FROM materias_curso mc
         JOIN materias m ON m.id = mc.materia_id
         LEFT JOIN docentes d ON d.id = mc.docente_id
         WHERE mc.curso_id = ?
         ORDER BY m.nombre`
      )
      .all(req.params.cursoId);
    res.json(rows);
  } catch (err) { next(err); }
};

export const asignarMateriaACurso = (req, res, next) => {
  try {
    const { curso_id, materia_id, docente_id } = req.body;

    const dup = db
      .query('SELECT id FROM materias_curso WHERE curso_id = ? AND materia_id = ?')
      .get(curso_id, materia_id);
    if (dup) throw new HttpError(409, 'Esa materia ya está asignada a ese curso');

    const result = db
      .query('INSERT INTO materias_curso (curso_id, materia_id, docente_id) VALUES (?, ?, ?)')
      .run(curso_id, materia_id, docente_id ?? null);

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { next(err); }
};

export const actualizarAsignacion = (req, res, next) => {
  try {
    const result = db
      .query('UPDATE materias_curso SET docente_id = ? WHERE id = ?')
      .run(req.body.docente_id ?? null, req.params.id);
    if (!result.changes) throw new HttpError(404, 'Asignación no encontrada');
    res.json({ ok: true });
  } catch (err) { next(err); }
};

export const eliminarAsignacion = (req, res, next) => {
  try {
    const result = db.query('DELETE FROM materias_curso WHERE id = ?').run(req.params.id);
    if (!result.changes) throw new HttpError(404, 'Asignación no encontrada');
    res.json({ ok: true });
  } catch (err) { next(err); }
};