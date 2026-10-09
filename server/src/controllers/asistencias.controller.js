import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';


export const listar = (req, res, next) => {
  try {
    const { alumno_id, fecha, curso_id } = req.query;

    let sql = `
      SELECT s.id, s.alumno_id, s.fecha, s.estado,
             a.apellido, a.nombre, a.curso_id
      FROM asistencias s
      JOIN alumnos a ON a.id = s.alumno_id
      WHERE 1=1
    `;
    const params = [];

    if (alumno_id) { sql += ' AND s.alumno_id = ?'; params.push(alumno_id); }
    if (fecha)     { sql += ' AND s.fecha = ?';     params.push(fecha); }
    if (curso_id)  { sql += ' AND a.curso_id = ?';  params.push(curso_id); }

    sql += ' ORDER BY s.fecha DESC, a.apellido, a.nombre';

    res.json(db.query(sql).all(...params));
  } catch (err) { next(err); }
};


export const porCursoYFecha = (req, res, next) => {
  try {
    const { cursoId } = req.params;
    const { fecha } = req.query;

    if (!fecha) throw new HttpError(400, 'El parámetro fecha es obligatorio');

    const alumnos = db
      .query(
        `SELECT a.id, a.dni, a.apellido, a.nombre,
                s.estado, s.id AS asistencia_id
         FROM alumnos a
         LEFT JOIN asistencias s ON s.alumno_id = a.id AND s.fecha = ?
         WHERE a.curso_id = ? AND a.activo = 1
         ORDER BY a.apellido, a.nombre`
      )
      .all(fecha, cursoId);

    res.json({ curso_id: Number(cursoId), fecha, alumnos });
  } catch (err) { next(err); }
};

export const tomarAsistencia = (req, res, next) => {
  try {
    const { curso_id, fecha, registros } = req.body;

    if (!curso_id || !fecha) throw new HttpError(400, 'curso_id y fecha son obligatorios');
    if (!Array.isArray(registros) || registros.length === 0) {
      throw new HttpError(400, 'registros debe ser un array no vacío');
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new HttpError(400, 'fecha debe tener formato YYYY-MM-DD');
    }

    for (const r of registros) {
      if (!['P', 'A', 'T'].includes(r.estado)) {
        throw new HttpError(400, `Estado inválido para alumno ${r.alumno_id}: ${r.estado}`);
      }
    }

    const alumnosCurso = db
      .query('SELECT id FROM alumnos WHERE curso_id = ? AND activo = 1')
      .all(curso_id)
      .map((a) => a.id);

    for (const r of registros) {
      if (!alumnosCurso.includes(r.alumno_id)) {
        throw new HttpError(400, `El alumno ${r.alumno_id} no pertenece al curso ${curso_id}`);
      }
    }

    const upsert = db.query(
      `INSERT INTO asistencias (alumno_id, fecha, estado)
       VALUES (?, ?, ?)
       ON CONFLICT(alumno_id, fecha) DO UPDATE SET estado = excluded.estado`
    );

    const tx = db.transaction(() => {
      for (const r of registros) {
        upsert.run(r.alumno_id, fecha, r.estado);
      }
    });
    tx();

    res.json({ ok: true, registros: registros.length });
  } catch (err) { next(err); }
};


export const resumen = (req, res, next) => {
  try {
    const { curso_id } = req.query;

    let sql = `
      SELECT v.alumno_id, v.apellido, v.nombre, v.curso_id, v.faltas, v.alerta,
             c.anio, c.division
      FROM v_inasistencias v
      LEFT JOIN cursos c ON c.id = v.curso_id
      WHERE 1=1
    `;
    const params = [];
    if (curso_id) { sql += ' AND v.curso_id = ?'; params.push(curso_id); }
    sql += ' ORDER BY v.faltas DESC';

    res.json(db.query(sql).all(...params));
  } catch (err) { next(err); }
};


export const porAlumno = (req, res, next) => {
  try {
    const { alumnoId } = req.params;

    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(alumnoId);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const detalle = db
      .query(
        `SELECT fecha, estado FROM asistencias
         WHERE alumno_id = ?
         ORDER BY fecha DESC`
      )
      .all(alumnoId);

    const total = db
      .query('SELECT faltas, alerta FROM v_inasistencias WHERE alumno_id = ?')
      .get(alumnoId);

    res.json({ alumno, detalle, ...total });
  } catch (err) { next(err); }
};