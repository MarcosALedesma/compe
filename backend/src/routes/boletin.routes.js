import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/boletin.controller.js';

const router = Router();

// Específicas primero
router.get('/curso/:cursoId', auth, requireRole('directivo'), ctrl.porCurso);

// Genérica al final
router.get('/:alumnoId', auth, ctrl.generar);

export default router;