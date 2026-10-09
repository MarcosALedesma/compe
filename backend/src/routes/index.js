import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

import * as authCtrl from '../controllers/auth.controller.js';
import * as alumnosCtrl from '../controllers/alumnos.controller.js';
import * as docentesCtrl from '../controllers/docentes.controller.js';
import * as cursosCtrl from '../controllers/cursos.controller.js';
import * as materiasCtrl from '../controllers/materias.controller.js';
import * as calificacionesCtrl from '../controllers/calificaciones.controller.js';
import * as asistenciasCtrl from '../controllers/asistencias.controller.js';
import * as eventosCtrl from '../controllers/eventos.controller.js';
import * as panelCtrl from '../controllers/panel.controller.js';
import * as portalCtrl from '../controllers/portal.controller.js';
import * as boletinCtrl from '../controllers/boletin.controller.js';

const router = Router();

// ---- Auth ----
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);

// ---- Alumnos ----
router.post('/alumnos/importar', auth, requireRole('directivo'), alumnosCtrl.importarCSV); // ← NUEVA
router.get('/alumnos', auth, alumnosCtrl.listar);
router.get('/alumnos/:id', auth, alumnosCtrl.obtener);
router.post('/alumnos', auth, requireRole('directivo'), alumnosCtrl.crear);
router.put('/alumnos/:id', auth, requireRole('directivo'), alumnosCtrl.actualizar);
router.delete('/alumnos/:id', auth, requireRole('directivo'), alumnosCtrl.bajaLogica);
router.post('/alumnos/:id/curso', auth, requireRole('directivo'), alumnosCtrl.asignarCurso);

// ---- Alumnos ----
router.get('/alumnos', auth, alumnosCtrl.listar);
router.get('/alumnos/:id', auth, alumnosCtrl.obtener);
router.post('/alumnos', auth, requireRole('directivo'), alumnosCtrl.crear);
router.put('/alumnos/:id', auth, requireRole('directivo'), alumnosCtrl.actualizar);
router.delete('/alumnos/:id', auth, requireRole('directivo'), alumnosCtrl.bajaLogica);
router.post('/alumnos/:id/curso', auth, requireRole('directivo'), alumnosCtrl.asignarCurso);

// ---- Docentes ----
router.get('/docentes', auth, docentesCtrl.listar);
router.get('/docentes/:id', auth, docentesCtrl.obtener);
router.post('/docentes', auth, requireRole('directivo'), docentesCtrl.crear);
router.put('/docentes/:id', auth, requireRole('directivo'), docentesCtrl.actualizar);
router.delete('/docentes/:id', auth, requireRole('directivo'), docentesCtrl.bajaLogica);

// ---- Cursos ----
router.get('/cursos', auth, cursosCtrl.listar);
router.get('/cursos/:id', auth, cursosCtrl.obtener);
router.post('/cursos', auth, requireRole('directivo'), cursosCtrl.crear);
router.put('/cursos/:id', auth, requireRole('directivo'), cursosCtrl.actualizar);
router.delete('/cursos/:id', auth, requireRole('directivo'), cursosCtrl.eliminar);

// ---- Materias ----
router.get('/materias', auth, materiasCtrl.listarMaterias);
router.post('/materias', auth, requireRole('directivo'), materiasCtrl.crearMateria);
router.get('/cursos/:cursoId/materias', auth, materiasCtrl.listarMateriasDeCurso);
router.post('/materias-curso', auth, requireRole('directivo'), materiasCtrl.asignarMateriaACurso);
router.put('/materias-curso/:id', auth, requireRole('directivo'), materiasCtrl.actualizarAsignacion);
router.delete('/materias-curso/:id', auth, requireRole('directivo'), materiasCtrl.eliminarAsignacion);

// ---- Calificaciones ----
router.get('/calificaciones', auth, calificacionesCtrl.listar);
router.get('/calificaciones/alumno/:alumnoId', auth, calificacionesCtrl.porAlumno);
router.get('/calificaciones/auditoria', auth, requireRole('directivo'), calificacionesCtrl.auditoria);
router.post('/calificaciones', auth, requireRole('directivo', 'docente'), calificacionesCtrl.crearOActualizar);
router.delete('/calificaciones/:id', auth, requireRole('directivo', 'docente'), calificacionesCtrl.eliminar);

// ---- Asistencias ----
router.get('/asistencias', auth, asistenciasCtrl.listar);
router.get('/asistencias/curso/:cursoId', auth, requireRole('directivo', 'docente'), asistenciasCtrl.porCursoYFecha);
router.get('/asistencias/resumen', auth, asistenciasCtrl.resumen);
router.get('/asistencias/alumno/:alumnoId', auth, asistenciasCtrl.porAlumno);
router.post('/asistencias/toma', auth, requireRole('directivo', 'docente'), asistenciasCtrl.tomarAsistencia);

// ---- Eventos ----
router.get('/eventos', auth, eventosCtrl.listar);
router.get('/eventos/mes', auth, eventosCtrl.porMes);
router.get('/eventos/proximos', auth, eventosCtrl.proximos);
router.get('/eventos/:id', auth, eventosCtrl.obtener);
router.post('/eventos', auth, requireRole('directivo'), eventosCtrl.crear);
router.put('/eventos/:id', auth, requireRole('directivo'), eventosCtrl.actualizar);
router.delete('/eventos/:id', auth, requireRole('directivo'), eventosCtrl.eliminar);

// ---- Panel de dirección (solo directivo) ----
router.get('/panel/resumen', auth, requireRole('directivo'), panelCtrl.resumen);
router.get('/panel/alumnos-por-anio', auth, requireRole('directivo'), panelCtrl.alumnosPorAnio);
router.get('/panel/promedio-por-curso', auth, requireRole('directivo'), panelCtrl.promedioPorCurso);
router.get('/panel/top-faltas', auth, requireRole('directivo'), panelCtrl.topFaltas);
router.get('/panel/materias-desaprobadas', auth, requireRole('directivo'), panelCtrl.materiasDesaprobadas);
router.get('/panel/alertas-asistencia', auth, requireRole('directivo'), panelCtrl.alertasAsistencia);


// ---- Portal del alumno (solo rol alumno) ----
router.get('/portal/mi-resumen', auth, requireRole('alumno'), portalCtrl.miResumen);
router.get('/portal/mis-notas', auth, requireRole('alumno'), portalCtrl.misNotas);
router.get('/portal/mis-faltas', auth, requireRole('alumno'), portalCtrl.misFaltas);
router.get('/portal/mis-eventos', auth, requireRole('alumno'), portalCtrl.misEventos);

// ---- Boletín ----

router.get('/boletin/:alumnoId', auth, boletinCtrl.generar);
router.get('/boletin/curso/:cursoId', auth, requireRole('directivo'), boletinCtrl.porCurso);
// ---- Alumnos (importar CSV - bonus) ----
router.post('/alumnos/importar', auth, requireRole('directivo'), alumnosCtrl.importarCSV);
export default router;