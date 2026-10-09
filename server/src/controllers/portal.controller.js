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


export const miResumen = (req, res, next) => {
  try {
    const alumnoId = req.user.alumno_id;
    if (!alumnoId) throw new HttpError(403, 'Solo alumnos pueden acceder a este recurso');

    const alumno = db
      .query(
        `SELECT a.id, a.dni, a.apellido, a.nombre, a.fecha_nac,
                c.anio, c.division, c.turno, c.ciclo_lectivo
         FROM alumnos a
         LEFT JOIN cursos c ON c.id = a.curso_id
         WHERE a.id = ?`
      )
      .get(alumnoId);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const notas = db
      .query(
        `SELECT c.materia_curso_id, c.trimestre, c.nota,
                m.nombre AS materia, mc.curso_id,
                d.apellido AS docente_apellido, d.nombre AS docente_nombre
         FROM calificaciones c
         JOIN materias_curso mc ON mc.id = c.materia_curso_id
         JOIN materias m ON m.id = mc.materia_id
         LEFT JOIN docentes d ON d.id = mc.docente_id
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
          docente: n.docente_apellido
            ? `${n.docente_apellido}, ${n.docente_nombre}`
            : null,
          notas: { 1: null, 2: null, 3: null }
        });
      }
      porMateria.get(n.materia_curso_id).notas[n.trimestre] = n.nota;
    }

    const materias = [...porMateria.values()].map((m) => {
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

    const faltas = db
      .query('SELECT faltas, alerta FROM v_inasistencias WHERE alumno_id = ?')
      .get(alumnoId) ?? { faltas: 0, alerta: 0 };

    const hoy = new Date().toISOString().slice(0, 10);
    const proximosEventos = db
      .query(
        `SELECT id, titulo, tipo, fecha_inicio, fecha_fin
         FROM eventos
         WHERE fecha_fin >= ?
           AND (curso_id IS NULL OR curso_id = (SELECT curso_id FROM alumnos WHERE id = ?))
         ORDER BY fecha_inicio
         LIMIT 10`
      )
      .all(hoy, alumnoId);

    res.json({
      alumno,
      materias,
      faltas: {
        total: faltas.faltas,
        alerta: faltas.alerta === 1
      },
      proximosEventos
    });
  } catch (err) {
    next(err);
  }
};

export const misNotas = (req, res, next) => {
  try {
    const alumnoId = req.user.alumno_id;
    if (!alumnoId) throw new HttpError(403, 'Solo alumnos');

    const notas = db
      .query(
        `SELECT c.id, c.trimestre, c.nota, c.modificado_en,
                m.nombre AS materia, mc.id AS materia_curso_id,
                d.apellido AS docente_apellido, d.nombre AS docente_nombre
         FROM calificaciones c
         JOIN materias_curso mc ON mc.id = c.materia_curso_id
         JOIN materias m ON m.id = mc.materia_id
         LEFT JOIN docentes d ON d.id = mc.docente_id
         WHERE c.alumno_id = ?
         ORDER BY m.nombre, c.trimestre`
      )
      .all(alumnoId);

    res.json(notas);
  } catch (err) {
    next(err);
  }
};


export const misFaltas = (req, res, next) => {
  try {
    const alumnoId = req.user.alumno_id;
    if (!alumnoId) throw new HttpError(403, 'Solo alumnos');

    const detalle = db
      .query(
        `SELECT fecha, estado FROM asistencias
         WHERE alumno_id = ?
         ORDER BY fecha DESC`
      )
      .all(alumnoId);

    const total = db
      .query('SELECT faltas, alerta FROM v_inasistencias WHERE alumno_id = ?')
      .get(alumnoId) ?? { faltas: 0, alerta: 0 };

    res.json({
      total: total.faltas,
      alerta: total.alerta === 1,
      detalle
    });
  } catch (err) {
    next(err);
  }
};


export const misEventos = (req, res, next) => {
  try {
    const alumnoId = req.user.alumno_id;
    if (!alumnoId) throw new HttpError(403, 'Solo alumnos');

    const hoy = new Date().toISOString().slice(0, 10);
    const eventos = db
      .query(
        `SELECT id, titulo, tipo, fecha_inicio, fecha_fin
         FROM eventos
         WHERE fecha_fin >= ?
           AND (curso_id IS NULL OR curso_id = (SELECT curso_id FROM alumnos WHERE id = ?))
         ORDER BY fecha_inicio
         LIMIT 20`
      )
      .all(hoy, alumnoId);

    res.json(eventos);
  } catch (err) {
    next(err);
  }
};