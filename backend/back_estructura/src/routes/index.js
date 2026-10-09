import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';

import * as authCtrl from '../controllers/auth.controller.js';
import * as alumnosCtrl from '../controllers/alumnos.controller.js';
import * as docentesCtrl from '../controllers/docentes.controller.js';
import * as cursosCtrl from '../controllers/cursos.controller.js';
import * as materiasCtrl from '../controllers/materias.controller.js';

const router = Router();

// ---- Auth ----
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);

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

export default router;