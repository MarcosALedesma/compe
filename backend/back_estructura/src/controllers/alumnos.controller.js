import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export const listar = (req, res, next) => {
  try {
    const { search = '', curso_id, activo = 1 } = req.query;
    const like = `%${search}%`;

    let sql = `
      SELECT a.id, a.dni, a.apellido, a.nombre, a.fecha_nac,
             a.tutor, a.telefono_tutor, a.activo,
             c.id AS curso_id, c.anio, c.division, c.turno
      FROM alumnos a
      LEFT JOIN cursos c ON c.id = a.curso_id
      WHERE a.activo = ?
        AND (a.dni LIKE ? OR a.apellido LIKE ? OR a.nombre LIKE ?)
    `;
    const params = [Number(activo), like, like, like];

    if (curso_id) {
      sql += ' AND a.curso_id = ?';
      params.push(Number(curso_id));
    }
    sql += ' ORDER BY a.apellido, a.nombre';

    res.json(db.query(sql).all(...params));
  } catch (err) {
    next(err);
  }
};

export const obtener = (req, res, next) => {
  try {
    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(req.params.id);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');
    res.json(alumno);
  } catch (err) {
    next(err);
  }
};

export const crear = (req, res, next) => {
  try {
    const { dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id } = req.body;

    const dup = db.query('SELECT id FROM alumnos WHERE dni = ?').get(dni);
    if (dup) throw new HttpError(409, 'Ya existe un alumno con ese DNI');

    const result = db
      .query(
        `INSERT INTO alumnos (dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(dni, apellido, nombre, fecha_nac, tutor ?? null, telefono_tutor ?? null, curso_id ?? null);

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    next(err);
  }
};

export const actualizar = (req, res, next) => {
  try {
    const { id } = req.params;
    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(id);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const { dni, apellido, nombre, fecha_nac, tutor, telefono_tutor, curso_id } = req.body;

    if (dni && dni !== alumno.dni) {
      const dup = db.query('SELECT id FROM alumnos WHERE dni = ? AND id <> ?').get(dni, id);
      if (dup) throw new HttpError(409, 'DNI ya usado por otro alumno');
    }

    db.query(
      `UPDATE alumnos SET
        dni = COALESCE(?, dni),
        apellido = COALESCE(?, apellido),
        nombre = COALESCE(?, nombre),
        fecha_nac = COALESCE(?, fecha_nac),
        tutor = COALESCE(?, tutor),
        telefono_tutor = COALESCE(?, telefono_tutor),
        curso_id = ?
      WHERE id = ?`
    ).run(
      dni ?? null, apellido ?? null, nombre ?? null, fecha_nac ?? null,
      tutor ?? null, telefono_tutor ?? null,
      curso_id !== undefined ? curso_id : alumno.curso_id,
      id
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Baja lógica
export const bajaLogica = (req, res, next) => {
  try {
    const result = db.query('UPDATE alumnos SET activo = 0 WHERE id = ?').run(req.params.id);
    if (!result.changes) throw new HttpError(404, 'Alumno no encontrado');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const asignarCurso = (req, res, next) => {
  try {
    const { id } = req.params;
    const { curso_id } = req.body;

    if (!curso_id) throw new HttpError(400, 'curso_id es obligatorio');

    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(id);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const curso = db.query('SELECT id FROM cursos WHERE id = ?').get(curso_id);
    if (!curso) throw new HttpError(404, 'Curso no encontrado');

    if (alumno.curso_id === Number(curso_id)) {
      throw new HttpError(409, 'El alumno ya está en ese curso');
    }

    db.query('UPDATE alumnos SET curso_id = ? WHERE id = ?').run(curso_id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};