import { db } from '../config/db.js';
import { HttpError } from './httpError.js';

export function requireCourseAccess(user, cursoId) {
  if (user.rol === 'directivo') return;
  if (user.rol !== 'docente' || !user.docente_id) {
    throw new HttpError(403, 'No autorizado para acceder a este curso');
  }

  const assigned = db.query(
    'SELECT 1 FROM materias_curso WHERE curso_id = ? AND docente_id = ? LIMIT 1'
  ).get(Number(cursoId), user.docente_id);
  if (!assigned) throw new HttpError(403, 'No tenés asignado este curso');
}

export function requireStudentAccess(user, alumnoId) {
  if (user.rol === 'directivo') return;
  if (user.rol !== 'docente' || !user.docente_id) {
    throw new HttpError(403, 'No autorizado para acceder a este alumno');
  }

  const assigned = db.query(`
    SELECT 1
    FROM alumnos_cursos ac
    JOIN materias_curso mc ON mc.curso_id = ac.curso_id
    WHERE ac.alumno_id = ? AND mc.docente_id = ?
    LIMIT 1
  `).get(Number(alumnoId), user.docente_id);
  if (!assigned) throw new HttpError(403, 'No tenés asignado este alumno');
}

export function requireMateriaCursoAccess(user, materiaCursoId) {
  if (user.rol === 'directivo') return;
  if (user.rol !== 'docente' || !user.docente_id) {
    throw new HttpError(403, 'No autorizado para acceder a esta materia');
  }

  const assigned = db.query(
    'SELECT 1 FROM materias_curso WHERE id = ? AND docente_id = ?'
  ).get(Number(materiaCursoId), user.docente_id);
  if (!assigned) throw new HttpError(403, 'No dictás esta materia');
}
