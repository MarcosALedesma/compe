import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

function calcularEstado(promedio, notas) {
  if (notas.length === 0) return 'Sin notas';
  if (promedio >= 6 && notas.every((n) => n >= 6)) return 'Aprobado';
  if (promedio >= 6 && notas.some((n) => n >= 4 && n < 6)) return 'Diciembre';
  if (promedio >= 4) return 'Diciembre';
  if (promedio >= 2) return 'Febrero';
  return 'Previa';
}

export const listar = (req, res, next) => {
  try {
    const { alumno_id, materia_curso_id, curso_id } = req.query;

    let sql = `
      SELECT c.id, c.alumno_id, c.materia_curso_id, c.trimestre, c.nota,
             c.modificado_por, c.modificado_en,
             a.apellido AS alumno_apellido, a.nombre AS alumno_nombre,
             m.nombre AS materia, mc.curso_id,
             cu.anio, cu.division
      FROM calificaciones c
      JOIN alumnos a ON a.id = c.alumno_id
      JOIN materias_curso mc ON mc.id = c.materia_curso_id
      JOIN materias m ON m.id = mc.materia_id
      JOIN cursos cu ON cu.id = mc.curso_id
      WHERE 1=1
    `;
    const params = [];

    if (alumno_id)          { sql += ' AND c.alumno_id = ?';         params.push(alumno_id); }
    if (materia_curso_id)   { sql += ' AND c.materia_curso_id = ?';  params.push(materia_curso_id); }
    if (curso_id)           { sql += ' AND mc.curso_id = ?';         params.push(curso_id); }

    sql += ' ORDER BY a.apellido, a.nombre, m.nombre, c.trimestre';

    res.json(db.query(sql).all(...params));
  } catch (err) { next(err); }
};


export const porAlumno = (req, res, next) => {
  try {
    const { alumnoId } = req.params;

    const alumno = db.query('SELECT * FROM alumnos WHERE id = ?').get(alumnoId);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const notas = db
      .query(
        `SELECT c.materia_curso_id, c.trimestre, c.nota,
                m.nombre AS materia, mc.curso_id,
                cu.anio, cu.division
         FROM calificaciones c
         JOIN materias_curso mc ON mc.id = c.materia_curso_id
         JOIN materias m ON m.id = mc.materia_id
         JOIN cursos cu ON cu.id = mc.curso_id
         WHERE c.alumno_id = ?
         ORDER BY m.nombre, c.trimestre`
      )
      .all(alumnoId);

    const porMateria = new Map();
    for (const n of notas) {
      if (!porMateria.has(n.materia_curso_id)) {
        porMateria.set(n.materia_curso_id, {
          materia_curso_id: n.materia_curso_id,
          materia: n.materia,
          anio: n.anio,
          division: n.division,
          notas: { 1: null, 2: null, 3: null }
        });
      }
      porMateria.get(n.materia_curso_id).notas[n.trimestre] = n.nota;
    }

    const resultado = [...porMateria.values()].map((m) => {
      const valores = Object.values(m.notas).filter((v) => v !== null);
      const promedio = valores.length
        ? Number((valores.reduce((s, v) => s + v, 0) / valores.length).toFixed(2))
        : null;
      return {
        ...m,
        promedio,
        estado: calcularEstado(promedio ?? 0, valores)
      };
    });

    res.json({ alumno, materias: resultado });
  } catch (err) { next(err); }
};


