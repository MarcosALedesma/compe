import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import * as ctrl from '../controllers/usuarios.controller.js';

const router = Router();
router.use(auth, requireRole('directivo'));

router.get('/', ctrl.listar);
router.get('/disponibles', ctrl.disponibles);
router.post('/', ctrl.crear);
router.put('/:id/activo', ctrl.cambiarEstado);
router.put('/:id/password', ctrl.cambiarPassword);

export default router;