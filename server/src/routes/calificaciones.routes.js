import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/calificaciones.controller.js';

const router = Router();

// Específicas primero
router.get('/alumno/:alumnoId', auth, requireRole('directivo', 'docente'), ctrl.porAlumno);
router.get('/auditoria', auth, requireRole('directivo'), ctrl.auditoria);
router.post('/bulk', auth, requireRole('directivo', 'docente'), ctrl.crearOActualizarMasivo);

// Genéricas
router.get('/', auth, requireRole('directivo', 'docente'), ctrl.listar);
router.post('/', auth, requireRole('directivo', 'docente'), ctrl.crearOActualizar);
router.delete('/:id', auth, requireRole('directivo', 'docente'), ctrl.eliminar);

export default router;