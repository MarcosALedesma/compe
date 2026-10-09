import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/portal.controller.js';

const router = Router();

router.use(auth, requireRole('alumno'));

router.get('/mi-resumen', ctrl.miResumen);
router.get('/mis-notas', ctrl.misNotas);
router.get('/mis-faltas', ctrl.misFaltas);
router.get('/mis-eventos', ctrl.misEventos);

export default router;