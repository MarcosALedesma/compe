import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/eventos.controller.js';

const router = Router();

// Específicas primero
router.get('/mes', auth, ctrl.porMes);
router.get('/proximos', auth, ctrl.proximos);

// Genéricas
router.get('/', auth, ctrl.listar);
router.get('/:id', auth, ctrl.obtener);
router.post('/', auth, requireRole('directivo'), ctrl.crear);
router.put('/:id', auth, requireRole('directivo'), ctrl.actualizar);
router.delete('/:id', auth, requireRole('directivo'), ctrl.eliminar);

export default router;