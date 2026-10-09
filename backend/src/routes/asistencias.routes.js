import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/asistencias.controller.js';

const router = Router();

// Específicas primero
router.get('/curso/:cursoId', auth, requireRole('directivo', 'docente'), ctrl.porCursoYFecha);
router.get('/resumen', auth, ctrl.resumen);
router.get('/alumno/:alumnoId', auth, ctrl.porAlumno);
router.post('/toma', auth, requireRole('directivo', 'docente'), ctrl.tomarAsistencia);

// Genéricas al final
router.get('/', auth, ctrl.listar);

export default router;