import { db } from '../config/db.js';


export const resumen = (req, res, next) => {
  try {
    const totalAlumnos = db
      .query('SELECT COUNT(*) AS n FROM alumnos WHERE activo = 1')
      .get().n;

    const totalDocentes = db
      .query('SELECT COUNT(*) AS n FROM docentes WHERE activo = 1')
      .get().n;

    const totalCursos = db
      .query('SELECT COUNT(*) AS n FROM cursos')
      .get().n;

    const totalMaterias = db
      .query('SELECT COUNT(*) AS n FROM materias_curso')
      .get().n;

    const alumnosPorAnio = db
      .query(
        `SELECT c.anio, COUNT(a.id) AS total
         FROM cursos c
         LEFT JOIN alumnos a ON a.curso_id = c.id AND a.activo = 1
         GROUP BY c.anio
         ORDER BY c.anio`
      )
      .all();

    const promedioPorCurso = db
      .query(
        `SELECT c.id AS curso_id, c.anio, c.division, c.turno,
                ROUND(AVG(v.promedio), 2) AS promedio_general,
                COUNT(DISTINCT v.alumno_id) AS alumnos_con_notas
         FROM cursos c
         LEFT JOIN materias_curso mc ON mc.curso_id = c.id
         LEFT JOIN v_promedio_anual v ON v.materia_curso_id = mc.id
         GROUP BY c.id
         ORDER BY c.anio, c.division`
      )
      .all();

    const top5Faltas = db
      .query(
        `SELECT v.alumno_id, v.apellido, v.nombre, v.faltas, v.alerta,
                c.anio, c.division
         FROM v_inasistencias v
         LEFT JOIN cursos c ON c.id = v.curso_id
         WHERE v.faltas > 0
         ORDER BY v.faltas DESC
         LIMIT 5`
      )
      .all();

    
    const materiasConMasDesaprobados = db
      .query(
        `SELECT m.nombre AS materia, c.anio, c.division,
                COUNT(*) AS desaprobados,
                ROUND(AVG(v.promedio), 2) AS promedio_materia
         FROM v_promedio_anual v
         JOIN materias_curso mc ON mc.id = v.materia_curso_id
         JOIN materias m ON m.id = mc.materia_id
         JOIN cursos c ON c.id = mc.curso_id
         WHERE v.promedio < 6
         GROUP BY mc.id
         ORDER BY desaprobados DESC, promedio_materia ASC
         LIMIT 5`
      )
      .all();

    res.json({
      totales: {
        alumnos: totalAlumnos,
        docentes: totalDocentes,
        cursos: totalCursos,
        materias: totalMaterias
      },
      alumnosPorAnio,
      promedioPorCurso,
      top5Faltas,
      materiasConMasDesaprobados
    });
  } catch (err) {
    next(err);
  }
};


export const alumnosPorAnio = (req, res, next) => {
  try {
    const rows = db
      .query(
        `SELECT c.anio, COUNT(a.id) AS total
         FROM cursos c
         LEFT JOIN alumnos a ON a.curso_id = c.id AND a.activo = 1
         GROUP BY c.anio
         ORDER BY c.anio`
      )
      .all();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


export const promedioPorCurso = (req, res, next) => {
  try {
    const rows = db
      .query(
        `SELECT c.id AS curso_id, c.anio, c.division, c.turno,
                ROUND(AVG(v.promedio), 2) AS promedio_general,
                COUNT(DISTINCT v.alumno_id) AS alumnos_con_notas
         FROM cursos c
         LEFT JOIN materias_curso mc ON mc.curso_id = c.id
         LEFT JOIN v_promedio_anual v ON v.materia_curso_id = mc.id
         GROUP BY c.id
         ORDER BY c.anio, c.division`
      )
      .all();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


export const topFaltas = (req, res, next) => {
  try {
    const limite = Math.min(Number(req.query.limite) || 5, 50);
    const rows = db
      .query(
        `SELECT v.alumno_id, v.apellido, v.nombre, v.faltas, v.alerta,
                c.anio, c.division
         FROM v_inasistencias v
         LEFT JOIN cursos c ON c.id = v.curso_id
         WHERE v.faltas > 0
         ORDER BY v.faltas DESC
         LIMIT ?`
      )
      .all(limite);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


export const materiasDesaprobadas = (req, res, next) => {
  try {
    const limite = Math.min(Number(req.query.limite) || 5, 50);
    const rows = db
      .query(
        `SELECT m.nombre AS materia, c.anio, c.division,
                COUNT(*) AS desaprobados,
                ROUND(AVG(v.promedio), 2) AS promedio_materia
         FROM v_promedio_anual v
         JOIN materias_curso mc ON mc.id = v.materia_curso_id
         JOIN materias m ON m.id = mc.materia_id
         JOIN cursos c ON c.id = mc.curso_id
         WHERE v.promedio < 6
         GROUP BY mc.id
         ORDER BY desaprobados DESC, promedio_materia ASC
         LIMIT ?`
      )
      .all(limite);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};


export const alertasAsistencia = (req, res, next) => {
  try {
    const umbral = Number(req.query.umbral) || 20;
    const rows = db
      .query(
        `SELECT v.alumno_id, v.apellido, v.nombre, v.faltas,
                c.anio, c.division, c.turno
         FROM v_inasistencias v
         LEFT JOIN cursos c ON c.id = v.curso_id
         WHERE v.faltas >= ?
         ORDER BY v.faltas DESC`
      )
      .all(umbral);
    res.json({ umbral, total: rows.length, alumnos: rows });
  } catch (err) {
    next(err);
  }
};