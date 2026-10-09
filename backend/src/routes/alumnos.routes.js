import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/alumnos.controller.js';

const router = Router();

router.post('/importar', auth, requireRole('directivo'), ctrl.importarCSV);

router.get('/', auth, ctrl.listar);
router.get('/:id', auth, ctrl.obtener);
router.post('/', auth, requireRole('directivo'), ctrl.crear);
router.put('/:id', auth, requireRole('directivo'), ctrl.actualizar);
router.delete('/:id', auth, requireRole('directivo'), ctrl.bajaLogica);
router.post('/:id/curso', auth, requireRole('directivo'), ctrl.asignarCurso);

export default router;