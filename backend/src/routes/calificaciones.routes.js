import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/calificaciones.controller.js';

const router = Router();

// Específicas primero
router.get('/alumno/:alumnoId', auth, ctrl.porAlumno);
router.get('/auditoria', auth, requireRole('directivo'), ctrl.auditoria);

// Genéricas
router.get('/', auth, ctrl.listar);
router.post('/', auth, requireRole('directivo', 'docente'), ctrl.crearOActualizar);
router.delete('/:id', auth, requireRole('directivo', 'docente'), ctrl.eliminar);

export default router;