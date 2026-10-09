import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

function calcularEstado(promedio, notas) {
  if (!notas || notas.length === 0) return 'Sin notas';
  if (promedio >= 6 && notas.every((n) => n >= 6)) return 'Aprobado';
  if (promedio >= 6 && notas.some((n) => n >= 4 && n < 6)) return 'Diciembre';
  if (promedio >= 4) return 'Diciembre';
  if (promedio >= 2) return 'Febrero';
  return 'Previa';
}

function armarMaterias(notas) {
  const porMateria = new Map();

  for (const n of notas) {
    if (!porMateria.has(n.materia_curso_id)) {
      porMateria.set(n.materia_curso_id, {
        materia_curso_id: n.materia_curso_id,
        materia: n.materia,
        docente: n.docente_apellido
          ? `${n.docente_apellido}, ${n.docente_nombre}`
          : null,
        notas: { 1: null, 2: null, 3: null },
      });
    }
    porMateria.get(n.materia_curso_id).notas[n.trimestre] = n.nota;
  }

  return [...porMateria.values()].map((m) => {
    const valores = Object.values(m.notas).filter((v) => v !== null);
    const promedio = valores.length
      ? Number((valores.reduce((s, v) => s + v, 0) / valores.length).toFixed(2))
      : null;
    return {
      ...m,
      promedio,
      estado: calcularEstado(promedio ?? 0, valores),
    };
  });
}

function promedioGeneral(materias) {
  const promedios = materias
    .filter((m) => m.promedio !== null)
    .map((m) => m.promedio);
  if (promedios.length === 0) return null;
  return Number(
    (promedios.reduce((s, v) => s + v, 0) / promedios.length).toFixed(2)
  );
}

export const generar = (req, res, next) => {
  try {
    const { alumnoId } = req.params;

    if (req.user.rol === 'alumno' && req.user.alumno_id !== Number(alumnoId)) {
      throw new HttpError(403, 'Solo podés ver tu propio boletín');
    }

    const alumno = db
      .prepare(
        `SELECT a.id, a.dni, a.apellido, a.nombre, a.fecha_nac,
                c.id AS curso_id, c.anio, c.division, c.turno, c.ciclo_lectivo
         FROM alumnos a
         LEFT JOIN cursos c ON c.id = a.curso_id
         WHERE a.id = ?`
      )
      .get(alumnoId);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const notas = db
      .prepare(
        `SELECT c.materia_curso_id, c.trimestre, c.nota,
                m.nombre AS materia,
                d.apellido AS docente_apellido, d.nombre AS docente_nombre
         FROM calificaciones c
         JOIN materias_curso mc ON mc.id = c.materia_curso_id
         JOIN materias m ON m.id = mc.materia_id
         LEFT JOIN docentes d ON d.id = mc.docente_id
         WHERE c.alumno_id = ?
         ORDER BY m.nombre, c.trimestre`
      )
      .all(alumnoId);

    const materias = armarMaterias(notas);
    const promGeneral = promedioGeneral(materias);

    const faltas = db
      .prepare('SELECT faltas, alerta FROM v_inasistencias WHERE alumno_id = ?')
      .get(alumnoId) ?? { faltas: 0, alerta: 0 };

    res.json({
      institucion: {
        nombre: 'E.E.T.P. N° 602 "General José de San Martín"',
        direccion: 'San Martín 2260, Venado Tuerto, Santa Fe',
        ciclo_lectivo: alumno.ciclo_lectivo,
      },
      alumno: {
        id: alumno.id,
        dni: alumno.dni,
        apellido: alumno.apellido,
        nombre: alumno.nombre,
        fecha_nac: alumno.fecha_nac,
        curso: alumno.anio ? `${alumno.anio}º ${alumno.division}` : null,
        turno: alumno.turno,
      },
      materias,
      promedioGeneral: promGeneral,
      faltas: {
        total: faltas.faltas,
        alerta: faltas.alerta === 1,
      },
      generadoEn: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

export const porCurso = (req, res, next) => {
  try {
    const cursoId = Number(req.params.cursoId);

    if (!Number.isInteger(cursoId) || cursoId <= 0) {
      throw new HttpError(400, 'cursoId inválido');
    }

    const curso = db
      .prepare('SELECT * FROM cursos WHERE id = ?')
      .get(cursoId);
    if (!curso) throw new HttpError(404, 'Curso no encontrado');

    const alumnos = db
      .prepare(
        `SELECT id, dni, apellido, nombre
         FROM alumnos
         WHERE curso_id = ? AND activo = 1
         ORDER BY apellido, nombre`
      )
      .all(cursoId);

    const notasCurso = db
      .prepare(
        `SELECT c.alumno_id, c.materia_curso_id, c.trimestre, c.nota,
                m.nombre AS materia
         FROM calificaciones c
         JOIN materias_curso mc ON mc.id = c.materia_curso_id
         JOIN materias m ON m.id = mc.materia_id
         WHERE mc.curso_id = ?
         ORDER BY c.alumno_id, m.nombre, c.trimestre`
      )
      .all(cursoId);

    const notasPorAlumno = new Map();
    for (const n of notasCurso) {
      if (!notasPorAlumno.has(n.alumno_id)) notasPorAlumno.set(n.alumno_id, []);
      notasPorAlumno.get(n.alumno_id).push(n);
    }

    const faltasCurso = db
      .prepare(
        `SELECT a.alumno_id,
                SUM(CASE WHEN a.estado = 'A' THEN 1
                         WHEN a.estado = 'T' THEN 0.5
                         ELSE 0 END) AS faltas
         FROM asistencias a
         JOIN alumnos al ON al.id = a.alumno_id
         WHERE al.curso_id = ?
         GROUP BY a.alumno_id`
      )
      .all(cursoId);

    const faltasPorAlumno = new Map(
      faltasCurso.map((f) => [f.alumno_id, f.faltas ?? 0])
    );

    const boletines = alumnos.map((a) => {
      const notas = notasPorAlumno.get(a.id) ?? [];
      const materias = armarMaterias(notas);
      const promGeneral = promedioGeneral(materias);
      return {
        alumno: {
          id: a.id,
          dni: a.dni,
          apellido: a.apellido,
          nombre: a.nombre,
        },
        materias,
        promedioGeneral: promGeneral,
        faltas: faltasPorAlumno.get(a.id) ?? 0,
      };
    });

    res.json({ curso, total: boletines.length, boletines });
  } catch (err) {
    next(err);
  }
};