import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export const listar = (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const like = `%${search}%`;
    res.json(
      db
        .query(
          `SELECT id, dni, apellido, nombre, email, telefono, activo
           FROM docentes
           WHERE activo = 1 AND (dni LIKE ? OR apellido LIKE ? OR nombre LIKE ?)
           ORDER BY apellido, nombre`
        )
        .all(like, like, like)
    );
  } catch (err) { next(err); }
};

export const obtener = (req, res, next) => {
  try {
    const doc = db.query('SELECT * FROM docentes WHERE id = ?').get(req.params.id);
    if (!doc) throw new HttpError(404, 'Docente no encontrado');

    const materias = db
      .query(
        `SELECT mc.id, m.nombre AS materia, c.anio, c.division, c.turno
         FROM materias_curso mc
         JOIN materias m ON m.id = mc.materia_id
         JOIN cursos c   ON c.id = mc.curso_id
         WHERE mc.docente_id = ?`
      )
      .all(req.params.id);

    res.json({ ...doc, materias });
  } catch (err) { next(err); }
};

export const crear = (req, res, next) => {
  try {
    const { dni, apellido, nombre, email, telefono } = req.body;

    const dup = db.query('SELECT id FROM docentes WHERE dni = ?').get(dni);
    if (dup) throw new HttpError(409, 'Ya existe un docente con ese DNI');

    const result = db
      .query('INSERT INTO docentes (dni, apellido, nombre, email, telefono) VALUES (?, ?, ?, ?, ?)')
      .run(dni, apellido, nombre, email ?? null, telefono ?? null);

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) { next(err); }
};

export const actualizar = (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = db.query('SELECT * FROM docentes WHERE id = ?').get(id);
    if (!doc) throw new HttpError(404, 'Docente no encontrado');

    const { dni, apellido, nombre, email, telefono } = req.body;

    if (dni && dni !== doc.dni) {
      const dup = db.query('SELECT id FROM docentes WHERE dni = ? AND id <> ?').get(dni, id);
      if (dup) throw new HttpError(409, 'DNI ya usado por otro docente');
    }

    db.query(
      `UPDATE docentes SET
        dni = COALESCE(?, dni),
        apellido = COALESCE(?, apellido),
        nombre = COALESCE(?, nombre),
        email = COALESCE(?, email),
        telefono = COALESCE(?, telefono)
       WHERE id = ?`
    ).run(dni ?? null, apellido ?? null, nombre ?? null, email ?? null, telefono ?? null, id);

    res.json({ ok: true });
  } catch (err) { next(err); }
};

export const bajaLogica = (req, res, next) => {
  try {
    const result = db.query('UPDATE docentes SET activo = 0 WHERE id = ?').run(req.params.id);
    if (!result.changes) throw new HttpError(404, 'Docente no encontrado');
    res.json({ ok: true });
  } catch (err) { next(err); }
};