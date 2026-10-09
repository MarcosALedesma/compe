import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/docentes.controller.js';

const router = Router();

router.get('/', auth, ctrl.listar);
router.get('/:id', auth, ctrl.obtener);
router.post('/', auth, requireRole('directivo'), ctrl.crear);
router.put('/:id', auth, requireRole('directivo'), ctrl.actualizar);
router.delete('/:id', auth, requireRole('directivo'), ctrl.bajaLogica);

export default router;