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

export const generar = (req, res, next) => {
  try {
    const { alumnoId } = req.params;

    if (req.user.rol === 'alumno' && req.user.alumno_id !== Number(alumnoId)) {
      throw new HttpError(403, 'Solo podés ver tu propio boletín');
    }

    const alumno = db
      .query(
        `SELECT a.id, a.dni, a.apellido, a.nombre, a.fecha_nac,
                c.id AS curso_id, c.anio, c.division, c.turno, c.ciclo_lectivo
         FROM alumnos a
         LEFT JOIN cursos c ON c.id = a.curso_id
         WHERE a.id = ?`
      )
      .get(alumnoId);
    if (!alumno) throw new HttpError(404, 'Alumno no encontrado');

    const notas = db
      .query(
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

    const promedios = materias.filter((m) => m.promedio !== null).map((m) => m.promedio);
    const promedioGeneral = promedios.length
      ? Number((promedios.reduce((s, v) => s + v, 0) / promedios.length).toFixed(2))
      : null;

    // Faltas
    const faltas = db
      .query('SELECT faltas, alerta FROM v_inasistencias WHERE alumno_id = ?')
      .get(alumnoId) ?? { faltas: 0, alerta: 0 };

    res.json({
      institucion: {
        nombre: 'E.E.T.P. N° 602 "General José de San Martín"',
        direccion: 'San Martín 2260, Venado Tuerto, Santa Fe',
        ciclo_lectivo: alumno.ciclo_lectivo
      },
      alumno: {
        id: alumno.id,
        dni: alumno.dni,
        apellido: alumno.apellido,
        nombre: alumno.nombre,
        fecha_nac: alumno.fecha_nac,
        curso: alumno.anio ? `${alumno.anio}º ${alumno.division}` : null,
        turno: alumno.turno
      },
      materias,
      promedioGeneral,
      faltas: {
        total: faltas.faltas,
        alerta: faltas.alerta === 1
      },
      generadoEn: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};


export const porCurso = (req, res, next) => {
  try {
    const { cursoId } = req.params;

    const curso = db.query('SELECT * FROM cursos WHERE id = ?').get(cursoId);
    if (!curso) throw new HttpError(404, 'Curso no encontrado');

    const alumnos = db
      .query(
        `SELECT id FROM alumnos WHERE curso_id = ? AND activo = 1 ORDER BY apellido, nombre`
      )
      .all(cursoId);

    const boletines = alumnos.map((a) => {
      
      const notas = db
        .query(
          `SELECT c.materia_curso_id, c.trimestre, c.nota, m.nombre AS materia
           FROM calificaciones c
           JOIN materias_curso mc ON mc.id = c.materia_curso_id
           JOIN materias m ON m.id = mc.materia_id
           WHERE c.alumno_id = ?
           ORDER BY m.nombre, c.trimestre`
        )
        .all(a.id);

      const map = new Map();
      for (const n of notas) {
        if (!map.has(n.materia_curso_id)) {
          map.set(n.materia_curso_id, {
            materia: n.materia,
            notas: { 1: null, 2: null, 3: null }
          });
        }
        map.get(n.materia_curso_id).notas[n.trimestre] = n.nota;
      }

      const materias = [...map.values()].map((m) => {
        const valores = Object.values(m.notas).filter((v) => v !== null);
        const promedio = valores.length
          ? Number((valores.reduce((s, v) => s + v, 0) / valores.length).toFixed(2))
          : null;
        return { ...m, promedio, estado: calcularEstado(promedio ?? 0, valores) };
      });

      const alumno = db
        .query('SELECT id, dni, apellido, nombre FROM alumnos WHERE id = ?')
        .get(a.id);

      const promedios = materias.filter((m) => m.promedio !== null).map((m) => m.promedio);
      const promedioGeneral = promedios.length
        ? Number((promedios.reduce((s, v) => s + v, 0) / promedios.length).toFixed(2))
        : null;

      return { alumno, materias, promedioGeneral };
    });

    res.json({ curso, boletines });
  } catch (err) {
    next(err);
  }
};