export const crearOActualizar = (req, res, next) => {
  try {
    const { alumno_id, materia_curso_id, trimestre, nota } = req.body;
    const usuarioId = req.user.id;

    if (!Number.isInteger(trimestre) || trimestre < 1 || trimestre > 3) {
      throw new HttpError(400, 'El trimestre debe ser 1, 2 o 3');
    }
    if (typeof nota !== 'number' || nota < 1 || nota > 10) {
      throw new HttpError(400, 'La nota debe estar entre 1 y 10');
    }

    const alumno = db.query('SELECT id FROM alumnos WHERE id = ? AND activo = 1').get(alumno_id);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado o inactivo');

    const mc = db.query('SELECT * FROM materias_curso WHERE id = ?').get(materia_curso_id);
    if (!mc) throw new HttpError(404, 'Materia-curso no encontrada');

    const alumnoCurso = db.query('SELECT curso_id FROM alumnos WHERE id = ?').get(alumno_id);
    if (alumnoCurso.curso_id !== mc.curso_id) {
      throw new HttpError(400, 'El alumno no pertenece al curso de esa materia');
    }

    if (req.user.rol === 'docente' && mc.docente_id !== req.user.docente_id) {
      throw new HttpError(403, 'No podés cargar notas de materias que no dictás');
    }

    const existente = db
      .query(
        'SELECT * FROM calificaciones WHERE alumno_id = ? AND materia_curso_id = ? AND trimestre = ?'
      )
      .get(alumno_id, materia_curso_id, trimestre);

    const tx = db.transaction(() => {
      if (existente) {
        db.query(
          `INSERT INTO auditoria_calificaciones (calificacion_id, usuario_id, nota_anterior, nota_nueva)
           VALUES (?, ?, ?, ?)`
        ).run(existente.id, usuarioId, existente.nota, nota);

        db.query(
          `UPDATE calificaciones
           SET nota = ?, modificado_por = ?, modificado_en = datetime('now')
           WHERE id = ?`
        ).run(nota, usuarioId, existente.id);

        return { id: existente.id, actualizado: true };
      } else {
        const r = db
          .query(
            `INSERT INTO calificaciones (alumno_id, materia_curso_id, trimestre, nota, modificado_por)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(alumno_id, materia_curso_id, trimestre, nota, usuarioId);

        db.query(
          `INSERT INTO auditoria_calificaciones (calificacion_id, usuario_id, nota_anterior, nota_nueva)
           VALUES (?, ?, NULL, ?)`
        ).run(Number(r.lastInsertRowid), usuarioId, nota);

        return { id: Number(r.lastInsertRowid), actualizado: false };
      }
    });

    const result = tx();
    res.status(result.actualizado ? 200 : 201).json(result);
  } catch (err) { next(err); }
};

export const eliminar = (req, res, next) => {
  try {
    const cal = db.query('SELECT * FROM calificaciones WHERE id = ?').get(req.params.id);
    if (!cal) throw new HttpError(404, 'Calificación no encontrada');

    if (req.user.rol === 'docente') {
      const mc = db.query('SELECT docente_id FROM materias_curso WHERE id = ?').get(cal.materia_curso_id);
      if (mc.docente_id !== req.user.docente_id) {
        throw new HttpError(403, 'No podés borrar notas de materias que no dictás');
      }
    }

    db.query(
      `INSERT INTO auditoria_calificaciones (calificacion_id, usuario_id, nota_anterior, nota_nueva)
       VALUES (?, ?, ?, 0)`
    ).run(cal.id, req.user.id, cal.nota);

    db.query('DELETE FROM calificaciones WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
};


export const auditoria = (req, res, next) => {
  try {
    const { calificacion_id } = req.query;

    let sql = `
      SELECT ac.id, ac.calificacion_id, ac.usuario_id, ac.nota_anterior, ac.nota_nueva, ac.fecha,
             u.email AS usuario_email, u.rol AS usuario_rol
      FROM auditoria_calificaciones ac
      LEFT JOIN usuarios u ON u.id = ac.usuario_id
      WHERE 1=1
    `;
    const params = [];
    if (calificacion_id) { sql += ' AND ac.calificacion_id = ?'; params.push(calificacion_id); }
    sql += ' ORDER BY ac.fecha DESC LIMIT 200';

    res.json(db.query(sql).all(...params));
  } catch (err) { next(err); }
};