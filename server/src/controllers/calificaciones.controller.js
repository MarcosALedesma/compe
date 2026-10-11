import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { requireCourseAccess, requireMateriaCursoAccess, requireStudentAccess } from '../utils/access.js';

function calcularEstado(promedio, notas) {
  if (notas.length === 0) return 'Sin notas';
  if (promedio >= 6 && notas.every((n) => n >= 6)) return 'Aprobado';
  if (promedio >= 6 && notas.some((n) => n >= 4 && n < 6)) return 'Diciembre';
  if (promedio >= 4) return 'Diciembre';
  if (promedio >= 2) return 'Febrero';
  return 'Previa';
}

function validarCalificacion({ alumno_id, materia_curso_id, trimestre, nota }, user) {
  if (!Number.isInteger(Number(trimestre)) || Number(trimestre) < 1 || Number(trimestre) > 3) {
    throw new HttpError(400, 'El trimestre debe ser 1, 2 o 3');
  }
  if (typeof nota !== 'number' || nota < 1 || nota > 10) {
    throw new HttpError(400, 'La nota debe estar entre 1 y 10');
  }

  const alumno = db.query('SELECT id FROM alumnos WHERE id = ? AND activo = 1').get(alumno_id);
  if (!alumno) throw new HttpError(404, 'Alumno no encontrado o inactivo');

  const materiaCurso = db.query('SELECT * FROM materias_curso WHERE id = ?').get(materia_curso_id);
  if (!materiaCurso) throw new HttpError(404, 'Materia-curso no encontrada');

  const inscripcion = db.query(`
    SELECT 1 FROM alumnos_cursos
    WHERE alumno_id = ? AND curso_id = ?
    LIMIT 1
  `).get(alumno_id, materiaCurso.curso_id);
  if (!inscripcion) throw new HttpError(400, 'El alumno no pertenece al curso de esa materia');

  requireStudentAccess(user, alumno_id);
  requireMateriaCursoAccess(user, materia_curso_id);
  return { alumno_id: Number(alumno_id), materia_curso_id: Number(materia_curso_id), trimestre: Number(trimestre), nota };
}

function guardarCalificacion(calificacion, usuarioId) {
  const { alumno_id, materia_curso_id, trimestre, nota } = calificacion;
  const existente = db.query(
    'SELECT * FROM calificaciones WHERE alumno_id = ? AND materia_curso_id = ? AND trimestre = ?'
  ).get(alumno_id, materia_curso_id, trimestre);

  if (existente) {
    db.query(`
      INSERT INTO auditoria_calificaciones (calificacion_id, usuario_id, nota_anterior, nota_nueva)
      VALUES (?, ?, ?, ?)
    `).run(existente.id, usuarioId, existente.nota, nota);
    db.query(`
      UPDATE calificaciones
      SET nota = ?, modificado_por = ?, modificado_en = datetime('now')
      WHERE id = ?
    `).run(nota, usuarioId, existente.id);
    return { id: existente.id, actualizado: true };
  }

  const result = db.query(`
    INSERT INTO calificaciones (alumno_id, materia_curso_id, trimestre, nota, modificado_por)
    VALUES (?, ?, ?, ?, ?)
  `).run(alumno_id, materia_curso_id, trimestre, nota, usuarioId);
  const id = Number(result.lastInsertRowid);
  db.query(`
    INSERT INTO auditoria_calificaciones (calificacion_id, usuario_id, nota_anterior, nota_nueva)
    VALUES (?, ?, NULL, ?)
  `).run(id, usuarioId, nota);
  return { id, actualizado: false };
}

export const listar = (req, res, next) => {
  try {
    const { alumno_id, materia_curso_id, curso_id } = req.query;
    if (req.user.rol === 'docente') {
      if (alumno_id) requireStudentAccess(req.user, alumno_id);
      if (materia_curso_id) requireMateriaCursoAccess(req.user, materia_curso_id);
      if (curso_id) requireCourseAccess(req.user, curso_id);
    }

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
    if (req.user.rol === 'docente') {
      sql += ' AND mc.docente_id = ?';
      params.push(req.user.docente_id);
    }

    sql += ' ORDER BY a.apellido, a.nombre, m.nombre, c.trimestre';

    res.json(db.query(sql).all(...params));
  } catch (err) { next(err); }
};


export const porAlumno = (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    requireStudentAccess(req.user, alumnoId);

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
    const calificacion = validarCalificacion(req.body, req.user);
    const result = db.transaction(() => guardarCalificacion(calificacion, req.user.id))();
    res.status(result.actualizado ? 200 : 201).json(result);
  } catch (err) { next(err); }
};

export const crearOActualizarMasivo = (req, res, next) => {
  try {
    const { calificaciones } = req.body;
    if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
      throw new HttpError(400, 'calificaciones debe ser un array no vacío');
    }

    const claves = new Set();
    const validadas = calificaciones.map((item) => {
      const calificacion = validarCalificacion(item, req.user);
      const clave = `${calificacion.alumno_id}:${calificacion.materia_curso_id}:${calificacion.trimestre}`;
      if (claves.has(clave)) throw new HttpError(400, 'Hay calificaciones duplicadas en la solicitud');
      claves.add(clave);
      return calificacion;
    });

    const resultados = db.transaction(() =>
      validadas.map((calificacion) => guardarCalificacion(calificacion, req.user.id))
    )();
    res.json({ ok: true, guardadas: resultados.length, resultados });
  } catch (err) { next(err); }
};

export const eliminar = (req, res, next) => {
  try {
    const cal = db.query('SELECT * FROM calificaciones WHERE id = ?').get(req.params.id);
    if (!cal) throw new HttpError(404, 'Calificación no encontrada');

    requireMateriaCursoAccess(req.user, cal.materia_curso_id);

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